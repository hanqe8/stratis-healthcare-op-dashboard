import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { casesToCsv } from "./logic/csv";
import { SAMPLE_CASES } from "./data/sampleCases";
import {
  briefToMarkdownWithGraphs,
  createBriefPdf,
  createBriefDocx,
  type BriefExportFormat,
  type BriefExportGraph,
} from "./logic/exportBrief";
import {
  BLOCKER_CATEGORY_LABELS,
  DECISION_ACTION_LABELS,
  GOVERNANCE_EVENT_TYPE_LABELS,
  RECOMMENDATION_STATUS_LABELS,
  RISK_LEVEL_LABELS,
  formatBlockerCategory,
  formatDecisionAction,
  formatRecommendationStatus,
} from "./logic/display";
import { generateBrief, type BriefDetailMode, type BriefDuration } from "./logic/generateBrief";
import { createDecisionEvent, createHumanDecision, createSystemEvent } from "./logic/governance";
import { hasSlaBreach } from "./logic/scorePriority";
import { createInitialDataset, loadDataset, resetDataset, saveDataset } from "./logic/storage";
import type {
  AppDataset,
  BlockerCategory,
  CaseRecord,
  DecisionAction,
  GovernanceEvent,
  HumanDecision,
  KpiMetric,
  Recommendation,
  RecommendationStatus,
  RiskLevel,
} from "./types/models";

type Page =
  | "Overview"
  | "Command Centre"
  | "Escalation Queue"
  | "Human Review"
  | "KPI Tree"
  | "Governance Log"
  | "Weekly Brief"
  | "Settings";

type ThemeMode = "light" | "dark";
type CycleTimeframe = "Daily" | "Weekly" | "Monthly";
type BriefViewMode = "Text" | "Markdown";
type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{ createWritable: () => Promise<{ write: (blob: Blob) => Promise<void>; close: () => Promise<void> }> }>;
};
type RiskFilter = RiskLevel | "All";
type StatusFilter = RecommendationStatus | "All";
type GovernanceEventFilter = string | "All";
type GovernanceCategoryFilter = string | "All";
type GovernanceRiskFilter = RiskLevel | "All";
type SortDirection = "asc" | "desc";
type CommandSortKey = "case" | "ward" | "readiness" | "category" | "owner" | "sla" | "risk";

interface ConfigOption {
  value: string;
  label: string;
}

interface TaxonomyChange {
  id: string;
  timestamp: string;
  action: "Added" | "Removed";
  taxonomy: "Event Type" | "Category";
  label: string;
}

interface PendingTaxonomyDelete {
  value: string;
  label: string;
  taxonomy: TaxonomyChange["taxonomy"];
}

const PAGES: Page[] = [
  "Overview",
  "Command Centre",
  "Escalation Queue",
  "Human Review",
  "KPI Tree",
  "Governance Log",
  "Weekly Brief",
  "Settings",
];

const PAGE_LABELS: Record<Page, string> = {
  Overview: "Overview",
  "Command Centre": "Command Centre",
  "Escalation Queue": "Escalation Queue",
  "Human Review": "Human Review",
  "KPI Tree": "KPI Tree",
  "Governance Log": "Governance Log",
  "Weekly Brief": "Operating Brief",
  Settings: "Settings",
};

function PageIcon({ page }: { page: Page }) {
  if (page === "Settings") {
    return (
      <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
        <path
          d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  const paths: Record<Page, string> = {
    Overview: "M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Z",
    "Command Centre": "M4 6h16M4 12h10M4 18h16M17 10l3 2-3 2",
    "Escalation Queue": "M12 4l8 14H4L12 4Zm0 5v4m0 3h.01",
    "Human Review": "M9 12l2 2 4-5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    "KPI Tree": "M5 19V5m7 14V9m7 10v-7M4 19h16",
    "Governance Log": "M7 4h10l3 3v13H7V4Zm10 0v4h4M10 11h7M10 15h7",
    "Weekly Brief": "M6 4h12v16H6V4Zm3 5h6M9 13h6M9 17h4",
    Settings: "",
  };
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d={paths[page]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

const REVIEWERS = ["Ops Reviewer", "Discharge Coordinator", "Bed Manager", "Clinical Operations Lead"];
const DEPARTMENT_OPTIONS = [
  "Allied Health Lead",
  "Bed Manager",
  "Caregiver Liaison",
  "Discharge Coordinator",
  "Equipment Coordinator",
  "Finance Counsellor",
  "Medical Team Lead",
  "Pharmacy Lead",
  "Transport Coordinator",
];

function sortConfigOptions(options: ConfigOption[]): ConfigOption[] {
  return options.slice().sort((a, b) => a.label.localeCompare(b.label));
}

function createTaxonomyChange(change: Omit<TaxonomyChange, "id" | "timestamp">): TaxonomyChange {
  return {
    id: `tax-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...change,
  };
}

const DEFAULT_CATEGORY_OPTIONS: ConfigOption[] = sortConfigOptions(
  Object.entries(BLOCKER_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
);
const DEFAULT_EVENT_TYPE_OPTIONS: ConfigOption[] = sortConfigOptions(
  Object.entries(GOVERNANCE_EVENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
);

const panelClass = "rounded-md border border-line bg-white shadow-panel dark:border-[#344655] dark:bg-[#1a2733]";
const panelSoftClass = "rounded-md border border-line bg-paper dark:border-[#344655] dark:bg-[#111b24]";
const headingClass = "text-ink dark:text-[#edf3f6]";
const textClass = "text-ink/80 dark:text-[#d7e0e6]";
const mutedClass = "text-moss dark:text-[#a8b5bf]";
const tableHeadClass = "bg-paper text-left text-xs uppercase text-moss dark:bg-[#111b24] dark:text-[#a8b5bf]";
const inputClass =
  "focus-ring mt-1 h-10 w-full rounded-md border border-line bg-white px-3 py-0 leading-10 text-ink dark:border-[#344655] dark:bg-[#111b24] dark:text-[#edf3f6]";
const textareaClass =
  "focus-ring mt-1 min-h-28 w-full rounded-md border border-line bg-white px-3 py-2 leading-5 text-ink dark:border-[#344655] dark:bg-[#111b24] dark:text-[#edf3f6]";
const chartTooltipProps = {
  contentStyle: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#f8fafc",
  },
  itemStyle: { color: "#f8fafc" },
  labelStyle: { color: "#56c7c2", fontWeight: 600 },
};

const axisTickStyle = { fill: "var(--chart-tick)", fontSize: 11, fontWeight: 600 };

const STATUS_CLASS: Record<KpiMetric["status"], string> = {
  Good: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
  Neutral: "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  Warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
  Critical: "border-red-200 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100",
};

const RISK_CLASS: Record<RiskLevel, string> = {
  Critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-700",
  High: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700",
  Medium: "bg-teal/10 text-teal border-teal/20 dark:bg-[#238b87]/20 dark:text-[#56c7c2] dark:border-[#56c7c2]/40",
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700",
};

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildKpis(dataset: AppDataset): KpiMetric[] {
  const currentCases = dataset.cases.filter((caseRecord) => (caseRecord.reportingPeriod ?? "Daily") === "Daily");
  const planned = currentCases.length;
  const ready = currentCases.filter((caseRecord) => caseRecord.dischargeReadiness === "Ready").length;
  const blocked = currentCases.filter((caseRecord) => caseRecord.dischargeReadiness === "Blocked").length;
  const slaBreaches = currentCases.filter(hasSlaBreach).length;
  const activeCases = currentCases.filter((caseRecord) => caseRecord.dischargeReadiness !== "Ready");
  const avgBlockerAge =
    activeCases.length === 0
      ? 0
      : activeCases.reduce((sum, caseRecord) => sum + caseRecord.blockerAgeHours, 0) / activeCases.length;
  const avgBedRisk =
    currentCases.reduce((sum, caseRecord) => sum + caseRecord.bedReleaseRisk, 0) / Math.max(1, planned);
  const closedEscalations = currentCases.filter((caseRecord) => caseRecord.escalationStatus === "Closed").length;
  const totalEscalations = currentCases.filter((caseRecord) => caseRecord.escalationStatus !== "None").length;
  const closureRate = totalEscalations === 0 ? 0 : Math.round((closedEscalations / totalEscalations) * 100);

  return [
    {
      id: "planned",
      label: "Planned Discharges Today",
      value: planned,
      status: "Neutral",
      description: "Synthetic discharge cases loaded for today's operating cycle.",
    },
    {
      id: "ready",
      label: "Ready For Discharge",
      value: ready,
      status: ready >= blocked ? "Good" : "Warning",
      description: "Cases with complete operational discharge readiness.",
    },
    {
      id: "blocked",
      label: "Blocked Discharges",
      value: blocked,
      status: blocked > 5 ? "Critical" : blocked > 2 ? "Warning" : "Neutral",
      description: "Cases needing blocker removal before bed release.",
    },
    {
      id: "sla",
      label: "SLA Breaches",
      value: slaBreaches,
      status: slaBreaches > 2 ? "Critical" : slaBreaches > 0 ? "Warning" : "Good",
      description: "Operational blockers older than their target resolution SLA.",
    },
    {
      id: "age",
      label: "Average Blocker Age",
      value: `${formatNumber(avgBlockerAge)}h`,
      status: avgBlockerAge > 16 ? "Critical" : avgBlockerAge > 8 ? "Warning" : "Good",
      description: "Mean age across pending and blocked cases.",
    },
    {
      id: "bed-risk",
      label: "Bed-Release Risk",
      value: `${formatNumber(avgBedRisk)}/100`,
      status: avgBedRisk > 70 ? "Critical" : avgBedRisk > 45 ? "Warning" : "Good",
      description: "Average operational risk to timely bed release.",
    },
    {
      id: "closure",
      label: "Escalation Closure Rate",
      value: `${closureRate}%`,
      status: closureRate >= 60 ? "Good" : closureRate >= 35 ? "Warning" : "Critical",
      description: "Closed escalations divided by open plus closed escalations.",
    },
  ];
}

function byCategory(recommendations: Recommendation[]) {
  const counts = recommendations.reduce<Record<BlockerCategory, number>>((acc, recommendation) => {
    if (recommendation.category === "Unknown") {
      return acc;
    }
    acc[recommendation.category] = (acc[recommendation.category] ?? 0) + 1;
    return acc;
  }, {} as Record<BlockerCategory, number>);

  return Object.entries(counts)
    .map(([category, count]) => ({
      category: category as BlockerCategory,
      name: formatBlockerCategory(category as BlockerCategory),
      Count: count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function byDepartment(recommendations: Recommendation[]) {
  const counts = recommendations.reduce<Record<string, number>>((acc, recommendation) => {
    acc[recommendation.owner] = (acc[recommendation.owner] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, Count]) => ({ name, Count }))
    .sort((a, b) => b.Count - a.Count);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function saveBlob(filename: string, blob: Blob, description: string, extensions: string[]): Promise<void> {
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description, accept: { [blob.type || "application/octet-stream"]: extensions } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }
  downloadBlob(filename, blob);
}

function downloadText(filename: string, content: string, type: string): void {
  downloadBlob(filename, new Blob([content], { type }));
}

function ensureExtension(filename: string, extension: string): string {
  const cleaned = filename.trim() || `stratis-healthcare-ops-brief.${extension}`;
  return cleaned.toLowerCase().endsWith(`.${extension}`) ? cleaned : `${cleaned.replace(/\.[^.]+$/, "")}.${extension}`;
}

function collectBriefExportGraphs(): BriefExportGraph[] {
  const seen = new Set<string>();
  return Array.from(document.querySelectorAll<HTMLElement>("[data-brief-export-chart]"))
    .map((node, index) => {
      const svg = node.querySelector("svg");
      return {
        title: node.dataset.chartTitle || `Operating Chart ${index + 1}`,
        svg: svg?.outerHTML ?? "",
      };
    })
    .filter((graph) => {
      if (graph.svg.length === 0 || seen.has(graph.title)) {
        return false;
      }
      seen.add(graph.title);
      return true;
    });
}

function normalizeConfigLabel(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function Shell({
  page,
  setPage,
  children,
}: {
  page: Page;
  setPage: (page: Page) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-[#0f1720] dark:text-[#edf3f6]">
      <header className="border-b border-ink bg-ink px-4 py-3 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:px-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <img
                alt="STRATIS portfolio mark"
                className="mt-0.5 h-11 w-11 shrink-0 object-contain"
                src="./portfolio-logo.png"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal dark:text-[#56c7c2]">
                  STRATIS
                </p>
                <h1 className="text-lg font-semibold leading-tight text-white sm:text-xl">
                  Healthcare Ops Command Centre
                </h1>
              </div>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-1 py-2 scroll-px-1">
            {PAGES.map((navPage) => (
              <button
                className={`focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium ${
                  page === navPage
                    ? "border-teal bg-teal text-white shadow-sm dark:border-[#56c7c2] dark:bg-[#238b87]"
                    : "border-white/15 bg-white/10 text-white/85 hover:border-white/30 hover:bg-white/15 hover:text-white"
                }`}
                key={navPage}
                onClick={() => setPage(navPage)}
                type="button"
              >
                <PageIcon page={navPage} />
                {PAGE_LABELS[navPage]}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}

function KpiCards({ metrics }: { metrics: KpiMetric[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <article className={`rounded-md border p-4 shadow-sm ${STATUS_CLASS[metric.status]}`} key={metric.id}>
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{metric.value}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{metric.description}</p>
        </article>
      ))}
    </section>
  );
}

function Overview({ dataset, kpis }: { dataset: AppDataset; kpis: KpiMetric[] }) {
  const categoryData = byCategory(dataset.recommendations);
  const departmentData = byDepartment(dataset.recommendations);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const selectedDepartmentItems = selectedDepartment
    ? dataset.recommendations
        .filter(
          (recommendation) =>
            recommendation.owner === selectedDepartment &&
            recommendation.status !== "Resolved" &&
            recommendation.status !== "Rejected",
        )
        .sort((a, b) => b.priorityScore - a.priorityScore)
    : [];

  return (
    <div className="space-y-6">
      <KpiCards metrics={kpis} />
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className={`${panelClass} flex min-h-[22rem] flex-col p-4`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${headingClass}`}>Operating Signal</h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Blocker Categories</span>
          </div>
          <div className="min-h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ bottom: 8, left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis
                  dataKey="name"
                  height={40}
                  interval={0}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const words = String(payload.value).split(" ");
                    return (
                      <text fill="var(--chart-tick)" fontSize={10} fontWeight={600} textAnchor="middle" x={x} y={y + 12}>
                        {words.map((word, index) => (
                          <tspan dy={index === 0 ? 0 : 11} key={`${word}-${index}`} x={x}>
                            {word}
                          </tspan>
                        ))}
                      </text>
                    );
                  }}
                />
                <YAxis allowDecimals={false} tick={axisTickStyle} />
                <Tooltip {...chartTooltipProps} formatter={(value) => [value, "Count"]} />
                <Bar dataKey="Count" fill="#18716f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${panelClass} p-4`}>
          <h2 className={`text-lg font-semibold ${headingClass}`}>Decision Loop</h2>
          <ol className={`mt-4 space-y-3 text-sm ${textClass}`}>
            {[
              "Signal: synthetic discharge blockers are loaded and classified.",
              "Priority: SLA pressure, blocker age, bed-release risk, and escalation state are scored.",
              "Recommendation: accountable department, confidence, rationale, and next step are generated.",
              "Human decision: accept, override, escalate, resolve, or reject with governance capture.",
              "Operating brief: leadership view summarises status, risks, decisions, and next actions.",
            ].map((item, index) => (
              <li className="flex gap-3" key={item}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className={`${panelClass} p-4`}>
        <h2 className={`text-lg font-semibold ${headingClass}`}>Department Load</h2>
        <p className={`mt-1 text-sm ${mutedClass}`}>
          Count of current recommendations assigned to each accountable department.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {departmentData.map((department) => (
            <button
              className={`${panelSoftClass} focus-ring text-left transition hover:border-teal hover:shadow-panel dark:hover:border-[#56c7c2]`}
              key={department.name}
              onClick={() => setSelectedDepartment(department.name)}
              type="button"
            >
              <div className="flex items-center justify-between p-3">
                <p className={`font-medium ${headingClass}`}>{department.name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                  {department.Count}
                </span>
              </div>
            </button>
          ))}
        </div>
        {selectedDepartment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true" aria-labelledby="department-load-title">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-md border border-line bg-white p-4 shadow-xl dark:border-[#344655] dark:bg-[#1a2733]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`text-lg font-semibold ${headingClass}`} id="department-load-title">
                    {selectedDepartment} Pending Items
                  </h3>
                  <p className={`text-sm ${mutedClass}`}>
                    Active recommendations owned by this department, excluding resolved and rejected items.
                  </p>
                </div>
                <button
                  className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal dark:border-[#344655] dark:text-[#d7e0e6] dark:hover:border-[#56c7c2] dark:hover:text-[#56c7c2]"
                  onClick={() => setSelectedDepartment(null)}
                  type="button"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                {selectedDepartmentItems.length > 0 ? (
                  selectedDepartmentItems.map((recommendation) => (
                    <article className={panelSoftClass} key={recommendation.id}>
                      <div className="grid gap-3 p-3 md:grid-cols-[1fr_auto] md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-semibold ${headingClass}`}>{recommendation.caseId}</span>
                            <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${RISK_CLASS[recommendation.riskLevel]}`}>
                              {recommendation.riskLevel} | {recommendation.priorityScore}
                            </span>
                            <span className="rounded-full border border-teal/25 bg-teal/10 px-2 py-1 text-xs font-semibold text-teal dark:border-[#56c7c2]/40 dark:bg-[#238b87]/20 dark:text-[#56c7c2]">
                              {formatBlockerCategory(recommendation.category)}
                            </span>
                          </div>
                          <p className={`mt-2 text-sm ${textClass}`}>{recommendation.recommendation}</p>
                          <p className={`mt-2 text-sm ${mutedClass}`}>{recommendation.expectedNextStep}</p>
                        </div>
                        <span className="rounded-full border border-line bg-white px-2 py-1 text-xs font-semibold text-moss dark:border-[#344655] dark:bg-[#111b24] dark:text-[#a8b5bf]">
                          {formatRecommendationStatus(recommendation.status)}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className={`rounded-md bg-paper p-3 text-sm dark:bg-[#111b24] ${mutedClass}`}>
                    No pending recommendations for this department.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function StatusMix({ dataset }: { dataset: AppDataset }) {
  const data = [
    { name: "Ready", Count: dataset.cases.filter((caseRecord) => caseRecord.dischargeReadiness === "Ready").length },
    { name: "Pending", Count: dataset.cases.filter((caseRecord) => caseRecord.dischargeReadiness === "Pending").length },
    { name: "Blocked", Count: dataset.cases.filter((caseRecord) => caseRecord.dischargeReadiness === "Blocked").length },
  ];
  const colors = ["#18716f", "#9f741f", "#b14d3a"];
  const total = data.reduce((sum, item) => sum + item.Count, 0);
  const blockedCount = data.find((item) => item.name === "Blocked")?.Count ?? 0;
  const readyCount = data.find((item) => item.name === "Ready")?.Count ?? 0;

  return (
    <div className={`${panelClass} p-4`}>
      <div className="grid items-center gap-4 lg:grid-cols-[1fr_240px_190px]">
        <div>
          <h2 className={`text-lg font-semibold ${headingClass}`}>Readiness Mix</h2>
          <p className={`text-sm ${mutedClass}`}>
            Operational split of discharge readiness. Use this with the table filters to isolate blocked cohorts.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Ready Rate</p>
              <p className={`mt-1 text-xl font-semibold ${headingClass}`}>{Math.round((readyCount / Math.max(1, total)) * 100)}%</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Blocked Load</p>
              <p className={`mt-1 text-xl font-semibold ${headingClass}`}>{blockedCount} Cases</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Operating Queue</p>
              <p className={`mt-1 text-xl font-semibold ${headingClass}`}>{total} Cases</p>
            </div>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie data={data} dataKey="Count" nameKey="name" outerRadius={82}>
                {data.map((entry, index) => (
                  <Cell fill={colors[index]} key={entry.name} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipProps} formatter={(value) => [value, "Count"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {data.map((entry, index) => (
            <div className="flex items-center justify-between rounded-md border border-slate-200 p-2 dark:border-slate-700" key={entry.name}>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colors[index] }} />
                {entry.name}
              </span>
              <span className={`text-sm font-semibold ${headingClass}`}>{entry.Count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommandCentre({ dataset }: { dataset: AppDataset }) {
  const [categoryFilter, setCategoryFilter] = useState<BlockerCategory | "All">("All");
  const [readinessFilter, setReadinessFilter] = useState<CaseRecord["dischargeReadiness"] | "All">("All");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [sortKey, setSortKey] = useState<CommandSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const departments = Array.from(new Set(dataset.recommendations.map((recommendation) => recommendation.owner))).sort();
  const rows = dataset.cases
    .map((caseRecord) => {
      const recommendation = dataset.recommendations.find((rec) => rec.caseId === caseRecord.id);
      return { caseRecord, recommendation };
    })
    .filter(({ caseRecord, recommendation }) => {
      const matchesCategory = categoryFilter === "All" || recommendation?.category === categoryFilter;
      const matchesReadiness = readinessFilter === "All" || caseRecord.dischargeReadiness === readinessFilter;
      const matchesRisk = riskFilter === "All" || recommendation?.riskLevel === riskFilter;
      const matchesDepartment = departmentFilter === "All" || recommendation?.owner === departmentFilter || caseRecord.owner === departmentFilter;
      return matchesCategory && matchesReadiness && matchesRisk && matchesDepartment;
    })
    .sort((a, b) => {
      if (!sortKey) return 0;
      const direction = sortDirection === "asc" ? 1 : -1;
      const valueFor = (row: { caseRecord: CaseRecord; recommendation?: Recommendation }) => {
        if (sortKey === "case") return row.caseRecord.id;
        if (sortKey === "ward") return row.caseRecord.ward;
        if (sortKey === "readiness") return row.caseRecord.dischargeReadiness;
        if (sortKey === "category") return row.recommendation ? formatBlockerCategory(row.recommendation.category) : "N/A";
        if (sortKey === "owner") return row.recommendation?.owner ?? row.caseRecord.owner;
        if (sortKey === "sla") return row.caseRecord.blockerAgeHours / Math.max(1, row.caseRecord.slaHours);
        return row.recommendation?.priorityScore ?? 0;
      };
      const left = valueFor(a);
      const right = valueFor(b);
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left).localeCompare(String(right)) * direction;
    });

  function updateSort(nextKey: CommandSortKey) {
    if (sortKey === nextKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "risk" || nextKey === "sla" ? "desc" : "asc");
  }

  function SortIcon({ column }: { column: CommandSortKey }) {
    const active = sortKey === column;
    if (!active) return null;
    const path =
      sortDirection === "asc"
        ? "M7 11l5-5 5 5M12 6v12"
        : "M7 13l5 5 5-5M12 18V6";
    return (
      <svg
        aria-hidden="true"
        className={`h-3.5 w-3.5 ${active ? "text-teal dark:text-[#56c7c2]" : "text-moss/70 dark:text-[#a8b5bf]"}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <path d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  const sortableHeaderClass = "inline-flex items-center gap-1.5 font-semibold";

  return (
    <section className={panelClass}>
      <div className="border-b border-slate-200 p-4 dark:border-slate-700">
        <h2 className={`text-lg font-semibold ${headingClass}`}>Command Centre</h2>
        <p className={`text-sm ${mutedClass}`}>Synthetic discharge workflow cases linked to recommendation status.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className={`block text-sm font-medium ${textClass}`}>
            Category
            <select className={inputClass} onChange={(event) => setCategoryFilter(event.target.value as BlockerCategory | "All")} value={categoryFilter}>
              <option value="All">All Categories</option>
              {Object.entries(BLOCKER_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={`block text-sm font-medium ${textClass}`}>
            Readiness
            <select className={inputClass} onChange={(event) => setReadinessFilter(event.target.value as CaseRecord["dischargeReadiness"] | "All")} value={readinessFilter}>
              <option value="All">All Readiness States</option>
              <option value="Ready">Ready</option>
              <option value="Pending">Pending</option>
              <option value="Blocked">Blocked</option>
            </select>
          </label>
          <label className={`block text-sm font-medium ${textClass}`}>
            Risk Level
            <select className={inputClass} onChange={(event) => setRiskFilter(event.target.value as RiskFilter)} value={riskFilter}>
              <option value="All">All Risk Levels</option>
              {Object.entries(RISK_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={`block text-sm font-medium ${textClass}`}>
            Department
            <select className={inputClass} onChange={(event) => setDepartmentFilter(event.target.value)} value={departmentFilter}>
              <option value="All">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3"><button className={sortableHeaderClass} type="button" onClick={() => updateSort("case")}>CASE <SortIcon column="case" /></button></th>
              <th className="px-4 py-3"><button className={sortableHeaderClass} type="button" onClick={() => updateSort("ward")}>WARD <SortIcon column="ward" /></button></th>
              <th className="px-4 py-3"><button className={sortableHeaderClass} type="button" onClick={() => updateSort("readiness")}>READINESS <SortIcon column="readiness" /></button></th>
              <th className="px-4 py-3"><button className={sortableHeaderClass} type="button" onClick={() => updateSort("category")}>CATEGORY <SortIcon column="category" /></button></th>
              <th className="px-4 py-3">BLOCKER</th>
              <th className="px-4 py-3"><button className={sortableHeaderClass} type="button" onClick={() => updateSort("owner")}>DEPARTMENT <SortIcon column="owner" /></button></th>
              <th className="px-4 py-3"><button className={sortableHeaderClass} type="button" onClick={() => updateSort("sla")}>SLA <SortIcon column="sla" /></button></th>
              <th className="px-4 py-3"><button className={sortableHeaderClass} type="button" onClick={() => updateSort("risk")}>RISK | SCORE <SortIcon column="risk" /></button></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map(({ caseRecord, recommendation }) => (
              <tr key={caseRecord.id}>
                <td className={`px-4 py-3 font-medium ${headingClass}`}>{caseRecord.id}</td>
                <td className={`px-4 py-3 ${textClass}`}>{caseRecord.ward}</td>
                <td className={`px-4 py-3 ${textClass}`}>{caseRecord.dischargeReadiness}</td>
                <td className={`px-4 py-3 ${textClass}`}>{recommendation ? formatBlockerCategory(recommendation.category) : "N/A"}</td>
                <td className={`max-w-md px-4 py-3 ${textClass}`}>{caseRecord.blockerText}</td>
                <td className={`px-4 py-3 ${textClass}`}>{recommendation?.owner ?? caseRecord.owner}</td>
                <td className={`px-4 py-3 ${textClass}`}>
                  {caseRecord.blockerAgeHours}h / {caseRecord.slaHours}h
                </td>
                <td className="px-4 py-3">
                  {recommendation ? (
                    <span className={`inline-flex max-w-[8rem] flex-wrap items-center gap-x-1 gap-y-0.5 rounded-md border px-2 py-1 text-xs font-semibold leading-tight sm:max-w-none sm:flex-nowrap ${RISK_CLASS[recommendation.riskLevel]}`}>
                      <span>{recommendation.riskLevel}</span>
                      <span className="hidden sm:inline">|</span>
                      <span>{recommendation.priorityScore}</span>
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Queue({ recommendations }: { recommendations: Recommendation[] }) {
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<BlockerCategory | "All">("All");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [search, setSearch] = useState("");
  const departments = Array.from(new Set(recommendations.map((recommendation) => recommendation.owner))).sort();
  const filteredRecommendations = recommendations
    .filter((recommendation) => {
      const matchesCategory = categoryFilter === "All" || recommendation.category === categoryFilter;
      const matchesRisk = riskFilter === "All" || recommendation.riskLevel === riskFilter;
      const matchesStatus = statusFilter === "All" || recommendation.status === statusFilter;
      const matchesDepartment = departmentFilter === "All" || recommendation.owner === departmentFilter;
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          recommendation.caseId,
          recommendation.recommendation,
          recommendation.expectedNextStep,
          recommendation.owner,
          formatBlockerCategory(recommendation.category),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesCategory && matchesRisk && matchesStatus && matchesDepartment && matchesSearch;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const activeFilters = [
    categoryFilter !== "All" ? { label: `Category: ${formatBlockerCategory(categoryFilter)}`, clear: () => setCategoryFilter("All") } : null,
    riskFilter !== "All" ? { label: `Risk: ${riskFilter}`, clear: () => setRiskFilter("All") } : null,
    statusFilter !== "All" ? { label: `Status: ${formatRecommendationStatus(statusFilter)}`, clear: () => setStatusFilter("All") } : null,
    departmentFilter !== "All" ? { label: `Department: ${departmentFilter}`, clear: () => setDepartmentFilter("All") } : null,
    search ? { label: `Search: ${search}`, clear: () => setSearch("") } : null,
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  function clearFilters() {
    setCategoryFilter("All");
    setRiskFilter("All");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setSearch("");
  }

  return (
    <section className="grid gap-4">
      <div className={panelClass}>
        <div className="flex flex-col justify-between gap-3 border-b border-line p-4 md:flex-row md:items-center dark:border-[#344655]">
          <div>
            <h2 className={`text-lg font-semibold ${headingClass}`}>Escalation Queue</h2>
            <p className={`text-sm ${mutedClass}`}>
              Prioritised recommendations filtered by blocker category, risk, status, department, and case text.
            </p>
          </div>
          <button
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal dark:border-[#344655] dark:text-[#d7e0e6] dark:hover:border-[#56c7c2] dark:hover:text-[#56c7c2]"
            onClick={() => setShowFilters(true)}
            type="button"
          >
            Filter Queue
          </button>
        </div>
        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2 p-4">
            {activeFilters.map((filter) => (
              <button
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-teal hover:border-teal/50 dark:border-[#56c7c2]/40 dark:bg-[#238b87]/20 dark:text-[#56c7c2]"
                key={filter.label}
                onClick={filter.clear}
                type="button"
              >
                <span>{filter.label}</span>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal/15 text-teal dark:bg-[#238b87]/30 dark:text-[#56c7c2]" aria-hidden="true">
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {showFilters ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4">
            <div className={`${panelClass} w-full max-w-2xl p-4`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className={`text-lg font-semibold ${headingClass}`}>Filter Escalation Queue</h3>
                <button className={`focus-ring rounded-md px-2 py-1 text-sm font-semibold ${mutedClass}`} onClick={() => setShowFilters(false)} type="button">
                  Close
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className={`block text-sm font-medium ${textClass}`}>
                  Category
                  <select className={inputClass} onChange={(event) => setCategoryFilter(event.target.value as BlockerCategory | "All")} value={categoryFilter}>
                    <option value="All">All Categories</option>
                    {Object.entries(BLOCKER_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`block text-sm font-medium ${textClass}`}>
                  Risk Level
                  <select className={inputClass} onChange={(event) => setRiskFilter(event.target.value as RiskFilter)} value={riskFilter}>
                    <option value="All">All Risk Levels</option>
                    {Object.entries(RISK_LEVEL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`block text-sm font-medium ${textClass}`}>
                  Recommendation Status
                  <select className={inputClass} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}>
                    <option value="All">All Statuses</option>
                    {Object.entries(RECOMMENDATION_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`block text-sm font-medium ${textClass}`}>
                  Department
                  <select className={inputClass} onChange={(event) => setDepartmentFilter(event.target.value)} value={departmentFilter}>
                    <option value="All">All Departments</option>
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`block text-sm font-medium md:col-span-2 ${textClass}`}>
                  Search Case Or Recommendation
                  <input className={inputClass} onChange={(event) => setSearch(event.target.value)} placeholder="Case ID, department, next step, or blocker category" value={search} />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink dark:border-[#344655] dark:text-[#d7e0e6]" onClick={clearFilters} type="button">
                  Clear Filters
                </button>
                <button className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-[#145f5d]" onClick={() => setShowFilters(false)} type="button">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {filteredRecommendations.length > 0 ? (
        filteredRecommendations.map((recommendation) => (
          <article className={`${panelClass} p-4`} key={recommendation.id}>
            <div className="flex flex-col justify-between gap-3 md:flex-row">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`text-lg font-semibold ${headingClass}`}>{recommendation.caseId}</h2>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${RISK_CLASS[recommendation.riskLevel]}`}>
                    {recommendation.riskLevel} | Score {recommendation.priorityScore}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {formatRecommendationStatus(recommendation.status)}
                  </span>
                  <span className="rounded-full border border-teal/25 bg-teal/10 px-2 py-1 text-xs font-semibold text-teal dark:border-[#56c7c2]/40 dark:bg-[#238b87]/20 dark:text-[#56c7c2]">
                    {formatBlockerCategory(recommendation.category)}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${textClass}`}>{recommendation.recommendation}</p>
              </div>
              <div className={`text-sm ${mutedClass} md:text-right`}>
                <p className={`font-medium ${headingClass}`}>Department: {recommendation.owner}</p>
                <p>Confidence {Math.round(recommendation.confidence * 100)}%</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Rationale</p>
                <ul className={`mt-2 space-y-1 text-sm ${textClass}`}>
                  {recommendation.rationale.map((reason) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md bg-teal/10 p-3 dark:bg-[#238b87]/20">
                <p className="text-xs font-semibold uppercase text-teal dark:text-[#56c7c2]">Expected Next Step</p>
                <p className={`mt-2 text-sm ${textClass}`}>{recommendation.expectedNextStep}</p>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className={`${panelClass} p-4`}>
          <p className={`text-sm ${mutedClass}`}>No escalation recommendations match the selected filters.</p>
        </div>
      )}
    </section>
  );
}

function HumanReview({
  dataset,
  onDecision,
}: {
  dataset: AppDataset;
  onDecision: (
    recommendation: Recommendation,
    action: DecisionAction,
    rationale: string,
    reviewer: string,
    assignedOwner: string,
  ) => void;
}) {
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Recommended");
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(dataset.recommendations[0]?.id ?? "");
  const [action, setAction] = useState<DecisionAction>("accept");
  const [rationale, setRationale] = useState("");
  const [reviewer, setReviewer] = useState(REVIEWERS[0]);
  const [assignedOwner, setAssignedOwner] = useState(dataset.recommendations[0]?.owner ?? DEPARTMENT_OPTIONS[0]);
  const [error, setError] = useState("");

  const filteredRecommendations = useMemo(
    () =>
      dataset.recommendations.filter((rec) => {
        const riskMatch = riskFilter === "All" || rec.riskLevel === riskFilter;
        const statusMatch = statusFilter === "All" || rec.status === statusFilter;
        return riskMatch && statusMatch;
      }),
    [dataset.recommendations, riskFilter, statusFilter],
  );

  const recommendation =
    dataset.recommendations.find((rec) => rec.id === selectedRecommendationId) ?? filteredRecommendations[0];

  useEffect(() => {
    if (filteredRecommendations.length === 0) {
      setSelectedRecommendationId("");
      return;
    }
    if (!filteredRecommendations.some((rec) => rec.id === selectedRecommendationId)) {
      setSelectedRecommendationId(filteredRecommendations[0].id);
    }
  }, [filteredRecommendations, selectedRecommendationId]);

  useEffect(() => {
    if (recommendation) {
      setAssignedOwner(recommendation.owner);
    }
  }, [recommendation?.id]);

  function submitDecision() {
    if (!recommendation) {
      setError("No Case Recommendation matches the selected filters.");
      return;
    }
    if ((action === "override" || action === "escalate") && rationale.trim().length < 8) {
      setError("Override and Escalation decisions require a clear rationale.");
      return;
    }
    setError("");
    onDecision(
      recommendation,
      action,
      rationale.trim() || `Reviewer selected ${formatDecisionAction(action)}.`,
      reviewer,
      assignedOwner,
    );
    setRationale("");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className={`${panelClass} p-4`}>
        <h2 className={`text-lg font-semibold ${headingClass}`}>Human Review</h2>
        <p className={`text-sm ${mutedClass}`}>Filter by Severity Level and Recommendation Status, then record the accountable decision.</p>
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className={`block text-sm font-medium ${textClass}`}>
              Severity Level
              <select className={inputClass} onChange={(event) => setRiskFilter(event.target.value as RiskFilter)} value={riskFilter}>
                <option value="All">All Severity Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label className={`block text-sm font-medium ${textClass}`}>
              Recommendation Status
              <select className={inputClass} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}>
                <option value="All">All Statuses</option>
                {Object.keys(RECOMMENDATION_STATUS_LABELS).map((status) => (
                  <option key={status} value={status}>
                    {RECOMMENDATION_STATUS_LABELS[status as RecommendationStatus]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={`block text-sm font-medium ${textClass}`}>
            Case Recommendation
            <select
              className={inputClass}
              disabled={filteredRecommendations.length === 0}
              onChange={(event) => setSelectedRecommendationId(event.target.value)}
              value={recommendation?.id ?? ""}
            >
              {filteredRecommendations.length === 0 ? (
                <option value="">No Matching Case Recommendation</option>
              ) : (
                filteredRecommendations.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.caseId} - {rec.riskLevel} - {formatRecommendationStatus(rec.status)} -{" "}
                    {formatBlockerCategory(rec.category)}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={`block text-sm font-medium ${textClass}`}>
              Decision Action
              <select className={inputClass} onChange={(event) => setAction(event.target.value as DecisionAction)} value={action}>
                {Object.entries(DECISION_ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={`block text-sm font-medium ${textClass}`}>
              Reviewer
              <select className={inputClass} onChange={(event) => setReviewer(event.target.value)} value={reviewer}>
                {REVIEWERS.map((reviewerOption) => (
                  <option key={reviewerOption} value={reviewerOption}>
                    {reviewerOption}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={`block text-sm font-medium ${textClass}`}>
            Accountable Department
            <select className={inputClass} onChange={(event) => setAssignedOwner(event.target.value)} value={assignedOwner}>
              {DEPARTMENT_OPTIONS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
          <label className={`block text-sm font-medium ${textClass}`}>
            Rationale
            <textarea
              className={textareaClass}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="Required for Override and Escalation decisions."
              value={rationale}
            />
          </label>
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-100">{error}</p> : null}
          <button className="focus-ring rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-[#145f5d]" onClick={submitDecision} type="button">
            Record Decision
          </button>
        </div>
      </div>
      <div className={`${panelClass} p-4`}>
        <h3 className={`text-base font-semibold ${headingClass}`}>Selected Recommendation</h3>
        {recommendation ? (
          <div className={`mt-3 space-y-3 text-sm ${textClass}`}>
            <p>
              <span className={`font-semibold ${headingClass}`}>{recommendation.caseId}</span> -{" "}
              {formatBlockerCategory(recommendation.category)} - {recommendation.riskLevel} Risk - Score{" "}
              {recommendation.priorityScore}
            </p>
            <p>{recommendation.recommendation}</p>
            <p className="rounded-md bg-teal/10 p-3 text-ink dark:bg-[#238b87]/20 dark:text-[#d7e0e6]">
              {recommendation.expectedNextStep}
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className={`font-semibold ${headingClass}`}>Score Methodology</p>
              <p className={`mt-1 ${mutedClass}`}>
                Range: 0-100. Risk Bands: Low 0-44, Medium 45-69, High 70-84, Critical 85-100.
              </p>
              <p className={`mt-1 ${mutedClass}`}>
                Inputs: bed-release risk, SLA pressure, blocker age, open escalation state, and readiness state.
              </p>
            </div>
            <ul className="space-y-1">
              {recommendation.rationale.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={`mt-3 text-sm ${mutedClass}`}>No Case Recommendation selected.</p>
        )}
      </div>
    </section>
  );
}

function buildCycleGroups(dataset: AppDataset, timeframe: CycleTimeframe) {
  const multiplier: Record<CycleTimeframe, number> = { Daily: 1, Weekly: 5, Monthly: 21 };
  const groups = new Map<
    BlockerCategory,
    {
      category: BlockerCategory;
      name: string;
      Contribution: number;
      items: Array<{ caseRecord: CaseRecord; recommendation: Recommendation; contribution: number }>;
    }
  >();

  for (const recommendation of dataset.recommendations) {
    const caseRecord = dataset.cases.find((item) => item.id === recommendation.caseId);
    if (!caseRecord || recommendation.category === "Unknown") {
      continue;
    }
    const slaPenalty = hasSlaBreach(caseRecord) ? 3 : 0;
    const bedRiskHours = caseRecord.bedReleaseRisk / 20;
    const contribution = Math.round((caseRecord.blockerAgeHours + slaPenalty + bedRiskHours) * multiplier[timeframe]);
    const existing =
      groups.get(recommendation.category) ??
      {
        category: recommendation.category,
        name: formatBlockerCategory(recommendation.category),
        Contribution: 0,
        items: [],
      };

    existing.Contribution += contribution;
    existing.items.push({ caseRecord, recommendation, contribution });
    groups.set(recommendation.category, existing);
  }

  return Array.from(groups.values()).sort((a, b) => b.Contribution - a.Contribution);
}

function KpiTree({ dataset }: { dataset: AppDataset }) {
  const [timeframe, setTimeframe] = useState<CycleTimeframe>("Daily");
  const [selectedCategory, setSelectedCategory] = useState<BlockerCategory | null>(null);
  const departmentData = byDepartment(dataset.recommendations);
  const cycleGroups = buildCycleGroups(dataset, timeframe);
  const selectedGroup = cycleGroups.find((group) => group.category === selectedCategory);
  const cycleAxisWidth =
    cycleGroups.length === 0
      ? 80
      : Math.min(104, Math.max(74, Math.max(...cycleGroups.map((group) => group.name.length)) * 5.6));

  return (
    <section className="space-y-4">
      <div className={`${panelClass} p-4`}>
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className={`text-lg font-semibold ${headingClass}`}>KPI Tree</h2>
            <p className={`text-sm ${mutedClass}`}>
              Cycle-time contribution links blocker age, SLA breach pressure, bed-release risk, category, and accountable department.
            </p>
          </div>
          <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            {(["Daily", "Weekly", "Monthly"] as CycleTimeframe[]).map((option) => (
              <button
                className={`focus-ring rounded px-3 py-1.5 text-sm font-semibold ${
                  timeframe === option
                    ? "bg-teal text-white"
                    : "text-ink/80 hover:text-teal dark:text-[#d7e0e6] dark:hover:text-[#56c7c2]"
                }`}
                key={option}
                onClick={() => setTimeframe(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className={`${panelClass} p-4`}>
          <h3 className={`flex items-center gap-2 text-base font-semibold ${headingClass}`}>
            Cycle Time Contribution
            <ContributionInfoIcon />
          </h3>
          <p className={`text-sm ${mutedClass}`}>Click a category bar to inspect contributing cases.</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={cycleGroups} layout="vertical" margin={{ bottom: 0, left: 0, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis tick={axisTickStyle} tickMargin={4} type="number" />
                <YAxis dataKey="name" tick={axisTickStyle} tickMargin={4} type="category" width={cycleAxisWidth} />
                <Tooltip {...chartTooltipProps} formatter={(value) => [value, `${timeframe} Contribution`]} />
                <Bar dataKey="Contribution" fill="#18716f" radius={[0, 4, 4, 0]} onClick={(group) => setSelectedCategory(group.category)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${panelClass} p-4`}>
          <h3 className={`text-base font-semibold ${headingClass}`}>Department Linkage</h3>
          <div className="mt-4 grid gap-3">
            {departmentData.map((department) => (
              <div className={panelSoftClass} key={department.name}>
                <div className="p-3">
                  <p className={`font-medium ${headingClass}`}>{department.name}</p>
                  <p className={`text-sm ${mutedClass}`}>{department.Count} Linked Blocker Recommendations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-md border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${headingClass}`}>
                  {selectedGroup.name} - {timeframe} Cycle-Time Contributors
                </h3>
                <p className={`text-sm ${mutedClass}`}>Contribution includes blocker age, SLA breach pressure, and bed-release risk.</p>
              </div>
              <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200" onClick={() => setSelectedCategory(null)} type="button">
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {selectedGroup.items.map(({ caseRecord, recommendation, contribution }) => (
                <article className={panelSoftClass} key={caseRecord.id}>
                  <div className="p-3">
                    <div className="flex flex-col justify-between gap-2 md:flex-row">
                      <p className={`font-semibold ${headingClass}`}>
                        {caseRecord.id} - {recommendation.riskLevel} Risk - Score {recommendation.priorityScore}
                      </p>
                      <p className={`text-sm font-medium ${textClass}`}>{contribution} Contribution Points</p>
                    </div>
                    <p className={`mt-2 text-sm ${textClass}`}>{caseRecord.blockerText}</p>
                    <p className={`mt-2 text-sm ${mutedClass}`}>Department: {recommendation.owner}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatEventDetailValue(value: GovernanceEvent["details"][string]): string {
  if (Array.isArray(value)) {
    return value.join(" ");
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return value ? String(value) : "Not Recorded";
}

function confidenceExplanation(confidence: GovernanceEvent["details"][string]): string {
  const value = typeof confidence === "number" ? Math.round(confidence * 100) : null;
  const base =
    "Confidence is deterministic: 82% for a matched known blocker category, 58% for Unknown or ambiguous blocker text. It is not a machine-learning probability.";
  return value === null ? base : `${base} Current value: ${value}%.`;
}

function ContributionInfoIcon() {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        aria-label="Explain Contribution Points"
        className="inline-flex h-[1em] w-[1em] items-center justify-center rounded-full border border-teal/30 text-teal align-middle dark:border-[#56c7c2]/40 dark:text-[#56c7c2]"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <svg aria-hidden="true" className="h-[0.7em] w-[0.7em]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
          <path d="M8 7v5" />
          <path d="M8 4h.01" />
        </svg>
      </button>
      <span
        className={`absolute left-1/2 top-6 z-20 w-80 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-3 text-xs font-normal normal-case text-slate-700 shadow-panel transition-opacity dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        Contribution points are synthetic operating-pressure units: blocker age hours, plus 3 points for an SLA breach, plus bed-release risk divided by 20, multiplied by the selected Daily, Weekly, or Monthly timeframe.
      </span>
    </span>
  );
}

function ConfidenceInfoIcon({ confidence }: { confidence: GovernanceEvent["details"][string] }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        aria-label="Explain Confidence"
        className="inline-flex h-[1em] w-[1em] items-center justify-center rounded-full border border-teal/30 text-teal align-middle dark:border-[#56c7c2]/40 dark:text-[#56c7c2]"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <svg aria-hidden="true" className="h-[0.7em] w-[0.7em]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
          <path d="M8 7v5" />
          <path d="M8 4h.01" />
        </svg>
      </button>
      <span
        className={`absolute left-1/2 top-6 z-20 w-72 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-3 text-xs normal-case text-slate-700 shadow-panel transition-opacity dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {confidenceExplanation(confidence)}
      </span>
    </span>
  );
}

function GovernanceDetailRows({ event }: { event: GovernanceEvent }) {
  const rows: Array<{ label: string; value: GovernanceEvent["details"][string]; showInfo?: boolean }> = [];

  if (event.details.categoryDisplay || event.details.category) {
    rows.push({ label: "Category", value: event.details.categoryDisplay ?? event.details.category });
  }
  if (event.details.riskLevel) {
    rows.push({ label: "Risk Level", value: event.details.riskLevel });
  }
  if (event.details.priorityScore) {
    rows.push({ label: "Score", value: event.details.priorityScore });
  }
  if (event.details.owner || event.details.assignedOwner) {
    rows.push({ label: "Department", value: event.details.assignedOwner ?? event.details.owner });
  }
  if (event.details.confidence) {
    rows.push({ label: "Confidence", value: `${Math.round(Number(event.details.confidence) * 100)}%`, showInfo: true });
  }
  if (event.details.actionDisplay || event.details.action) {
    rows.push({ label: "Decision Action", value: event.details.actionDisplay ?? event.details.action });
  }
  if (event.details.rationale) {
    rows.push({ label: "Rationale", value: event.details.rationale });
  }
  if (event.details.caseCount) {
    rows.push({ label: "Case Count", value: event.details.caseCount });
  }
  if (event.details.decisionCount) {
    rows.push({ label: "Decision Count", value: event.details.decisionCount });
  }
  if (event.details.duration) {
    rows.push({ label: "Briefing Duration", value: event.details.duration });
  }
  if (event.details.detailMode) {
    rows.push({ label: "Briefing Mode", value: event.details.detailMode });
  }

  if (rows.length === 0) {
    rows.push({ label: "Details", value: event.summary });
  }

  return (
    <dl className="mt-3 grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800" key={row.label}>
          <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            {row.label}
            {row.showInfo ? <ConfidenceInfoIcon confidence={event.details.confidence} /> : null}
          </dt>
          <dd className={`mt-1 text-sm ${textClass}`}>{formatEventDetailValue(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function GovernanceLog({
  events,
  categoryOptions,
  eventTypeOptions,
}: {
  events: GovernanceEvent[];
  categoryOptions: ConfigOption[];
  eventTypeOptions: ConfigOption[];
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [eventType, setEventType] = useState<GovernanceEventFilter>("All");
  const [category, setCategory] = useState<GovernanceCategoryFilter>("All");
  const [riskLevel, setRiskLevel] = useState<GovernanceRiskFilter>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const filteredEvents = events
    .filter((event) => {
      const eventDate = event.timestamp.slice(0, 10);
      const categoryLabel = categoryOptions.find((option) => option.value === category)?.label;
      const matchesType = eventType === "All" || event.type === eventType;
      const matchesCategory =
        category === "All" || event.details.category === category || event.details.categoryDisplay === categoryLabel;
      const matchesRisk = riskLevel === "All" || event.details.riskLevel === riskLevel;
      const matchesFrom = !dateFrom || eventDate >= dateFrom;
      const matchesTo = !dateTo || eventDate <= dateTo;
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [event.summary, event.actor, event.caseId, event.recommendationId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      return matchesType && matchesCategory && matchesRisk && matchesFrom && matchesTo && matchesSearch;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  function clearFilters() {
    setEventType("All");
    setCategory("All");
    setRiskLevel("All");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  const activeFilters = [
    eventType !== "All"
      ? {
          label: `Event Type: ${eventTypeOptions.find((option) => option.value === eventType)?.label ?? eventType}`,
          clear: () => setEventType("All"),
        }
      : null,
    category !== "All"
      ? {
          label: `Category: ${categoryOptions.find((option) => option.value === category)?.label ?? category}`,
          clear: () => setCategory("All"),
        }
      : null,
    riskLevel !== "All" ? { label: `Risk Level: ${RISK_LEVEL_LABELS[riskLevel]}`, clear: () => setRiskLevel("All") } : null,
    dateFrom ? { label: `From: ${dateFrom}`, clear: () => setDateFrom("") } : null,
    dateTo ? { label: `To: ${dateTo}`, clear: () => setDateTo("") } : null,
    search ? { label: `Search: ${search}`, clear: () => setSearch("") } : null,
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  return (
    <section className={panelClass}>
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center dark:border-slate-700">
        <div>
          <h2 className={`text-lg font-semibold ${headingClass}`}>Governance Log</h2>
          <p className={`text-sm ${mutedClass}`}>Recommendation and human decision events persisted in browser-local storage.</p>
        </div>
        <button
          className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal dark:border-[#344655] dark:text-[#d7e0e6] dark:hover:border-[#56c7c2] dark:hover:text-[#56c7c2]"
          onClick={() => setShowFilters(true)}
          type="button"
        >
          Filter Events
        </button>
      </div>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4 dark:border-slate-700">
          {activeFilters.map((filter) => (
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-teal hover:border-teal/50 dark:border-[#56c7c2]/40 dark:bg-[#238b87]/20 dark:text-[#56c7c2]"
              key={filter.label}
              onClick={filter.clear}
              type="button"
            >
              <span>{filter.label}</span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal/15 text-teal dark:bg-[#238b87]/30 dark:text-[#56c7c2]" aria-hidden="true">
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </span>
            </button>
          ))}
          <button className="focus-ring rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200" onClick={clearFilters} type="button">
            Clear All
          </button>
        </div>
      ) : null}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filteredEvents.map((event) => (
          <article className="p-4" key={event.id}>
            <div className="flex flex-col justify-between gap-2 md:flex-row">
              <div>
                <p className={`font-medium ${headingClass}`}>{event.summary}</p>
                <p className={`text-sm ${mutedClass}`}>
                  {GOVERNANCE_EVENT_TYPE_LABELS[event.type]} | {event.actor} | {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
              <span className={`text-sm font-medium ${textClass}`}>{event.caseId ?? "System"}</span>
            </div>
            <GovernanceDetailRows event={event} />
          </article>
        ))}
        {filteredEvents.length === 0 ? (
          <div className="p-4">
            <p className={`text-sm ${mutedClass}`}>No governance events match the selected filters.</p>
          </div>
        ) : null}
      </div>
      {showFilters ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-md border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${headingClass}`}>Filter Governance Events</h3>
                <p className={`text-sm ${mutedClass}`}>Filter by creation date, event type, category, risk level, case, or actor.</p>
              </div>
              <button
                className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                onClick={() => setShowFilters(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className={`block text-sm font-medium ${textClass}`}>
                Created From
                <input className={inputClass} onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
              </label>
              <label className={`block text-sm font-medium ${textClass}`}>
                Created To
                <input className={inputClass} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />
              </label>
              <label className={`block text-sm font-medium ${textClass}`}>
                Event Type
                <select className={inputClass} onChange={(event) => setEventType(event.target.value as GovernanceEventFilter)} value={eventType}>
                  <option value="All">All Event Types</option>
                  {eventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`block text-sm font-medium ${textClass}`}>
                Category
                <select className={inputClass} onChange={(event) => setCategory(event.target.value as GovernanceCategoryFilter)} value={category}>
                  <option value="All">All Categories</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`block text-sm font-medium ${textClass}`}>
                Risk Level
                <select className={inputClass} onChange={(event) => setRiskLevel(event.target.value as GovernanceRiskFilter)} value={riskLevel}>
                  <option value="All">All Risk Levels</option>
                  {Object.entries(RISK_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`block text-sm font-medium ${textClass}`}>
                Search Case Or Actor
                <input className={inputClass} onChange={(event) => setSearch(event.target.value)} placeholder="Case ID, actor, recommendation ID" value={search} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200" onClick={clearFilters} type="button">
                Clear Filters
              </button>
              <button className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-[#145f5d]" onClick={() => setShowFilters(false)} type="button">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function parseBriefSections(brief: string): { title: string; intro: string[]; sections: Record<string, string[]> } {
  const lines = brief.split("\n").filter((line) => line.trim().length > 0);
  let title = "Operating Brief";
  let currentSection = "";
  const intro: string[] = [];
  const sections: Record<string, string[]> = {};

  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace("# ", "");
      continue;
    }
    if (line.startsWith("## ")) {
      currentSection = line.replace("## ", "");
      sections[currentSection] = [];
      continue;
    }
    if (currentSection) {
      sections[currentSection].push(line);
    } else {
      intro.push(line);
    }
  }

  return { title, intro, sections };
}

function parseBriefKeyValueRows(lines: string[]): Array<{ name: string; value: number; rawValue: string }> {
  return lines
    .map((line) => {
      const text = line.replace("- ", "");
      const [name, rawValue = "0"] = text.split(": ");
      const value = Number(rawValue);
      return { name, rawValue, value: Number.isNaN(value) ? 0 : value };
    })
    .filter((row) => row.name.length > 0);
}

function BriefExportCharts({ brief }: { brief: string }) {
  const parsed = parseBriefSections(brief);
  const statusRows = parseBriefKeyValueRows(parsed.sections["Current Operating Status"] ?? []);
  const blockerRows = parseBriefKeyValueRows(parsed.sections["Top Blockers"] ?? []).filter((row) => row.value > 0);
  const statusChartData = statusRows.filter((row) =>
    ["Planned discharges", "Ready for discharge", "Blocked discharges", "SLA breaches", "Open leadership attention items"].includes(row.name),
  );

  if (statusChartData.length === 0 && blockerRows.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {statusChartData.length > 0 ? (
        <div className="rounded-md border border-slate-200 p-4 dark:border-slate-700" data-brief-export-chart data-chart-title="Current Operating Status">
          <h3 className={`text-base font-semibold ${headingClass}`}>Current Operating Status Chart</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={statusChartData} margin={{ bottom: 42, left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis
                  dataKey="name"
                  height={54}
                  interval={0}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const words = String(payload.value).replace("Open leadership attention items", "Leadership items").split(" ");
                    return (
                      <text fill="var(--chart-tick)" fontSize={10} fontWeight={600} textAnchor="middle" x={x} y={y + 12}>
                        {words.map((word, index) => (
                          <tspan dy={index === 0 ? 0 : 11} key={`${word}-${index}`} x={x}>
                            {word}
                          </tspan>
                        ))}
                      </text>
                    );
                  }}
                />
                <YAxis allowDecimals={false} tick={axisTickStyle} />
                <Tooltip {...chartTooltipProps} formatter={(value) => [value, "Count"]} />
                <Bar dataKey="value" fill="#18716f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
      {blockerRows.length > 0 ? (
        <div className="rounded-md border border-slate-200 p-4 dark:border-slate-700" data-brief-export-chart data-chart-title="Top Blockers">
          <h3 className={`text-base font-semibold ${headingClass}`}>Top Blockers Chart</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={blockerRows} layout="vertical" margin={{ bottom: 0, left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis allowDecimals={false} tick={axisTickStyle} type="number" />
                <YAxis dataKey="name" tick={axisTickStyle} tickMargin={4} type="category" width={96} />
                <Tooltip {...chartTooltipProps} formatter={(value) => [value, "Cases"]} />
                <Bar dataKey="value" fill="#18716f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BriefBulletCard({ line }: { line: string }) {
  const text = line.replace("- ", "");
  const parts = text.split(/:\s(.+)/);
  const title = parts.length > 1 ? parts[0] : text;
  const detail = parts.length > 1 ? parts[1] : "";

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className={`text-sm font-semibold ${headingClass}`}>{title}</p>
      {detail ? <p className={`mt-1 text-sm leading-6 ${textClass}`}>{detail}</p> : null}
    </article>
  );
}

function FormattedBrief({ brief }: { brief: string }) {
  const parsed = parseBriefSections(brief);
  const currentStatus = parsed.sections["Current Operating Status"] ?? [];
  const topBlockers = parsed.sections["Top Blockers"] ?? [];
  const maxBlockerCount = Math.max(
    1,
    ...topBlockers.map((line) => Number(line.split(":").pop()?.trim() ?? 0)).filter((value) => !Number.isNaN(value)),
  );
  const standardSections = Object.entries(parsed.sections).filter(
    ([section]) => section !== "Current Operating Status" && section !== "Top Blockers",
  );

  return (
    <div className="space-y-4 p-4">
      <h2 className={`text-xl font-semibold ${headingClass}`}>{parsed.title}</h2>
      {(parsed.sections.BLUF ?? parsed.intro).map((line) => (
        <p className={`text-sm leading-6 ${textClass}`} key={line}>
          {line}
        </p>
      ))}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-slate-200 p-4 dark:border-slate-700">
          <h3 className={`text-base font-semibold ${headingClass}`}>Current Operating Status</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {currentStatus.map((line) => {
              const text = line.replace("- ", "");
              const [label, value = ""] = text.split(": ");
              return (
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800" key={line}>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
                  <p className={`mt-1 text-xl font-semibold ${headingClass}`}>{value}</p>
                </div>
              );
            })}
          </div>
        </section>
        <section className="rounded-md border border-slate-200 p-4 dark:border-slate-700">
          <h3 className={`text-base font-semibold ${headingClass}`}>Top Blockers</h3>
          <div className="mt-3 space-y-3">
            {topBlockers.map((line) => {
              const text = line.replace("- ", "");
              const [label, rawValue = "0"] = text.split(": ");
              const value = Number(rawValue);
              return (
                <div key={line}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>{label}</span>
                    <span>{rawValue}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-teal" style={{ width: `${Math.max(8, (value / maxBlockerCount) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <BriefExportCharts brief={brief} />
      {standardSections.map(([section, lines]) => (
        <section className="rounded-md border border-slate-200 p-4 dark:border-slate-700" key={section}>
          <h3 className={`text-base font-semibold ${headingClass}`}>{section}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {lines.map((line) =>
              line.startsWith("- ") ? (
                <BriefBulletCard key={line} line={line} />
              ) : (
                <p className={`text-sm leading-6 ${textClass}`} key={line}>
                  {line}
                </p>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function WeeklyBrief({
  brief,
  duration,
  detailMode,
  exportRef,
  viewMode,
  onDurationChange,
  onDetailModeChange,
  onViewModeChange,
  onExport,
  onGenerate,
}: {
  brief: string;
  duration: BriefDuration;
  detailMode: BriefDetailMode;
  exportRef: React.RefObject<HTMLDivElement>;
  viewMode: BriefViewMode;
  onDurationChange: (duration: BriefDuration) => void;
  onDetailModeChange: (mode: BriefDetailMode) => void;
  onViewModeChange: (mode: BriefViewMode) => void;
  onExport: (format: BriefExportFormat, filename: string) => void | Promise<void>;
  onGenerate: () => void;
}) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<BriefExportFormat>("PDF");
  const [exportFilename, setExportFilename] = useState(
    `stratis-healthcare-ops-${duration.toLowerCase()}-${detailMode.toLowerCase()}-brief.pdf`,
  );

  function defaultExportFilename(format: BriefExportFormat): string {
    const extension = format === "DOCX" ? "docx" : format.toLowerCase();
    return `stratis-healthcare-ops-${duration.toLowerCase()}-${detailMode.toLowerCase()}-brief.${extension}`;
  }

  function openExportModal() {
    setExportFormat("PDF");
    setExportFilename(defaultExportFilename("PDF"));
    setShowExportModal(true);
  }

  function handleExportFormatChange(format: BriefExportFormat) {
    setExportFormat(format);
    setExportFilename(defaultExportFilename(format));
  }

  function confirmExport() {
    onExport(exportFormat, exportFilename);
    setShowExportModal(false);
  }

  return (
    <section className={panelClass}>
      <div className="border-b border-slate-200 p-4 dark:border-slate-700">
        <div>
          <h2 className={`text-lg font-semibold ${headingClass}`}>{duration} {detailMode} Operating Brief</h2>
          <p className={`text-sm ${mutedClass}`}>Generated from synthetic operating data, decisions, and governance events.</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className={`block text-sm font-medium ${textClass}`}>
            Briefing Duration
            <select className={inputClass} onChange={(event) => onDurationChange(event.target.value as BriefDuration)} value={duration}>
              <option value="Daily">Daily Briefing</option>
              <option value="Weekly">Weekly Briefing</option>
              <option value="Monthly">Monthly Briefing</option>
            </select>
          </label>
          <label className={`block text-sm font-medium ${textClass}`}>
            Briefing Mode
            <select className={inputClass} onChange={(event) => onDetailModeChange(event.target.value as BriefDetailMode)} value={detailMode}>
              <option value="Executive">Executive Mode</option>
              <option value="Detailed">Detailed Mode</option>
            </select>
          </label>
          <div>
            <p className={`text-sm font-medium ${textClass}`}>Display Mode</p>
            <div className="mt-1 flex h-10 rounded-md border border-line bg-paper p-1 dark:border-[#344655] dark:bg-[#111b24]">
              {(["Text", "Markdown"] as BriefViewMode[]).map((mode) => (
                <button
                  className={`focus-ring flex-1 rounded px-3 text-sm font-semibold ${
                    viewMode === mode
                      ? "bg-teal text-white"
                      : "text-ink/80 hover:text-teal dark:text-[#d7e0e6] dark:hover:text-[#56c7c2]"
                  }`}
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal dark:border-[#344655] dark:text-[#d7e0e6] dark:hover:border-[#56c7c2] dark:hover:text-[#56c7c2]" onClick={onGenerate} type="button">
            Regenerate
          </button>
          <button className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-[#145f5d]" onClick={openExportModal} type="button">
            Export Brief
          </button>
        </div>
      </div>
      {viewMode === "Markdown" ? (
        <pre className="whitespace-pre-wrap p-4 text-sm leading-6 text-slate-800 dark:text-slate-200">{brief}</pre>
      ) : (
        <FormattedBrief brief={brief} />
      )}
      <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 w-[900px] bg-white text-slate-900">
        <div ref={exportRef}>
          <FormattedBrief brief={brief} />
        </div>
      </div>
      {showExportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${headingClass}`}>Export Operating Brief</h3>
                <p className={`mt-1 text-sm ${mutedClass}`}>Choose a format and filename. PDF and DOCX exports are generated in the browser and include the brief charts.</p>
              </div>
              <button className="focus-ring rounded-md px-2 py-1 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" onClick={() => setShowExportModal(false)} type="button">
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className={`block text-sm font-medium ${textClass}`}>
                Export Format
                <select className={inputClass} onChange={(event) => handleExportFormatChange(event.target.value as BriefExportFormat)} value={exportFormat}>
                  <option value="PDF">PDF</option>
                  <option value="Markdown">Markdown</option>
                  <option value="DOCX">DOCX</option>
                </select>
              </label>
              <label className={`block text-sm font-medium ${textClass}`}>
                Filename
                <input className={inputClass} onChange={(event) => setExportFilename(event.target.value)} value={exportFilename} />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal dark:border-[#344655] dark:text-[#d7e0e6] dark:hover:border-[#56c7c2] dark:hover:text-[#56c7c2]" onClick={() => setShowExportModal(false)} type="button">
                Cancel
              </button>
              <button className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-[#145f5d]" onClick={confirmExport} type="button">
                Export
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Settings({
  theme,
  categoryOptions,
  eventTypeOptions,
  taxonomyChanges,
  onThemeChange,
  onCategoryOptionsChange,
  onEventTypeOptionsChange,
  onTaxonomyChange,
  onReset,
  onExportCases,
}: {
  theme: ThemeMode;
  categoryOptions: ConfigOption[];
  eventTypeOptions: ConfigOption[];
  taxonomyChanges: TaxonomyChange[];
  onThemeChange: (theme: ThemeMode) => void;
  onCategoryOptionsChange: (options: ConfigOption[]) => void;
  onEventTypeOptionsChange: (options: ConfigOption[]) => void;
  onTaxonomyChange: (change: Omit<TaxonomyChange, "id" | "timestamp">) => void;
  onReset: () => void;
  onExportCases: () => void;
}) {
  const [activeSetting, setActiveSetting] = useState<"Appearance" | "Data Controls" | "Governance" | "Taxonomy" | "Guardrails">(
    "Appearance",
  );
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newEventTypeLabel, setNewEventTypeLabel] = useState("");
  const [taxonomyError, setTaxonomyError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingTaxonomyDelete | null>(null);
  const settingsSections = ["Appearance", "Data Controls", "Governance", "Taxonomy", "Guardrails"] as const;

  function addOption(
    label: string,
    options: ConfigOption[],
    update: (options: ConfigOption[]) => void,
    resetInput: () => void,
    taxonomy: TaxonomyChange["taxonomy"],
  ) {
    const trimmed = label.trim();
    if (!trimmed) {
      setTaxonomyError("Enter a label before adding it.");
      return;
    }
    const normalized = normalizeConfigLabel(trimmed);
    if (options.some((option) => normalizeConfigLabel(option.label) === normalized || normalizeConfigLabel(option.value) === normalized)) {
      setTaxonomyError("That item already exists. Duplicate checks ignore case and spaces.");
      return;
    }
    update(sortConfigOptions([...options, { value: `custom_${normalized}`, label: trimmed }]));
    onTaxonomyChange({ action: "Added", taxonomy, label: trimmed });
    resetInput();
    setTaxonomyError("");
  }

  function removeOption(
    value: string,
    options: ConfigOption[],
    update: (options: ConfigOption[]) => void,
    taxonomy: TaxonomyChange["taxonomy"],
  ) {
    if (options.length <= 1) {
      setTaxonomyError("At least one item must remain available.");
      return;
    }
    const removed = options.find((option) => option.value === value);
    update(sortConfigOptions(options.filter((option) => option.value !== value)));
    if (removed) {
      onTaxonomyChange({ action: "Removed", taxonomy, label: removed.label });
    }
    setTaxonomyError("");
  }

  function requestRemoveOption(option: ConfigOption, taxonomy: TaxonomyChange["taxonomy"]) {
    setPendingDelete({ value: option.value, label: option.label, taxonomy });
  }

  function confirmRemoveOption() {
    if (!pendingDelete) return;
    if (pendingDelete.taxonomy === "Event Type") {
      removeOption(pendingDelete.value, eventTypeOptions, onEventTypeOptionsChange, pendingDelete.taxonomy);
    } else {
      removeOption(pendingDelete.value, categoryOptions, onCategoryOptionsChange, pendingDelete.taxonomy);
    }
    setPendingDelete(null);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className={`${panelClass} p-3`}>
        <p className="px-2 pb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Settings</p>
        <nav className="space-y-1">
          {settingsSections.map((section) => (
            <button
              className={`focus-ring w-full rounded-md px-3 py-2 text-left text-sm font-semibold ${
                activeSetting === section
                  ? "bg-teal text-white"
                  : "text-ink/80 hover:bg-paper hover:text-teal dark:text-[#d7e0e6] dark:hover:bg-[#111b24] dark:hover:text-[#56c7c2]"
              }`}
              key={section}
              onClick={() => setActiveSetting(section)}
              type="button"
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>
      <div className={`${panelClass} p-4`}>
        {activeSetting === "Appearance" ? (
          <div>
            <h2 className={`text-lg font-semibold ${headingClass}`}>Appearance</h2>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              STRATIS visual mode controls the local workbench only and is saved in this browser.
            </p>
            <div className="mt-4 flex rounded-md border border-line bg-paper p-1 dark:border-[#344655] dark:bg-[#111b24]">
              {(["light", "dark"] as ThemeMode[]).map((mode) => (
                <button
                  className={`focus-ring flex-1 rounded px-3 py-2 text-sm font-semibold ${
                    theme === mode
                      ? "bg-teal text-white"
                      : "text-ink/80 hover:text-teal dark:text-[#d7e0e6] dark:hover:text-[#56c7c2]"
                  }`}
                  key={mode}
                  onClick={() => onThemeChange(mode)}
                  type="button"
                >
                  {mode === "light" ? "Light Mode" : "Dark Mode"}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {activeSetting === "Data Controls" ? (
          <div>
            <h2 className={`text-lg font-semibold ${headingClass}`}>Data Controls</h2>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              The MVP uses synthetic discharge operations data only. Reset returns the browser workspace to the built-in sample dataset.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal dark:border-[#344655] dark:text-[#d7e0e6] dark:hover:border-[#56c7c2] dark:hover:text-[#56c7c2]" onClick={onExportCases} type="button">
                Export Cases CSV
              </button>
              <button className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-[#0b1218] dark:bg-teal dark:hover:bg-[#145f5d]" onClick={onReset} type="button">
                Reset Sample Dataset
              </button>
            </div>
          </div>
        ) : null}
        {activeSetting === "Governance" ? (
          <div>
            <h2 className={`text-lg font-semibold ${headingClass}`}>Governance</h2>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              Governance events are stored locally and displayed in layperson-readable cards. Backend-safe event details remain structured for export and audit.
            </p>
            <ul className={`mt-4 space-y-2 text-sm ${textClass}`}>
              <li>- Recommendation creation, human decisions, dataset resets, and brief generation are logged.</li>
              <li>- Override and Escalation decisions require reviewer rationale.</li>
              <li>- Production hardening would require immutable server-side audit storage.</li>
            </ul>
          </div>
        ) : null}
        {activeSetting === "Taxonomy" ? (
          <div>
            <h2 className={`text-lg font-semibold ${headingClass}`}>Taxonomy</h2>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              Configure frontend filter options for Governance Log event types and blocker categories. These labels do not rewrite historical audit records.
            </p>
            {taxonomyError ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-100">
                {taxonomyError}
              </p>
            ) : null}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <section className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <h3 className={`font-semibold ${headingClass}`}>Event Types</h3>
                <div className="mt-3 flex gap-2">
                  <input
                    className={`${inputClass} mt-0`}
                    onChange={(event) => setNewEventTypeLabel(event.target.value)}
                    placeholder="Add event type"
                    value={newEventTypeLabel}
                  />
                  <button
                    className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-[#145f5d]"
                    onClick={() => addOption(newEventTypeLabel, eventTypeOptions, onEventTypeOptionsChange, () => setNewEventTypeLabel(""), "Event Type")}
                    type="button"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {eventTypeOptions.map((option) => (
                    <div className="flex items-center justify-between rounded-md bg-slate-50 p-2 dark:bg-slate-800" key={option.value}>
                      <span className={`text-sm ${textClass}`}>{option.label}</span>
                      <button className="focus-ring rounded px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300" onClick={() => requestRemoveOption(option, "Event Type")} type="button">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <h3 className={`font-semibold ${headingClass}`}>Categories</h3>
                <div className="mt-3 flex gap-2">
                  <input
                    className={`${inputClass} mt-0`}
                    onChange={(event) => setNewCategoryLabel(event.target.value)}
                    placeholder="Add category"
                    value={newCategoryLabel}
                  />
                  <button
                    className="focus-ring rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-[#145f5d]"
                    onClick={() => addOption(newCategoryLabel, categoryOptions, onCategoryOptionsChange, () => setNewCategoryLabel(""), "Category")}
                    type="button"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {categoryOptions.map((option) => (
                    <div className="flex items-center justify-between rounded-md bg-slate-50 p-2 dark:bg-slate-800" key={option.value}>
                      <span className={`text-sm ${textClass}`}>{option.label}</span>
                      <button className="focus-ring rounded px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300" onClick={() => requestRemoveOption(option, "Category")} type="button">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <section className="mt-4 rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <h3 className={`font-semibold ${headingClass}`}>Taxonomy Change Log</h3>
                <span className={`text-xs font-semibold uppercase ${mutedClass}`}>Browser Local</span>
              </div>
              <div className="mt-3 space-y-2">
                {taxonomyChanges.length > 0 ? (
                  taxonomyChanges.slice(0, 8).map((change) => (
                    <div className="grid gap-2 rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800 md:grid-cols-[150px_90px_110px_1fr]" key={change.id}>
                      <span className={mutedClass}>{new Date(change.timestamp).toLocaleString()}</span>
                      <span className={`font-semibold ${change.action === "Added" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                        {change.action}
                      </span>
                      <span className={textClass}>{change.taxonomy}</span>
                      <span className={headingClass}>{change.label}</span>
                    </div>
                  ))
                ) : (
                  <p className={`rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800 ${mutedClass}`}>
                    No taxonomy changes recorded yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
        {activeSetting === "Guardrails" ? (
          <div>
            <h2 className={`text-lg font-semibold ${headingClass}`}>MVP Guardrails</h2>
            <ul className={`mt-3 grid gap-2 text-sm ${textClass} md:grid-cols-2`}>
              <li>- Synthetic operations data only.</li>
              <li>- No clinical diagnosis, treatment guidance, or patient advice.</li>
              <li>- Deterministic rules engine; AI integration is future optionality.</li>
              <li>- Browser-local persistence; no backend or secrets.</li>
              <li>- Governance log captures recommendations and human decisions.</li>
            </ul>
          </div>
        ) : null}
      </div>
      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true" aria-labelledby="taxonomy-delete-title">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className={`text-lg font-semibold ${headingClass}`} id="taxonomy-delete-title">
              Confirm Taxonomy Deletion
            </h3>
            <p className={`mt-2 text-sm ${textClass}`}>
              You are about to delete the {pendingDelete.taxonomy.toLowerCase()} item{" "}
              <span className={`font-semibold ${headingClass}`}>{pendingDelete.label}</span>.
            </p>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              This removes it from future filter configuration only. Historical governance records are not rewritten.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal dark:border-[#344655] dark:text-[#d7e0e6] dark:hover:border-[#56c7c2] dark:hover:text-[#56c7c2]"
                onClick={() => setPendingDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="focus-ring rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={confirmRemoveOption}
                type="button"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function App() {
  const briefExportRef = useRef<HTMLDivElement | null>(null);
  const [dataset, setDataset] = useState<AppDataset>(() =>
    typeof window === "undefined" ? createInitialDataset() : loadDataset(),
  );
  const [page, setPage] = useState<Page>("Overview");
  const [briefDuration, setBriefDuration] = useState<BriefDuration>("Weekly");
  const [briefDetailMode, setBriefDetailMode] = useState<BriefDetailMode>("Executive");
  const [briefViewMode, setBriefViewMode] = useState<BriefViewMode>("Text");
  const [brief, setBrief] = useState(() =>
    generateBrief(dataset, { duration: "Weekly", detailMode: "Executive" }),
  );
  const [categoryOptions, setCategoryOptions] = useState<ConfigOption[]>(() => {
    if (typeof window === "undefined") return DEFAULT_CATEGORY_OPTIONS;
    const raw = window.localStorage.getItem("stratis-healthcare-category-options");
    return raw ? sortConfigOptions(JSON.parse(raw) as ConfigOption[]) : DEFAULT_CATEGORY_OPTIONS;
  });
  const [eventTypeOptions, setEventTypeOptions] = useState<ConfigOption[]>(() => {
    if (typeof window === "undefined") return DEFAULT_EVENT_TYPE_OPTIONS;
    const raw = window.localStorage.getItem("stratis-healthcare-event-type-options");
    return raw ? sortConfigOptions(JSON.parse(raw) as ConfigOption[]) : DEFAULT_EVENT_TYPE_OPTIONS;
  });
  const [taxonomyChanges, setTaxonomyChanges] = useState<TaxonomyChange[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem("stratis-healthcare-taxonomy-changes");
    return raw ? (JSON.parse(raw) as TaxonomyChange[]) : [];
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.localStorage.getItem("stratis-healthcare-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    saveDataset(dataset);
  }, [dataset]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("stratis-healthcare-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("stratis-healthcare-category-options", JSON.stringify(categoryOptions));
  }, [categoryOptions]);

  useEffect(() => {
    window.localStorage.setItem("stratis-healthcare-event-type-options", JSON.stringify(eventTypeOptions));
  }, [eventTypeOptions]);

  useEffect(() => {
    window.localStorage.setItem("stratis-healthcare-taxonomy-changes", JSON.stringify(taxonomyChanges));
  }, [taxonomyChanges]);

  useEffect(() => {
    const hasCurrentSampleScope =
      dataset.cases.length >= SAMPLE_CASES.length &&
      dataset.cases.every((caseRecord) => caseRecord.reportingPeriod);
    if (!hasCurrentSampleScope) {
      const next = resetDataset();
      setDataset(next);
      setBrief(generateBrief(next, { duration: briefDuration, detailMode: briefDetailMode }));
    }
  }, []);

  const kpis = useMemo(() => buildKpis(dataset), [dataset]);

  function persistDataset(next: AppDataset) {
    setDataset(next);
  }

  function handleTaxonomyChange(change: Omit<TaxonomyChange, "id" | "timestamp">) {
    setTaxonomyChanges((changes) => [createTaxonomyChange(change), ...changes]);
  }

  function setRecommendationStatus(
    recommendations: Recommendation[],
    recommendationId: string,
    action: DecisionAction,
    assignedOwner: string,
  ): Recommendation[] {
    const statusByAction: Record<DecisionAction, RecommendationStatus> = {
      accept: "Accepted",
      override: "Overridden",
      escalate: "Escalated",
      resolve: "Resolved",
      reject: "Rejected",
    };
    return recommendations.map((recommendation) =>
      recommendation.id === recommendationId
        ? { ...recommendation, owner: assignedOwner, status: statusByAction[action] }
        : recommendation,
    );
  }

  function updateCaseForDecision(cases: CaseRecord[], decision: HumanDecision, assignedOwner: string): CaseRecord[] {
    return cases.map((caseRecord) => {
      if (caseRecord.id !== decision.caseId) {
        return caseRecord;
      }

      if (decision.action === "resolve") {
        return {
          ...caseRecord,
          owner: assignedOwner,
          dischargeReadiness: "Ready",
          escalationStatus: "Closed",
          blockerAgeHours: 0,
          outcome: decision.rationale,
          lastUpdated: decision.createdAt,
        };
      }

      if (decision.action === "escalate") {
        return {
          ...caseRecord,
          owner: assignedOwner,
          escalationStatus: "Open",
          lastUpdated: decision.createdAt,
        };
      }

      return {
        ...caseRecord,
        owner: assignedOwner,
        lastUpdated: decision.createdAt,
      };
    });
  }

  function handleDecision(
    recommendation: Recommendation,
    action: DecisionAction,
    rationale: string,
    reviewer: string,
    assignedOwner: string,
  ) {
    const decision = createHumanDecision(recommendation.caseId, recommendation.id, action, rationale, reviewer);
    const event = createDecisionEvent(decision);
    const nextDataset: AppDataset = {
      cases: updateCaseForDecision(dataset.cases, decision, assignedOwner),
      recommendations: setRecommendationStatus(dataset.recommendations, recommendation.id, action, assignedOwner),
      decisions: [...dataset.decisions, decision],
      governanceEvents: [
        {
          ...event,
          details: {
            ...event.details,
            assignedOwner,
          },
        },
        ...dataset.governanceEvents,
      ],
    };
    persistDataset(nextDataset);
  }

  function handleGenerateBrief() {
    const nextBrief = generateBrief(dataset, { duration: briefDuration, detailMode: briefDetailMode });
    setBrief(nextBrief);
    persistDataset({
      ...dataset,
      governanceEvents: [
        createSystemEvent("brief_generated", `${briefDuration} ${briefDetailMode} operating brief generated.`, {
          caseCount: dataset.cases.length,
          decisionCount: dataset.decisions.length,
          duration: briefDuration,
          detailMode: briefDetailMode,
        }),
        ...dataset.governanceEvents,
      ],
    });
  }

  function handleReset() {
    const next = resetDataset();
    setDataset(next);
    setBrief(generateBrief(next, { duration: briefDuration, detailMode: briefDetailMode }));
    setPage("Overview");
  }

  function handleBriefDurationChange(duration: BriefDuration) {
    setBriefDuration(duration);
    setBrief(generateBrief(dataset, { duration, detailMode: briefDetailMode }));
  }

  function handleBriefDetailModeChange(detailMode: BriefDetailMode) {
    setBriefDetailMode(detailMode);
    setBrief(generateBrief(dataset, { duration: briefDuration, detailMode }));
  }

  async function handleExportBrief(format: BriefExportFormat, requestedFilename: string) {
    const graphs = collectBriefExportGraphs();
    if (format === "Markdown") {
      const filename = ensureExtension(requestedFilename, "md");
      await saveBlob(filename, new Blob([briefToMarkdownWithGraphs(brief, graphs)], { type: "text/markdown" }), "Markdown", [".md"]);
      return;
    }

    if (format === "DOCX") {
      const filename = ensureExtension(requestedFilename, "docx");
      await saveBlob(
        filename,
        createBriefDocx(brief, graphs),
        "Word Document",
        [".docx"],
      );
      return;
    }

    const filename = ensureExtension(requestedFilename, "pdf");
    const exportElement = briefExportRef.current;
    if (!exportElement) {
      return;
    }
    const hadDarkMode = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    await new Promise((resolve) => {
      window.requestAnimationFrame(resolve);
    });
    try {
      await saveBlob(filename, await createBriefPdf(exportElement), "PDF", [".pdf"]);
    } finally {
      document.documentElement.classList.toggle("dark", hadDarkMode);
    }
  }

  function renderPage() {
    if (page === "Overview") {
      return <Overview dataset={dataset} kpis={kpis} />;
    }
    if (page === "Command Centre") {
      return (
        <div className="space-y-4">
          <StatusMix dataset={dataset} />
          <CommandCentre dataset={dataset} />
        </div>
      );
    }
    if (page === "Escalation Queue") {
      return <Queue recommendations={dataset.recommendations} />;
    }
    if (page === "Human Review") {
      return <HumanReview dataset={dataset} onDecision={handleDecision} />;
    }
    if (page === "KPI Tree") {
      return <KpiTree dataset={dataset} />;
    }
    if (page === "Governance Log") {
      return (
        <GovernanceLog
          categoryOptions={categoryOptions}
          eventTypeOptions={eventTypeOptions}
          events={dataset.governanceEvents}
        />
      );
    }
    if (page === "Weekly Brief") {
      return (
        <WeeklyBrief
          brief={brief}
          detailMode={briefDetailMode}
          duration={briefDuration}
          exportRef={briefExportRef}
          onExport={handleExportBrief}
          onDetailModeChange={handleBriefDetailModeChange}
          onDurationChange={handleBriefDurationChange}
          onGenerate={handleGenerateBrief}
          onViewModeChange={setBriefViewMode}
          viewMode={briefViewMode}
        />
      );
    }
    return (
      <Settings
        categoryOptions={categoryOptions}
        eventTypeOptions={eventTypeOptions}
        taxonomyChanges={taxonomyChanges}
        onExportCases={() => downloadText("stratis-healthcare-ops-synthetic-cases.csv", casesToCsv(dataset.cases), "text/csv")}
        onCategoryOptionsChange={setCategoryOptions}
        onEventTypeOptionsChange={setEventTypeOptions}
        onReset={handleReset}
        onTaxonomyChange={handleTaxonomyChange}
        onThemeChange={setTheme}
        theme={theme}
      />
    );
  }

  return (
    <Shell page={page} setPage={setPage}>
      {renderPage()}
    </Shell>
  );
}

export default App;
