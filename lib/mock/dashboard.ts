// Prototype data. Replace with /analytics/*, /risk/flags and /issuance/jobs once wired up.
import type { FlagSeverity } from "@/lib/types";

export type Period = 7 | 30 | 90;

export interface DayChecks {
  label: string;
  first: number;
  repeat: number;
}

export interface FlagRow {
  id: string;
  rule: string;
  scope: string;
  product: string;
  severity: FlagSeverity;
  age: string;
  status: string;
}

export interface JobRow {
  id: string;
  batch: string;
  product: string;
  requested: number;
  generated: number;
  failed: number;
  status: "partial" | "exported" | "generated";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const END = Date.UTC(2026, 9, 23); // 23 Oct 2026

// Deterministic so server and client renders match.
function series(days: number): DayChecks[] {
  return Array.from({ length: days }, (_, i) => {
    const offset = days - 1 - i;
    const d = new Date(END - offset * 86_400_000);
    const n = 90 - offset;
    const first = Math.round(430 + n * 3 + 90 * Math.sin(n * 0.8) + ((n * 37) % 60));
    const repeat = Math.round(first * 0.1 + ((n * 13) % 35));
    return { label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, first, repeat };
  });
}

export const flags: FlagRow[] = [
  { id: "FLG-0142", rule: "Repeat checks after first sale", scope: "7KQ2-…-4PRT", product: "Shea Butter Body Lotion 400 ml", severity: "high", age: "2 h", status: "In case CASE-0031" },
  { id: "FLG-0141", rule: "Checks in distant regions within 1 h", scope: "Q8N4-…-2LDA", product: "Black Soap 250 g", severity: "medium", age: "9 h", status: "New" },
  { id: "FLG-0139", rule: "Consumer report: seal broken", scope: "M3TX-…-9KFE", product: "Hibiscus Hair Oil 120 ml", severity: "medium", age: "1 d", status: "In case CASE-0029" },
  { id: "FLG-0137", rule: "High repeat rate on one batch", scope: "Batch EN-2407-092", product: "Shea Butter Body Lotion 200 ml", severity: "low", age: "3 d", status: "Reviewing" },
];

export const jobs: JobRow[] = [
  { id: "JOB-8K2F", batch: "EN-2409-117", product: "Shea Butter Body Lotion 400 ml", requested: 20000, generated: 19950, failed: 50, status: "partial" },
  { id: "JOB-8J9C", batch: "EN-2409-114", product: "Black Soap 250 g", requested: 10000, generated: 10000, failed: 0, status: "exported" },
  { id: "JOB-8H1A", batch: "EN-2409-108", product: "Hibiscus Hair Oil 120 ml", requested: 5000, generated: 5000, failed: 0, status: "generated" },
];

export function getDashboard(period: Period) {
  const checks = series(period);
  const first = checks.reduce((s, d) => s + d.first, 0);
  const repeat = checks.reduce((s, d) => s + d.repeat, 0);
  const total = first + repeat;
  return {
    checks,
    kpis: {
      products: 13,
      drafts: 3,
      activeBatches: 61,
      expiringSoon: 4,
      codesIssued: 412800,
      deactivated: 1240,
      totalChecks: total,
      repeatChecks: repeat,
      repeatShare: Math.round((repeat / total) * 1000) / 10,
      openFlags: 7,
      highFlags: 2,
      openCases: 3,
      oldestCaseDays: 6,
    },
    flags,
    jobs,
  };
}
