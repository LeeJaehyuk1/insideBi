import {
  kriCards,
  nplTable,
  nplTrend,
  varSummary,
  stressScenarios,
  lcrSummary,
  lcrNsfrTrend,
  sectorExposures,
  top20Borrowers,
  pdLgdEad,
  maturityGap,
  fundingStructure,
} from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";
import { RiskStatusBadge } from "@/components/dashboard/RiskStatusBadge";
import { ReportMeta } from "@/lib/mock-data";

interface Props {
  report: ReportMeta;
}

// ── 공통 헤더 ────────────────────────────────────────────────
function ReportHeader({ report }: { report: ReportMeta }) {
  return (
    <div className="border-b pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <p className="text-muted-foreground mt-1">{report.summary}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground space-y-0.5">
          <p>작성: {report.author}</p>
          <p>기간: {report.period}</p>
          <p>작성일: {report.createdAt}</p>
          {report.pages > 0 && <p>쪽수: {report.pages}p</p>}
        </div>
      </div>
    </div>
  );
}

// ── 1. KRI 요약 ────────────────────────────────────────────────
function SectionKRI({ n, categories }: { n: number; categories?: string[] }) {
  const cards = categories ? kriCards.filter((k) => categories.includes(k.category)) : kriCards;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{n}. 주요 리스크 지표 (KRI) 요약</h2>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-left text-xs">지표</th>
            <th className="border px-3 py-2 text-right text-xs">현재값</th>
            <th className="border px-3 py-2 text-center text-xs">상태</th>
            <th className="border px-3 py-2 text-center text-xs">전월대비</th>
            <th className="border px-3 py-2 text-left text-xs">설명</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((k) => (
            <tr key={k.id} className="border-b">
              <td className="border px-3 py-2 text-xs font-medium">{k.title}</td>
              <td className="border px-3 py-2 text-right text-xs font-bold tabular-nums">{k.displayValue}</td>
              <td className="border px-3 py-2 text-center">
                <RiskStatusBadge severity={k.severity} size="sm" />
              </td>
              <td className="border px-3 py-2 text-center text-xs">
                {k.trend === "up" ? "▲" : k.trend === "down" ? "▼" : "→"}{" "}
                {k.trendValue > 0 ? "+" : ""}{k.trendValue}
              </td>
              <td className="border px-3 py-2 text-xs text-muted-foreground">{k.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── 2. 신용리스크 ────────────────────────────────────────────────
function SectionCredit({ n, period }: { n: number; period?: string }) {
  const recent3 = nplTrend.slice(-3);
  return (
    <section className="print-break">
      <h2 className="text-lg font-semibold mb-4">{n}. 신용리스크 현황 {period && `(${period})`}</h2>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "NPL 비율", value: formatPct(nplTable.nplRatio) },
          { label: "대손충당금 적립률", value: formatPct(nplTable.provisionRatio, 1) },
          { label: "순 NPL 비율", value: formatPct(nplTable.netNpl) },
          { label: "총 여신 잔액", value: formatKRW(nplTable.totalLoan) },
        ].map((item) => (
          <div key={item.label} className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium text-muted-foreground mb-2">최근 3개월 NPL 추이</p>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-center text-xs">기준월</th>
            <th className="border px-3 py-2 text-right text-xs">NPL 비율</th>
            <th className="border px-3 py-2 text-right text-xs">고정</th>
            <th className="border px-3 py-2 text-right text-xs">회수의문</th>
            <th className="border px-3 py-2 text-right text-xs">추정손실</th>
          </tr>
        </thead>
        <tbody>
          {recent3.map((row) => (
            <tr key={row.month} className="border-b">
              <td className="border px-3 py-2 text-center text-xs">{row.month}</td>
              <td className="border px-3 py-2 text-right text-xs font-semibold tabular-nums">{formatPct(row.npl)}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{formatPct(row.substandard)}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{formatPct(row.doubtful)}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{formatPct(row.loss)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── 3. 시장리스크 ────────────────────────────────────────────────
function SectionMarket({ n }: { n: number }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{n}. 시장리스크 현황</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "일일 VaR (99%)", value: formatKRW(varSummary.current) },
          { label: "VaR 한도 소진율", value: formatPct(varSummary.utilization, 1) },
          { label: "20일 평균 VaR", value: formatKRW(varSummary.avgLast20) },
        ].map((item) => (
          <div key={item.label} className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium text-muted-foreground mb-2">민감도 지표</p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Delta (억)", value: varSummary.delta.toLocaleString() },
          { label: "Gamma (억)", value: varSummary.gamma.toLocaleString() },
          { label: "Vega (억)", value: varSummary.vega.toLocaleString() },
          { label: "Rho (억)", value: varSummary.rho.toLocaleString() },
        ].map((item) => (
          <div key={item.label} className="border rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-base font-bold mt-0.5 tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 4. 유동성리스크 ────────────────────────────────────────────────
function SectionLiquidity({ n }: { n: number }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{n}. 유동성리스크 현황</h2>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "LCR", value: formatPct(lcrSummary.lcr, 1), threshold: "규제최저 100%" },
          { label: "NSFR", value: formatPct(lcrSummary.nsfr, 1), threshold: "규제최저 100%" },
          { label: "HQLA", value: formatKRW(lcrSummary.hqla) },
          { label: "순유출액", value: formatKRW(lcrSummary.netOutflow) },
        ].map((item) => (
          <div key={item.label} className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              {item.label}{"threshold" in item ? ` (${item.threshold})` : ""}
            </p>
            <p className="text-xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium text-muted-foreground mb-2">LCR/NSFR 3개월 추이</p>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-center text-xs">기준월</th>
            <th className="border px-3 py-2 text-right text-xs">LCR</th>
            <th className="border px-3 py-2 text-right text-xs">NSFR</th>
            <th className="border px-3 py-2 text-right text-xs">HQLA(억)</th>
          </tr>
        </thead>
        <tbody>
          {lcrNsfrTrend.slice(-3).map((row) => (
            <tr key={row.month} className="border-b">
              <td className="border px-3 py-2 text-center text-xs">{row.month}</td>
              <td className="border px-3 py-2 text-right text-xs font-semibold tabular-nums">{formatPct(row.lcr, 1)}</td>
              <td className="border px-3 py-2 text-right text-xs font-semibold tabular-nums">{formatPct(row.nsfr, 1)}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{row.hqla.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── 5. 스트레스 테스트 ────────────────────────────────────────────────
function SectionStress({ n, expanded }: { n: number; expanded?: boolean }) {
  return (
    <section className="print-break">
      <h2 className="text-lg font-semibold mb-4">{n}. 스트레스 테스트 결과</h2>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-left text-xs">시나리오</th>
            {expanded && <th className="border px-3 py-2 text-right text-xs">신용손실(억)</th>}
            {expanded && <th className="border px-3 py-2 text-right text-xs">시장손실(억)</th>}
            {expanded && <th className="border px-3 py-2 text-right text-xs">유동성손실(억)</th>}
            <th className="border px-3 py-2 text-right text-xs">총손실(억)</th>
            <th className="border px-3 py-2 text-right text-xs">충격 후 BIS</th>
            <th className="border px-3 py-2 text-center text-xs">자본 충분성</th>
          </tr>
        </thead>
        <tbody>
          {stressScenarios.map((s, i) => (
            <tr key={i} className="border-b">
              <td className="border px-3 py-2 text-xs">{s.name.replace("\n", " ")}</td>
              {expanded && <td className="border px-3 py-2 text-right text-xs tabular-nums">{s.creditLoss.toLocaleString()}</td>}
              {expanded && <td className="border px-3 py-2 text-right text-xs tabular-nums">{s.marketLoss.toLocaleString()}</td>}
              {expanded && <td className="border px-3 py-2 text-right text-xs tabular-nums">{s.liquidityLoss.toLocaleString()}</td>}
              <td className="border px-3 py-2 text-right text-xs font-semibold tabular-nums">{s.total.toLocaleString()}</td>
              <td className={`border px-3 py-2 text-right text-xs font-semibold ${s.bisAfter < 10.5 ? "text-red-600" : "text-green-600"}`}>
                {formatPct(s.bisAfter, 1)}
              </td>
              <td className="border px-3 py-2 text-center text-xs">
                {s.bisAfter >= 13.0 ? "✔ 양호" : s.bisAfter >= 10.5 ? "△ 주의" : "✗ 위험"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {expanded && (
        <p className="text-xs text-muted-foreground mt-2">
          * BIS 기준: 위험 &lt; 10.5% / 주의 10.5~13.0% / 양호 ≥ 13.0%
        </p>
      )}
    </section>
  );
}

// ── 6. 섹터 익스포저 (연간) ────────────────────────────────────────────────
function SectionSectorExposure({ n }: { n: number }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{n}. 섹터별 신용 익스포저</h2>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-left text-xs">섹터</th>
            <th className="border px-3 py-2 text-right text-xs">익스포저(억)</th>
            <th className="border px-3 py-2 text-right text-xs">비중</th>
            <th className="border px-3 py-2 text-right text-xs">PD</th>
          </tr>
        </thead>
        <tbody>
          {sectorExposures.map((s) => (
            <tr key={s.sector} className="border-b">
              <td className="border px-3 py-2 text-xs font-medium">{s.sector}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{s.amount.toLocaleString()}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{formatPct(s.pct, 1)}</td>
              <td className={`border px-3 py-2 text-right text-xs font-semibold ${s.pd > 2 ? "text-red-600" : s.pd > 1.5 ? "text-yellow-600" : "text-green-600"}`}>
                {formatPct(s.pd)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "PD", value: formatPct(pdLgdEad.pd) },
          { label: "LGD", value: formatPct(pdLgdEad.lgd, 1) },
          { label: "기대손실(EL)", value: formatKRW(pdLgdEad.expectedLoss) },
        ].map((item) => (
          <div key={item.label} className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">상위 5개 차주</p>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-center text-xs">순위</th>
            <th className="border px-3 py-2 text-left text-xs">차주명</th>
            <th className="border px-3 py-2 text-right text-xs">익스포저(억)</th>
            <th className="border px-3 py-2 text-right text-xs">비중</th>
            <th className="border px-3 py-2 text-center text-xs">신용등급</th>
            <th className="border px-3 py-2 text-left text-xs">업종</th>
          </tr>
        </thead>
        <tbody>
          {top20Borrowers.map((b) => (
            <tr key={b.rank} className="border-b">
              <td className="border px-3 py-2 text-center text-xs">{b.rank}</td>
              <td className="border px-3 py-2 text-xs font-medium">{b.name}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{b.amount.toLocaleString()}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{formatPct(b.pct)}</td>
              <td className="border px-3 py-2 text-center text-xs font-semibold">{b.grade}</td>
              <td className="border px-3 py-2 text-xs">{b.sector}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── 7. 규제비율 (규제 보고서) ────────────────────────────────────────────────
function SectionRegulatory({ n }: { n: number }) {
  const bisKri = kriCards.filter((k) => ["bis", "cet1", "leverage"].includes(k.id));
  const liqKri = kriCards.filter((k) => ["lcr", "nsfr"].includes(k.id));

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">{n}. 규제비율 준수 현황</h2>

      <p className="text-xs font-medium text-muted-foreground mb-2">자본 규제비율</p>
      <table className="w-full text-sm border mb-4">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-left text-xs">지표</th>
            <th className="border px-3 py-2 text-right text-xs">현재값</th>
            <th className="border px-3 py-2 text-right text-xs">규제최저</th>
            <th className="border px-3 py-2 text-center text-xs">준수 여부</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: "BIS 자기자본비율", value: "15.3%", threshold: "8.0%", ok: true },
            { label: "CET1 비율", value: "13.1%", threshold: "4.5%", ok: true },
            { label: "레버리지비율", value: "5.8%", threshold: "3.0%", ok: true },
          ].map((row) => (
            <tr key={row.label} className="border-b">
              <td className="border px-3 py-2 text-xs font-medium">{row.label}</td>
              <td className="border px-3 py-2 text-right text-xs font-bold tabular-nums">{row.value}</td>
              <td className="border px-3 py-2 text-right text-xs text-muted-foreground">{row.threshold}</td>
              <td className={`border px-3 py-2 text-center text-xs font-semibold ${row.ok ? "text-green-600" : "text-red-600"}`}>
                {row.ok ? "✔ 준수" : "✗ 미달"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs font-medium text-muted-foreground mb-2">유동성 규제비율</p>
      <table className="w-full text-sm border mb-4">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-left text-xs">지표</th>
            <th className="border px-3 py-2 text-right text-xs">현재값</th>
            <th className="border px-3 py-2 text-right text-xs">규제최저</th>
            <th className="border px-3 py-2 text-center text-xs">준수 여부</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: "유동성커버리지비율 (LCR)", value: formatPct(lcrSummary.lcr, 1), threshold: "100%", ok: lcrSummary.lcr >= 100 },
            { label: "순안정자금조달비율 (NSFR)", value: formatPct(lcrSummary.nsfr, 1), threshold: "100%", ok: lcrSummary.nsfr >= 100 },
          ].map((row) => (
            <tr key={row.label} className="border-b">
              <td className="border px-3 py-2 text-xs font-medium">{row.label}</td>
              <td className="border px-3 py-2 text-right text-xs font-bold tabular-nums">{row.value}</td>
              <td className="border px-3 py-2 text-right text-xs text-muted-foreground">{row.threshold}</td>
              <td className={`border px-3 py-2 text-center text-xs font-semibold ${row.ok ? "text-green-600" : "text-red-600"}`}>
                {row.ok ? "✔ 준수" : "✗ 미달"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs font-medium text-muted-foreground mb-2">만기갭 현황 (단위: 억원)</p>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border px-3 py-2 text-left text-xs">만기 구간</th>
            <th className="border px-3 py-2 text-right text-xs">자산</th>
            <th className="border px-3 py-2 text-right text-xs">부채</th>
            <th className="border px-3 py-2 text-right text-xs">갭</th>
          </tr>
        </thead>
        <tbody>
          {maturityGap.map((row) => (
            <tr key={row.bucket} className="border-b">
              <td className="border px-3 py-2 text-xs">{row.bucket}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{row.assets.toLocaleString()}</td>
              <td className="border px-3 py-2 text-right text-xs tabular-nums">{row.liabilities.toLocaleString()}</td>
              <td className={`border px-3 py-2 text-right text-xs font-semibold tabular-nums ${row.gap < 0 ? "text-red-600" : "text-green-600"}`}>
                {row.gap > 0 ? "+" : ""}{row.gap.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export function PrintableReport({ report }: Props) {
  const { type } = report;

  const isMonthly = type === "monthly";
  const isQuarterly = type === "quarterly";
  const isAnnual = type === "annual";
  const isStress = type === "stress";
  const isRegulatory = type === "regulatory";

  // 타입별 섹션 번호 계산
  let n = 0;
  const S = () => ++n;

  return (
    <div className="space-y-8 print:space-y-6">
      <ReportHeader report={report} />

      {/* KRI: 스트레스 외 모든 보고서 */}
      {!isStress && <SectionKRI n={S()} categories={isRegulatory ? ["credit", "liquidity"] : undefined} />}

      {/* 신용/시장/유동성: 월간·분기·연간 */}
      {(isMonthly || isQuarterly || isAnnual) && <SectionCredit n={S()} period={report.period} />}
      {(isMonthly || isQuarterly || isAnnual) && <SectionMarket n={S()} />}
      {(isMonthly || isQuarterly || isAnnual) && <SectionLiquidity n={S()} />}

      {/* 스트레스 테스트: 분기·연간·스트레스(확장) */}
      {(isQuarterly || isAnnual || isStress) && <SectionStress n={S()} expanded={isStress} />}

      {/* 섹터 익스포저 + 상위 차주: 연간만 */}
      {isAnnual && <SectionSectorExposure n={S()} />}

      {/* 규제비율 상세: 규제 보고서만 */}
      {isRegulatory && <SectionRegulatory n={S()} />}
    </div>
  );
}
