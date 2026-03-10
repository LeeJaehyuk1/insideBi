import { notFound } from "next/navigation";
import { getRegistryEntry } from "@/lib/dataset-registry";
import { categoryMeta } from "@/lib/data-catalog";
import { BrowseDatasetClient } from "@/components/browse/BrowseDatasetClient";

export default function BrowseDatasetPage({ params }: { params: { datasetId: string } }) {
  const entry = getRegistryEntry(params.datasetId);
  if (!entry) notFound();

  const { meta, schema, queryFn } = entry;
  const rows = queryFn() as Record<string, unknown>[];
  const catLabel = categoryMeta[meta.category as keyof typeof categoryMeta]?.label ?? meta.category;

  return (
    <BrowseDatasetClient
      meta={meta}
      schema={schema}
      rawRows={rows}
      catLabel={catLabel}
    />
  );
}
