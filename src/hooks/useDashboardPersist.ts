"use client";

import * as React from "react";
import { WidgetConfig, SavedDashboard } from "@/types/builder";

const STORAGE_KEY = "insidebi_dashboard_v1";

interface PersistedState {
    widgets: WidgetConfig[];
    dashboardName: string;
    savedDashboard: SavedDashboard | null;
    layouts: Record<string, { i: string; x: number; y: number; w: number; h: number }>;
}

function loadState(): PersistedState | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as PersistedState;
    } catch {
        return null;
    }
}

function saveState(state: PersistedState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // localStorage quota exceeded — silent fail
    }
}

export function useDashboardPersist() {
    const [hydrated, setHydrated] = React.useState(false);

    // Load from storage once on mount
    const [widgets, setWidgets] = React.useState<WidgetConfig[]>([]);
    const [dashboardName, setDashboardName] = React.useState("나의 대시보드");
    const [savedDashboard, setSavedDashboard] = React.useState<SavedDashboard | null>(null);
    const [layouts, setLayouts] = React.useState<
        Record<string, { i: string; x: number; y: number; w: number; h: number }>
    >({});

    React.useEffect(() => {
        const persisted = loadState();
        if (persisted) {
            setWidgets(persisted.widgets ?? []);
            setDashboardName(persisted.dashboardName ?? "나의 대시보드");
            setSavedDashboard(persisted.savedDashboard ?? null);
            setLayouts(persisted.layouts ?? {});
        }
        setHydrated(true);
    }, []);

    // Auto-save whenever state changes (after hydration)
    React.useEffect(() => {
        if (!hydrated) return;
        saveState({ widgets, dashboardName, savedDashboard, layouts });
    }, [hydrated, widgets, dashboardName, savedDashboard, layouts]);

    const clearPersist = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch { /* empty */ }
    };

    return {
        hydrated,
        widgets, setWidgets,
        dashboardName, setDashboardName,
        savedDashboard, setSavedDashboard,
        layouts, setLayouts,
        clearPersist,
    };
}
