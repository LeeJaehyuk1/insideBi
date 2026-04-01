package com.insidebi.controller;

import com.insidebi.dto.ColumnInfo;
import com.insidebi.dto.DbQueryRequest;
import com.insidebi.dto.DbQueryResponse;
import com.insidebi.service.QueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QueryController {

    private final QueryService queryService;

    /** POST /api/db-query */
    @PostMapping("/db-query")
    public ResponseEntity<?> executeQuery(@RequestBody DbQueryRequest request) {
        try {
            DbQueryResponse response = queryService.executeQuery(request);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Query error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/db-columns?table=xxx&schema=public */
    @GetMapping("/db-columns")
    public ResponseEntity<?> getColumns(
            @RequestParam String table,
            @RequestParam(required = false, defaultValue = "public") String schema) {
        try {
            List<ColumnInfo> columns = queryService.getColumns(table, schema);
            return ResponseEntity.ok(Map.of("columns", columns));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Column fetch error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
