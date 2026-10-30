import { apiFetch } from "./client";

// ENDPOINT_REFERENCE.md gives only the two paths: POST starts a job (202), GET polls it. The field
// names (`import_type`, `file`, and every response field) are assumed; see BACKEND_API_REQUIREMENTS IMP-*.
export type ImportType = "brands" | "products" | "batches";
export type ImportStatus = "pending" | "processing" | "done" | "failed";

export interface ImportRowError {
  row: number;
  column?: string;
  message: string;
}

export interface ImportJob {
  id: string;
  import_type?: ImportType;
  status: ImportStatus;
  total_rows?: number;
  processed_rows?: number;
  created?: number;
  skipped?: number;
  failed?: number;
  errors: ImportRowError[];
  /** Set when the whole file was rejected (bad header, wrong type, unreadable). */
  message?: string;
}

/** Accepts a few likely spellings so a small naming difference doesn't blank the page. */
function normalize(raw: Record<string, unknown>): ImportJob {
  const n = (...keys: string[]) => {
    for (const k of keys) if (typeof raw[k] === "number") return raw[k] as number;
    return undefined;
  };
  const errs = (raw.errors ?? raw.row_errors ?? []) as Record<string, unknown>[];
  return {
    id: String(raw.id),
    import_type: raw.import_type as ImportType | undefined,
    status: (raw.status as ImportStatus) ?? "pending",
    total_rows: n("total_rows", "total"),
    processed_rows: n("processed_rows", "processed"),
    created: n("created", "created_count", "success_count"),
    skipped: n("skipped", "skipped_count"),
    failed: n("failed", "failed_count", "error_count"),
    errors: Array.isArray(errs)
      ? errs.map((e) => ({
          row: Number(e.row ?? e.row_number ?? 0),
          column: (e.column ?? e.field) as string | undefined,
          message: String(e.message ?? e.error ?? "Invalid value"),
        }))
      : [],
    message: (raw.message ?? raw.detail) as string | undefined,
  };
}

export const importApi = {
  start: (type: ImportType, file: File) => {
    const form = new FormData();
    form.append("import_type", type);
    form.append("file", file);
    return apiFetch<Record<string, unknown>>("/catalogue/import", { method: "POST", body: form }).then(normalize);
  },
  get: (id: string) => apiFetch<Record<string, unknown>>(`/catalogue/import/${id}`).then(normalize),
};
