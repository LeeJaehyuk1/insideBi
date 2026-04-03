package com.insidebi.service;

import com.insidebi.dto.ColumnInfo;
import com.insidebi.dto.DbQueryRequest;
import com.insidebi.dto.DbQueryResponse;
import com.insidebi.dto.QueryColumn;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueryService {

    private final JdbcTemplate jdbcTemplate;

    private static final Pattern SAFE_TABLE_NAME = Pattern.compile("^[a-z_][a-z0-9_]*$");
    private static final Set<String> NUMBER_TYPES = Set.of(
            "integer", "bigint", "smallint", "numeric", "decimal",
            "real", "double precision", "float", "int4", "int8", "float4", "float8"
    );
    private static final Set<String> DATE_TYPES = Set.of(
            "date", "timestamp", "timestamp without time zone",
            "timestamp with time zone", "time", "time without time zone"
    );

    public DbQueryResponse executeQuery(DbQueryRequest request) {
        String sql = sanitizeSelect(request.getSql());
        List<Object> params = request.getParams() != null ? request.getParams() : Collections.emptyList();

        long startedAt = System.currentTimeMillis();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        long durationMs = System.currentTimeMillis() - startedAt;

        List<QueryColumn> columns = rows.isEmpty()
                ? List.of()
                : rows.get(0).entrySet().stream()
                .map(entry -> new QueryColumn(entry.getKey(), inferValueType(entry.getValue())))
                .toList();

        return new DbQueryResponse(columns, rows, rows.size(), durationMs, sql);
    }

    public List<ColumnInfo> getColumns(String tableName, String schema) {
        if (!SAFE_TABLE_NAME.matcher(tableName).matches()) {
            throw new IllegalArgumentException("Invalid table name: " + tableName);
        }

        String schemaName = (schema != null && !schema.isBlank()) ? schema : "public";

        String pkSql = """
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                  AND tc.table_name = ?
                  AND tc.table_schema = ?
                """;
        Set<String> primaryKeys = new HashSet<>(
                jdbcTemplate.queryForList(pkSql, String.class, tableName, schemaName)
        );

        String colSql = """
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = ?
                  AND table_schema = ?
                ORDER BY ordinal_position
                """;

        List<Map<String, Object>> rawCols = jdbcTemplate.queryForList(colSql, tableName, schemaName);

        List<ColumnInfo> result = new ArrayList<>();
        for (Map<String, Object> row : rawCols) {
            String colName = (String) row.get("column_name");
            String dataType = ((String) row.get("data_type")).toLowerCase();

            String type;
            if (NUMBER_TYPES.contains(dataType)) type = "number";
            else if (DATE_TYPES.contains(dataType)) type = "date";
            else type = "string";

            boolean isPk = primaryKeys.contains(colName);
            String role = isPk ? "identifier"
                    : "number".equals(type) ? "measure"
                    : "dimension";

            result.add(ColumnInfo.builder()
                    .key(colName)
                    .label(colName)
                    .type(type)
                    .role(role)
                    .aggregatable("measure".equals(role))
                    .filterable(true)
                    .build());
        }
        return result;
    }

    private String sanitizeSelect(String rawSql) {
        if (rawSql == null || rawSql.isBlank()) {
            throw new SecurityException("SQL is required");
        }

        String sql = rawSql.trim();
        String normalized = sql.toLowerCase(Locale.ROOT);

        if (!normalized.startsWith("select") && !normalized.startsWith("with")) {
            throw new SecurityException("Only SELECT statements are allowed");
        }
        if (normalized.contains(";")) {
            throw new SecurityException("Only a single statement is allowed");
        }
        if (normalized.contains(" insert ") || normalized.contains(" update ") ||
                normalized.contains(" delete ") || normalized.contains(" drop ") ||
                normalized.contains(" alter ") || normalized.contains(" create ")) {
            throw new SecurityException("Write statements are not allowed");
        }

        return sql;
    }

    private String inferValueType(Object value) {
        if (value == null) return "unknown";
        if (value instanceof Number) return "number";
        if (value instanceof java.time.temporal.Temporal || value instanceof java.util.Date) return "date";
        if (value instanceof Boolean) return "boolean";
        return "string";
    }
}
