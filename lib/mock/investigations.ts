"use client";

// Prototype data + in-memory store. Replace with /risk/flags and /risk/cases.
// State lives only for the browser session so list, flags and case pages stay consistent.
import { create } from "zustand";
import type { CaseStatus, FlagSeverity } from "@/lib/types";

export type FlagState = "new" | "reviewing" | "in_case" | "reviewed";
export type OutcomeKind = "no_issue" | "monitor" | "action";

export interface Flag {
  id: string;
  rule: string;
  scope: string;
  product: string;
  batchId: string;
  severity: FlagSeverity;
  age: string;
  state: FlagState;
  caseId?: string;
}

export interface CheckEvent {
  at: string;
  code: string;
  result: "first" | "repeat";
  region: string;
  channel: string;
}

export interface Note {
  author: string;
  at: string;
  text: string;
}

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  severity: FlagSeverity;
  product: string;
  batchId: string;
  scope: string;
  owner: string | null;
  opened: string;
  ageDays: number;
  updated: string;
  flagIds: string[];
  summary: string;
  events: CheckEvent[];
  notes: Note[];
  outcome: { kind: OutcomeKind | null; summary: string };
}

export const OWNERS = ["Funmi Adeyemi", "Kemi Okoro", "Tunde Bello"];

const SHEA400 = "Shea Butter Body Lotion · 400 ml";
const SHEA200 = "Shea Butter Body Lotion · 200 ml";
const SOAP = "Black Soap · 250 g";
const HIBISCUS = "Hibiscus Hair Oil · 120 ml";

const flags: Flag[] = [
  { id: "FLG-0142", rule: "Repeat checks after first sale", scope: "7KQ2-…-4PRT", product: SHEA400, batchId: "EN-2409-117", severity: "high", age: "2 h", state: "in_case", caseId: "CASE-0031" },
  { id: "FLG-0141", rule: "Checks in distant regions within 1 h", scope: "Q8N4-…-2LDA", product: SOAP, batchId: "EN-2409-114", severity: "medium", age: "9 h", state: "new" },
  { id: "FLG-0140", rule: "Check on a deactivated code", scope: "B2D9-…-7WXE", product: HIBISCUS, batchId: "EN-2409-108", severity: "high", age: "14 h", state: "new" },
  { id: "FLG-0139", rule: "Consumer report: seal broken", scope: "M3TX-…-9KFE", product: HIBISCUS, batchId: "EN-2409-108", severity: "medium", age: "1 d", state: "in_case", caseId: "CASE-0029" },
  { id: "FLG-0138", rule: "Checks at unusual hours", scope: "Batch EN-2408-099", product: SHEA200, batchId: "EN-2408-099", severity: "low", age: "2 d", state: "new" },
  { id: "FLG-0137", rule: "High repeat rate on one batch", scope: "Batch EN-2407-092", product: SHEA200, batchId: "EN-2407-092", severity: "low", age: "3 d", state: "reviewing" },
  { id: "FLG-0136", rule: "Unusual check volume for one batch", scope: "Batch EN-2409-114", product: SOAP, batchId: "EN-2409-114", severity: "medium", age: "6 d", state: "in_case", caseId: "CASE-0026" },
  { id: "FLG-0135", rule: "Consumer report: damaged seal", scope: "K4RM-…-8TQA", product: SHEA200, batchId: "EN-2408-099", severity: "low", age: "12 d", state: "reviewed", caseId: "CASE-0022" },
  { id: "FLG-0133", rule: "Check on a deactivated code", scope: "Batch EN-2406-081", product: SOAP, batchId: "EN-2406-081", severity: "high", age: "30 d", state: "reviewed", caseId: "CASE-0019" },
];

const cases: Case[] = [
  {
    id: "CASE-0031",
    title: "Repeat checks after first sale",
    status: "investigating",
    severity: "high",
    product: SHEA400,
    batchId: "EN-2409-117",
    scope: "Code 7KQ2-…-4PRT",
    owner: "Kemi Okoro",
    opened: "23 Oct, 08:12",
    ageDays: 1,
    updated: "23 Oct, 10:40",
    flagIds: ["FLG-0142"],
    summary:
      "This code was first checked on 19 Oct and has been checked 6 more times from 4 regions. Repeat checks can mean a copied label, or a genuine pack being re-scanned by curious buyers. Nothing here proves either.",
    events: [
      { at: "19 Oct, 16:02", code: "7KQ2-…-4PRT", result: "first", region: "Lagos", channel: "QR scan" },
      { at: "20 Oct, 09:15", code: "7KQ2-…-4PRT", result: "repeat", region: "Lagos", channel: "QR scan" },
      { at: "21 Oct, 11:40", code: "7KQ2-…-4PRT", result: "repeat", region: "Ogun", channel: "Typed code" },
      { at: "22 Oct, 18:22", code: "7KQ2-…-4PRT", result: "repeat", region: "Kano", channel: "QR scan" },
      { at: "23 Oct, 06:48", code: "7KQ2-…-4PRT", result: "repeat", region: "Lagos", channel: "QR scan" },
      { at: "23 Oct, 07:55", code: "7KQ2-…-4PRT", result: "repeat", region: "Oyo", channel: "USSD" },
      { at: "23 Oct, 08:03", code: "7KQ2-…-4PRT", result: "repeat", region: "Kano", channel: "QR scan" },
    ],
    notes: [{ author: "Kemi Okoro", at: "23 Oct, 10:40", text: "Asked the Ikeja distributor whether this pack was returned stock." }],
    outcome: { kind: null, summary: "" },
  },
  {
    id: "CASE-0029",
    title: "Consumer report: seal broken",
    status: "open",
    severity: "medium",
    product: HIBISCUS,
    batchId: "EN-2409-108",
    scope: "Code M3TX-…-9KFE",
    owner: null,
    opened: "22 Oct, 13:30",
    ageDays: 2,
    updated: "22 Oct, 13:30",
    flagIds: ["FLG-0139"],
    summary: "A consumer reported a broken seal on a bottle from this batch. The report is a lead only; the code itself has been checked twice.",
    events: [
      { at: "20 Oct, 12:10", code: "M3TX-…-9KFE", result: "first", region: "Lagos", channel: "QR scan" },
      { at: "22 Oct, 15:10", code: "M3TX-…-9KFE", result: "repeat", region: "Lagos", channel: "Typed code" },
    ],
    notes: [],
    outcome: { kind: null, summary: "" },
  },
  {
    id: "CASE-0026",
    title: "Unusual check volume for one batch",
    status: "investigating",
    severity: "medium",
    product: SOAP,
    batchId: "EN-2409-114",
    scope: "Batch EN-2409-114",
    owner: "Tunde Bello",
    opened: "17 Oct, 09:00",
    ageDays: 6,
    updated: "21 Oct, 16:15",
    flagIds: ["FLG-0136"],
    summary: "Check volume for this batch is about three times the norm in the first week after release, concentrated in Kano.",
    events: [
      { at: "17 Oct, 08:40", code: "D7HF-…-3LMA", result: "first", region: "Kano", channel: "QR scan" },
      { at: "17 Oct, 08:44", code: "G2WP-…-6CNB", result: "first", region: "Kano", channel: "QR scan" },
      { at: "17 Oct, 08:51", code: "V9KT-…-1DXE", result: "first", region: "Kano", channel: "USSD" },
      { at: "18 Oct, 10:02", code: "D7HF-…-3LMA", result: "repeat", region: "Kano", channel: "QR scan" },
    ],
    notes: [
      { author: "Tunde Bello", at: "18 Oct, 14:00", text: "Sales team confirms a promotion launched in Kano on 16 Oct. May explain the volume." },
      { author: "Tunde Bello", at: "21 Oct, 16:15", text: "Waiting on the distributor's sell-in figures before closing." },
    ],
    outcome: { kind: "monitor", summary: "" },
  },
  {
    id: "CASE-0022",
    title: "Consumer report: damaged seal",
    status: "resolved",
    severity: "low",
    product: SHEA200,
    batchId: "EN-2408-099",
    scope: "Code K4RM-…-8TQA",
    owner: "Funmi Adeyemi",
    opened: "11 Oct, 10:00",
    ageDays: 12,
    updated: "14 Oct, 09:20",
    flagIds: ["FLG-0135"],
    summary: "A single report of a damaged seal. The pack was returned and inspected.",
    events: [{ at: "10 Oct, 17:30", code: "K4RM-…-8TQA", result: "first", region: "Abuja", channel: "QR scan" }],
    notes: [{ author: "Funmi Adeyemi", at: "14 Oct, 09:20", text: "Pack inspected. Seal damaged in transit, not tampered with." }],
    outcome: { kind: "no_issue", summary: "Transit damage. Packaging supplier notified." },
  },
  {
    id: "CASE-0019",
    title: "Check on a deactivated code",
    status: "closed",
    severity: "high",
    product: SOAP,
    batchId: "EN-2406-081",
    scope: "Batch EN-2406-081",
    owner: "Kemi Okoro",
    opened: "23 Sep, 11:00",
    ageDays: 30,
    updated: "30 Sep, 15:45",
    flagIds: ["FLG-0133"],
    summary: "Several checks on codes from a batch that had been deactivated after a misprint.",
    events: [{ at: "22 Sep, 19:12", code: "H5NC-…-2ZRP", result: "first", region: "Lagos", channel: "QR scan" }],
    notes: [{ author: "Kemi Okoro", at: "30 Sep, 15:45", text: "Batch recalled and replacement codes issued." }],
    outcome: { kind: "action", summary: "Batch recalled; replacement codes issued." },
  },
];

interface State {
  cases: Case[];
  flags: Flag[];
  openCase: (flagId: string, author: string) => string;
  markFlagReviewed: (flagId: string) => void;
  setStatus: (caseId: string, status: CaseStatus) => void;
  setOwner: (caseId: string, owner: string | null) => void;
  addNote: (caseId: string, author: string, text: string) => void;
  setOutcome: (caseId: string, patch: Partial<Case["outcome"]>) => void;
}

const patchCase = (s: State, id: string, fn: (c: Case) => Case) => ({
  cases: s.cases.map((c) => (c.id === id ? { ...fn(c), updated: "Just now" } : c)),
});

export const useInvestigations = create<State>((set, get) => ({
  cases,
  flags,

  openCase: (flagId, author) => {
    const flag = get().flags.find((f) => f.id === flagId)!;
    const id = `CASE-00${32 + get().cases.filter((c) => Number(c.id.slice(5)) > 31).length}`;
    const created: Case = {
      id,
      title: flag.rule,
      status: "open",
      severity: flag.severity,
      product: flag.product,
      batchId: flag.batchId,
      scope: flag.scope,
      owner: null,
      opened: "Just now",
      ageDays: 0,
      updated: "Just now",
      flagIds: [flagId],
      summary: "",
      events: [],
      notes: [{ author, at: "Just now", text: `Case opened from ${flagId}.` }],
      outcome: { kind: null, summary: "" },
    };
    set((s) => ({
      cases: [created, ...s.cases],
      flags: s.flags.map((f) => (f.id === flagId ? { ...f, state: "in_case", caseId: id } : f)),
    }));
    return id;
  },

  markFlagReviewed: (flagId) =>
    set((s) => ({ flags: s.flags.map((f) => (f.id === flagId ? { ...f, state: "reviewed" } : f)) })),

  setStatus: (caseId, status) =>
    set((s) => ({
      ...patchCase(s, caseId, (c) => ({ ...c, status })),
      // closing a case marks its flags reviewed; reopening puts them back in the case
      flags: s.flags.map((f) =>
        f.caseId === caseId ? { ...f, state: status === "closed" || status === "resolved" ? "reviewed" : "in_case" } : f
      ),
    })),

  setOwner: (caseId, owner) => set((s) => patchCase(s, caseId, (c) => ({ ...c, owner }))),

  addNote: (caseId, author, text) =>
    set((s) => patchCase(s, caseId, (c) => ({ ...c, notes: [...c.notes, { author, at: "Just now", text }] }))),

  setOutcome: (caseId, patch) =>
    set((s) => patchCase(s, caseId, (c) => ({ ...c, outcome: { ...c.outcome, ...patch } }))),
}));

export function flagStatusText(f: Flag) {
  return f.state === "new" ? "New" : f.state === "reviewing" ? "Reviewing" : f.state === "reviewed" ? "Reviewed" : `In case ${f.caseId}`;
}

export const isActiveCase = (c: Case) => c.status === "open" || c.status === "investigating";
