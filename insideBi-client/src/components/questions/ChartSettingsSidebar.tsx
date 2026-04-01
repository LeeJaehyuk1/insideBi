
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartType } from "@/types/builder";
import type { ColumnMeta } from "@/types/dataset";
import { ChartTypeSelector } from "./ChartTypeSelector";

/* ── VizSettings 타입 ── */
export interface VizSettings {
  xKey: string;
  yKey: string;
  color: string;
  showLabels: boolean;
  showLegend: boolean;
  yLabel: string;
  xLabel: string;
}

export const DEFAULT_VIZ_SETTINGS: VizSettings = {
  xKey: "", yKey: "",
  color: "#509EE3",  // Metabase 기본 파란색
  showLabels: false,
  showLegend: true,
  yLabel: "", xLabel: "",
};

const PRESET_COLORS = [
  "#509EE3","#9CC177","#F9CF48","#F2A86F",
  "#98D9D9","#7172AD","#EF8C8C","#A989C5",
];

/* ── 탭 ── */
type Tab = "data" | "display";

/* ── 설정 Row ── */
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground/80">{label}</label>
      {children}
    </div>
  );
}

/* ── 토글 스위치 ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span className={cn(
        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-4" : "translate-x-1"
      )} />
    </button>
  );
}

/* ── 셀렉트 ── */
function StyledSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ── 메인 컴포넌트 ── */
interface ChartSettingsSidebarProps {
  open: boolean;
  onClose: () => void;
  chartType: ChartType;
  onChartTypeChange: (t: ChartType) => void;
  settings: VizSettings;
  onSettingsChange: (s: Partial<VizSettings>) => void;
  columns: ColumnMeta[];
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
}

export function ChartSettingsSidebar({
  open, onClose,
  chartType, onChartTypeChange,
  settings, onSettingsChange,
  columns, data, xKey, yKey,
}: ChartSettingsSidebarProps) {
  const [tab, setTab] = React.useState<Tab>("data");
  if (!open) return null;

  const resultKeys = data.length ? Object.keys(data[0]) : [];
  const colOptions = resultKeys.map((k) => ({
    value: k,
    label: columns.find((c) => c.key === k)?.label ?? k,
  }));

  const isTable  = chartType === "table";
  const isKpi    = chartType === "kpi";
  const isPie    = chartType === "pie";
  const isNoAxis = isTable || isKpi;

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border bg-background">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-bold text-foreground">시각화 설정</span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── 탭 ── */}
      <div className="flex border-b border-border px-2">
        {(["data", "display"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "data" ? "데이터" : "표시"}
          </button>
        ))}
      </div>

      {/* ── 탭 컨텐츠 ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── 데이터 탭 ── */}
        {tab === "data" && (
          <div className="p-4 space-y-5">

            {/* 차트 타입 */}
            <div>
              <p className="text-xs font-bold text-foreground mb-3">차트 타입</p>
              <ChartTypeSelector
                selected={chartType}
                data={data}
                xKey={xKey}
                onChange={onChartTypeChange}
              />
            </div>

            {/* 축 설정 */}
            {!isNoAxis && colOptions.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-3">
                  <p className="text-xs font-bold text-foreground">
                    {isPie ? "파이 차트 데이터" : "축 데이터"}
                  </p>

                  {!isPie && (
                    <SettingRow label="X축 (가로)">
                      <StyledSelect
                        value={settings.xKey || xKey}
                        onChange={(v) => onSettingsChange({ xKey: v })}
                        options={colOptions}
                      />
                    </SettingRow>
                  )}

                  <SettingRow label={isPie ? "값" : "Y축 (세로)"}>
                    <StyledSelect
                      value={settings.yKey || yKey}
                      onChange={(v) => onSettingsChange({ yKey: v })}
                      options={colOptions}
                    />
                  </SettingRow>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 표시 탭 ── */}
        {tab === "display" && (
          <div className="p-4 space-y-5">

            {/* 색상 */}
            {!isTable && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground">색상</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onSettingsChange({ color: c })}
                      className={cn(
                        "h-9 w-full rounded-lg border-2 transition-all hover:scale-105",
                        settings.color === c
                          ? "border-foreground shadow-md scale-105"
                          : "border-transparent hover:border-muted-foreground/30"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => onSettingsChange({ color: e.target.value })}
                    className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                  />
                  <span className="text-xs text-muted-foreground">커스텀 색상</span>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{settings.color}</span>
                </div>
              </div>
            )}

            {/* 축 레이블 */}
            {!isNoAxis && !isPie && (
              <>
                {!isTable && <div className="h-px bg-border" />}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-foreground">축 레이블</p>
                  <SettingRow label="X축 레이블">
                    <input
                      value={settings.xLabel}
                      onChange={(e) => onSettingsChange({ xLabel: e.target.value })}
                      placeholder="자동"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </SettingRow>
                  <SettingRow label="Y축 레이블">
                    <input
                      value={settings.yLabel}
                      onChange={(e) => onSettingsChange({ yLabel: e.target.value })}
                      placeholder="자동"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </SettingRow>
                </div>
              </>
            )}

            {/* 표시 옵션 */}
            {!isNoAxis && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-3">
                  <p className="text-xs font-bold text-foreground">표시 옵션</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">데이터 레이블 표시</span>
                    <Toggle
                      checked={settings.showLabels}
                      onChange={() => onSettingsChange({ showLabels: !settings.showLabels })}
                    />
                  </div>
                  {!isPie && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">범례 표시</span>
                      <Toggle
                        checked={settings.showLegend}
                        onChange={() => onSettingsChange({ showLegend: !settings.showLegend })}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
