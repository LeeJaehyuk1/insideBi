/**
 * custom-dataset-runtime.ts
 *
 * 커스텀 데이터셋(Excel / SQL)의 런타임 레지스트리.
 * localStorage에 저장된 CustomDatasetEntry를 읽어서
 * query-engine이 조회할 수 있도록 메모리에 올립니다.
 *
 * ⚠️ SSR 안전: 런타임 내부에서 window 체크를 수행합니다.
 */

import { loadCustomCatalog } from "@/lib/custom-catalog-store";
import { DatasetSchema } from "@/types/dataset";
import { ColumnMeta } from "@/types/dataset";

type RawRow = Record<string, unknown>;

/** 런타임(메모리) 레지스트리 */
const runtimeData = new Map<string, RawRow[]>();
const runtimeSchemas = new Map<string, DatasetSchema>();

/**
 * Excel 셀 값에서 ColumnType을 추론합니다.
 */
function inferType(samples: unknown[]): ColumnMeta["type"] {
    const nonNull = samples.filter((v) => v !== null && v !== undefined && v !== "");
    if (nonNull.every((v) => typeof v === "number")) return "number";
    if (
        nonNull.every(
            (v) =>
                typeof v === "string" &&
                /^\d{4}[-/]\d{2}/.test(v as string)
        )
    )
        return "date";
    return "string";
}

/**
 * Excel 데이터로부터 DatasetSchema를 자동 생성합니다.
 */
function buildSchemaFromExcel(
    datasetId: string,
    columns: string[],
    rows: RawRow[]
): DatasetSchema {
    const SAMPLE_N = Math.min(rows.length, 10);
    const cols: ColumnMeta[] = columns.map((colKey) => {
        const samples = rows.slice(0, SAMPLE_N).map((r) => r[colKey]);
        const type = inferType(samples);
        const isNumeric = type === "number" || type === "percent" || type === "currency";
        return {
            key: colKey,
            label: colKey,
            type,
            role: isNumeric ? "measure" : "dimension",
            aggregatable: isNumeric,
            filterable: true,
        };
    });

    // 날짜 컬럼이 있으면 defaultDateColumn 설정
    const dateCol = cols.find((c) => c.type === "date");
    const measureCol = cols.find((c) => c.role === "measure");

    return {
        id: datasetId,
        columns: cols,
        defaultDateColumn: dateCol?.key,
        defaultMeasure: measureCol?.key,
        defaultDimension: cols.find((c) => c.role === "dimension")?.key,
    };
}

/**
 * 모든 커스텀 데이터셋을 localStorage에서 읽어 런타임 맵에 등록합니다.
 * 클라이언트 컴포넌트 최상위, 또는 useEffect에서 호출합니다.
 */
export function hydrateCustomDatasets(): void {
    if (typeof window === "undefined") return;

    const entries = loadCustomCatalog();
    for (const entry of entries) {
        const { dataset, excelData } = entry;
        const id = dataset.id;

        if (excelData) {
            // Excel 데이터: rows를 그대로 저장
            runtimeData.set(id, excelData.rows as RawRow[]);
            runtimeSchemas.set(id, buildSchemaFromExcel(id, excelData.columns, excelData.rows as RawRow[]));
        } else if (entry.query) {
            // SQL 쿼리 저장만 된 경우: 빈 데이터, 스키마 없음
            runtimeData.set(id, []);
            runtimeSchemas.set(id, {
                id,
                columns: [],
            });
        }
    }
}

/** 특정 커스텀 데이터셋의 행 데이터 조회 */
export function getCustomDatasetRows(id: string): RawRow[] | undefined {
    return runtimeData.get(id);
}

/** 특정 커스텀 데이터셋의 스키마 조회 */
export function getCustomDatasetSchema(id: string): DatasetSchema | undefined {
    return runtimeSchemas.get(id);
}

/** 커스텀 데이터셋 여부 확인 */
export function isCustomDataset(id: string): boolean {
    return id.startsWith("custom-");
}
