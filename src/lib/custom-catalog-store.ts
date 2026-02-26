/**
 * custom-catalog-store.ts
 * 사용자가 직접 추가한 데이터셋(SQL 쿼리 / Excel)을 localStorage에 저장/로드합니다.
 */

import { DatasetMeta } from "@/types/builder";
import { ParsedExcelData } from "@/components/builder/AddDataCatalogModal";

export interface CustomDatasetEntry {
    dataset: DatasetMeta;
    sourceType: "sql" | "excel";
    query?: string;
    excelData?: ParsedExcelData;
    createdAt: string;
}

const STORAGE_KEY = "insideBi_custom_catalog_v1";

/** localStorage에서 커스텀 카탈로그 목록 읽기 */
export function loadCustomCatalog(): CustomDatasetEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as CustomDatasetEntry[];
    } catch {
        return [];
    }
}

/** 새 항목 추가 후 저장 */
export function addToCustomCatalog(entry: CustomDatasetEntry): CustomDatasetEntry[] {
    const current = loadCustomCatalog();
    const next = [...current, entry];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

/** 항목 삭제 후 저장 */
export function removeFromCustomCatalog(datasetId: string): CustomDatasetEntry[] {
    const current = loadCustomCatalog();
    const next = current.filter((e) => e.dataset.id !== datasetId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

/** 전체 초기화 */
export function clearCustomCatalog(): void {
    localStorage.removeItem(STORAGE_KEY);
}
