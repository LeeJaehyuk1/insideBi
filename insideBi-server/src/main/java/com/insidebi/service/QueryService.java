package com.insidebi.service;

import com.insidebi.dto.ColumnInfo;
import com.insidebi.dto.DbQueryRequest;
import com.insidebi.dto.DbQueryResponse;
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
        String sql = request.getSql();
        if (sql == null || !sql.trim().toUpperCase().startsWith("SELECT")) {
            throw new SecurityException("Only SELECT statements are allowed");
        }

        List<Object> params = request.getParams() != null ? request.getParams() : Collections.emptyList();

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        return new DbQueryResponse(rows, rows.size());
    }

    public List<ColumnInfo> getColumns(String tableName, String schema) {
        if (!SAFE_TABLE_NAME.matcher(tableName).matches()) {
            throw new IllegalArgumentException("Invalid table name: " + tableName);
        }

        String schemaName = (schema != null && !schema.isBlank()) ? schema : "public";

        // Get primary keys
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

        // Get columns
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
}
