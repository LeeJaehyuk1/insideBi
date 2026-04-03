package com.insidebi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class DbQueryResponse {
    private List<QueryColumn> columns;
    private List<Map<String, Object>> rows;
    private int rowCount;
    private long durationMs;
    private String executedSql;
}
