package com.insidebi.dto;

import lombok.Data;
import java.util.List;

@Data
public class DbQueryRequest {
    private String sql;
    private List<Object> params;
}
