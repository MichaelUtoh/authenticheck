// Prototype data. Replace with the batch / issuance endpoints once they exist
// (see docs: batches across products, batch summary, exports, reconciliation).

export type BatchStatus = "active" | "recalled" | "expired";
export type Attention = "partial" | "unreconciled" | "expiring" | "approval";

export interface BatchRow {
  id: string; // batch number, also the route id
  productId: string;
  product: string;
  manufactured: string; // ISO date
  bestBefore: string;
  declared: number;
  generated: number;
  failed: number;
  status: BatchStatus;
  reconciled: boolean;
  attention: Attention[];
  jobId: string;
  packFormat: string;
}

export interface ExportRow {
  id: string;
  format: string;
  codes: number;
  created: string;
  by: string;
  sha: string;
  downloads: number;
}

export interface Reconciliation {
  printed: number;
  damaged: number;
  unused: number;
  updated: string;
  damagedActive: number;
}

export interface HistoryEvent {
  at: string;
  actor: string;
  text: string;
}

export const batches: BatchRow[] = [
  { id: "EN-2409-117", productId: "p-shea-400", product: "Shea Butter Body Lotion · 400 ml", manufactured: "2026-09-12", bestBefore: "2028-09-30", declared: 20000, generated: 19950, failed: 50, status: "active", reconciled: true, attention: ["partial", "unreconciled"], jobId: "JOB-8K2F", packFormat: "Bottle · QR + scratch panel" },
  { id: "EN-2409-114", productId: "p-soap-250", product: "Black Soap · 250 g", manufactured: "2026-09-08", bestBefore: "2028-09-08", declared: 10000, generated: 10000, failed: 0, status: "active", reconciled: true, attention: [], jobId: "JOB-8J9C", packFormat: "Wrapped bar · QR label" },
  { id: "EN-2409-108", productId: "p-hibiscus-120", product: "Hibiscus Hair Oil · 120 ml", manufactured: "2026-09-02", bestBefore: "2028-03-01", declared: 5000, generated: 5000, failed: 0, status: "active", reconciled: false, attention: ["unreconciled", "approval"], jobId: "JOB-8H1A", packFormat: "Bottle · QR label" },
  { id: "EN-2408-099", productId: "p-shea-200", product: "Shea Butter Body Lotion · 200 ml", manufactured: "2026-08-19", bestBefore: "2028-08-31", declared: 15000, generated: 15000, failed: 0, status: "active", reconciled: true, attention: [], jobId: "JOB-8F70", packFormat: "Bottle · QR + scratch panel" },
  { id: "EN-2407-092", productId: "p-shea-200", product: "Shea Butter Body Lotion · 200 ml", manufactured: "2026-07-22", bestBefore: "2026-12-15", declared: 12000, generated: 12000, failed: 0, status: "active", reconciled: true, attention: ["expiring"], jobId: "JOB-8D31", packFormat: "Bottle · QR label" },
  { id: "EN-2406-081", productId: "p-soap-250", product: "Black Soap · 250 g", manufactured: "2026-06-10", bestBefore: "2028-06-10", declared: 8000, generated: 8000, failed: 0, status: "recalled", reconciled: true, attention: [], jobId: "JOB-8A12", packFormat: "Wrapped bar · QR label" },
  { id: "EN-2402-044", productId: "p-hibiscus-120", product: "Hibiscus Hair Oil · 120 ml", manufactured: "2026-02-03", bestBefore: "2026-08-03", declared: 6000, generated: 6000, failed: 0, status: "expired", reconciled: true, attention: [], jobId: "JOB-7C55", packFormat: "Bottle · QR label" },
];

export const exportsByBatch: Record<string, ExportRow[]> = {
  "EN-2409-117": [
    { id: "EXP-3301", format: "Print-ready PDF · 40×40 mm · template v3", codes: 19950, created: "22 Oct, 14:31", by: "Kemi Okoro", sha: "9f2c…e41a", downloads: 2 },
    { id: "EXP-3302", format: "CSV for printer · template v2", codes: 19950, created: "22 Oct, 14:40", by: "Kemi Okoro", sha: "b71d…03c9", downloads: 1 },
  ],
};

export function getBatches() {
  return batches;
}

export function getBatchDetail(id: string) {
  const b = batches.find((x) => x.id === id);
  if (!b) return null;

  const exported = b.generated;
  const featured = id === "EN-2409-117";
  const deactivated = featured ? 12 : b.status === "recalled" ? b.generated : 0;

  const reconciliation: Reconciliation | null = !b.reconciled
    ? null
    : featured
      ? { printed: 19700, damaged: 180, unused: 70, updated: "23 Oct, 10:20", damagedActive: 168 }
      : { printed: b.generated - 40, damaged: 25, unused: 15, updated: "2 Oct, 09:05", damagedActive: 0 };

  return {
    batch: b,
    job: {
      id: b.jobId,
      startedAt: featured ? "22 Oct 2026, 14:05 WAT" : "Sep 2026",
      startedBy: "Kemi Okoro",
      key: "idem-5c1e…a9",
    },
    issuance: { requested: b.declared, generated: b.generated, failed: b.failed, exported, cancelled: 0, deactivated },
    reconciliation,
    exports: exportsByBatch[id] ?? [
      { id: `EXP-${b.jobId.slice(4)}`, format: "CSV for printer · template v2", codes: exported, created: "—", by: "Kemi Okoro", sha: "c4e0…77b2", downloads: 1 },
    ],
    history: [
      { at: "23 Oct, 10:20", actor: "Kemi Okoro", text: "Updated label reconciliation counts" },
      { at: "22 Oct, 14:40", actor: "Kemi Okoro", text: "Created export CSV for printer · template v2" },
      { at: "22 Oct, 14:31", actor: "Kemi Okoro", text: "Created export Print-ready PDF · 40×40 mm" },
      { at: "22 Oct, 14:05", actor: "Kemi Okoro", text: `Started issuance job ${b.jobId} for ${b.declared.toLocaleString("en-US")} codes` },
      { at: "12 Sep, 09:30", actor: "Funmi Adeyemi", text: `Created batch ${b.id}` },
    ] as HistoryEvent[],
  };
}
