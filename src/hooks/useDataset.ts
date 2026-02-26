"use client";

import { useState, useEffect } from "react";
import { QueryConfig, QueryMeta } from "@/types/query";
import { executeQuery } from "@/lib/query-engine";

type DatasetStatus = "idle" | "loading" | "success" | "error";

interface UseDatasetResult<T> {
  data: T[];
  meta: QueryMeta | null;
  status: DatasetStatus;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useDataset<T = Record<string, unknown>>(
  config: QueryConfig | null | undefined
): UseDatasetResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<QueryMeta | null>(null);
  const [status, setStatus] = useState<DatasetStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const configKey = config ? JSON.stringify(config) : null;

  useEffect(() => {
    if (!config) {
      setStatus("idle");
      setData([]);
      setMeta(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    executeQuery<T>(config)
      .then((result) => {
        if (!cancelled) {
          setData(result.data);
          setMeta(result.meta);
          setStatus("success");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  return {
    data,
    meta,
    status,
    isLoading: status === "loading",
    isError: status === "error",
    error,
  };
}
