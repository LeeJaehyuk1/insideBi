package com.insidebi.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ColumnInfo {
    private String key;
    private String label;
    private String type;       // "number" | "date" | "string"
    private String role;       // "identifier" | "measure" | "dimension"
    private boolean aggregatable;
    private boolean filterable;
}
