import { dataCatalog } from "@/lib/data-catalog";
import { datasetSchemas } from "@/lib/dataset-schemas";
import { DatasetMeta } from "@/types/builder";
import { DatasetSchema } from "@/types/dataset";
import {
  nplTrend,
  creditGrades,
  sectorExposures,
  concentrationData,
  nplTable,
  pdLgdEad,
  varTimeSeries,
  varSummary,
  stressScenarios,
  sensitivityData,
  lcrNsfrTrend,
  maturityGap,
  liquidityBuffer,
  fundingStructure,
  lcrSummary,
} from "@/lib/mock-data";

type QueryFn = () => Record<string, unknown>[];

interface DatasetRegistryEntry {
  meta: DatasetMeta;
  schema: DatasetSchema;
  queryFn: QueryFn;
}

function wrapScalar(obj: Record<string, unknown>): QueryFn {
  return () => [obj];
}

function findMeta(id: string): DatasetMeta {
  return dataCatalog.find((d) => d.id === id)!;
}

const registry: Record<string, DatasetRegistryEntry> = {
  "npl-trend": {
    meta: findMeta("npl-trend"),
    schema: datasetSchemas["npl-trend"],
    queryFn: () => nplTrend as unknown as Record<string, unknown>[],
  },
  "credit-grades": {
    meta: findMeta("credit-grades"),
    schema: datasetSchemas["credit-grades"],
    queryFn: () => creditGrades as unknown as Record<string, unknown>[],
  },
  "sector-exposure": {
    meta: findMeta("sector-exposure"),
    schema: datasetSchemas["sector-exposure"],
    queryFn: () => sectorExposures as unknown as Record<string, unknown>[],
  },
  "concentration": {
    meta: findMeta("concentration"),
    schema: datasetSchemas["concentration"],
    queryFn: () => concentrationData as unknown as Record<string, unknown>[],
  },
  "npl-summary": {
    meta: findMeta("npl-summary"),
    schema: datasetSchemas["npl-summary"],
    queryFn: wrapScalar(nplTable as unknown as Record<string, unknown>),
  },
  "pd-lgd-ead": {
    meta: findMeta("pd-lgd-ead"),
    schema: datasetSchemas["pd-lgd-ead"],
    queryFn: wrapScalar(pdLgdEad as unknown as Record<string, unknown>),
  },
  "var-trend": {
    meta: findMeta("var-trend"),
    schema: datasetSchemas["var-trend"],
    queryFn: () => varTimeSeries as unknown as Record<string, unknown>[],
  },
  "stress-scenarios": {
    meta: findMeta("stress-scenarios"),
    schema: datasetSchemas["stress-scenarios"],
    queryFn: () => stressScenarios as unknown as Record<string, unknown>[],
  },
  "sensitivity": {
    meta: findMeta("sensitivity"),
    schema: datasetSchemas["sensitivity"],
    queryFn: () => sensitivityData as unknown as Record<string, unknown>[],
  },
  "var-summary": {
    meta: findMeta("var-summary"),
    schema: datasetSchemas["var-summary"],
    queryFn: wrapScalar(varSummary as unknown as Record<string, unknown>),
  },
  "lcr-nsfr-trend": {
    meta: findMeta("lcr-nsfr-trend"),
    schema: datasetSchemas["lcr-nsfr-trend"],
    queryFn: () => lcrNsfrTrend as unknown as Record<string, unknown>[],
  },
  "maturity-gap": {
    meta: findMeta("maturity-gap"),
    schema: datasetSchemas["maturity-gap"],
    queryFn: () => maturityGap as unknown as Record<string, unknown>[],
  },
  "liquidity-buffer": {
    meta: findMeta("liquidity-buffer"),
    schema: datasetSchemas["liquidity-buffer"],
    queryFn: () => liquidityBuffer as unknown as Record<string, unknown>[],
  },
  "funding-structure": {
    meta: findMeta("funding-structure"),
    schema: datasetSchemas["funding-structure"],
    queryFn: () => fundingStructure as unknown as Record<string, unknown>[],
  },
  "lcr-gauge": {
    meta: findMeta("lcr-gauge"),
    schema: datasetSchemas["lcr-gauge"],
    queryFn: wrapScalar(lcrSummary as unknown as Record<string, unknown>),
  },
};

export function getRegistryEntry(id: string): DatasetRegistryEntry | undefined {
  return registry[id];
}

export function getAllRegistryEntries(): DatasetRegistryEntry[] {
  return Object.values(registry);
}
