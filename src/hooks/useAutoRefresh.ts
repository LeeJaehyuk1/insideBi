"use client";

import * as React from "react";

export type RefreshInterval = 0 | 60 | 300 | 600 | 1800; // seconds (0 = off)

export const REFRESH_OPTIONS: { label: string; value: RefreshInterval }[] = [
  { label: "끄기", value: 0 },
  { label: "1분", value: 60 },
  { label: "5분", value: 300 },
  { label: "10분", value: 600 },
  { label: "30분", value: 1800 },
];

export function useAutoRefresh(interval: RefreshInterval, onRefresh: () => void) {
  const callbackRef = React.useRef(onRefresh);
  React.useEffect(() => { callbackRef.current = onRefresh; }, [onRefresh]);

  React.useEffect(() => {
    if (!interval) return;
    const timer = setInterval(() => callbackRef.current(), interval * 1000);
    return () => clearInterval(timer);
  }, [interval]);
}
