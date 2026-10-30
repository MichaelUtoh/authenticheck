"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ImportResult } from "@/components/imports/ImportResult";
import { IMPORT_TYPES } from "@/components/imports/importTypes";
import { UploadZone } from "@/components/imports/UploadZone";
import { Topbar } from "@/components/layout/Topbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button, FormError } from "@/components/ui/Button";
import { ApiError, errorMessage } from "@/lib/api/client";
import { importApi, type ImportJob, type ImportType } from "@/lib/api/imports";
import { useCatalogueRole } from "@/lib/auth/permissions";

const POLL_MS = 3_000;

export default function ImportPage() {
  const router = useRouter();
  const jobId = useSearchParams().get("job");
  const { canAdminister } = useCatalogueRole();
  const [type, setType] = useState<ImportType>("products");
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const running = !!jobId && (!job || job.status === "pending" || job.status === "processing");

  // Poll the job named in the URL, so a refresh or a shared link picks up where it was.
  useEffect(() => {
    if (!jobId || !canAdminister) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const j = await importApi.get(jobId);
        if (!alive) return;
        setJob(j);
        setError(null);
        if (j.status === "pending" || j.status === "processing") timer = setTimeout(tick, POLL_MS);
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) return setError("We couldn't find that import.");
        setError(errorMessage(e, "We couldn't check on the import. Retrying…"));
        timer = setTimeout(tick, POLL_MS);
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [jobId, canAdminister]);

  async function start() {
    if (!file) return;
    setStarting(true);
    setError(null);
    try {
      const j = await importApi.start(type, file);
      setJob(j);
      router.replace(`/catalogue/import?job=${j.id}`);
    } catch (e) {
      setError(errorMessage(e, "We couldn't start the import. Please try again."));
    } finally {
      setStarting(false);
    }
  }

  function reset() {
    setJob(null);
    setFile(null);
    setError(null);
    router.replace("/catalogue/import");
  }

  const total = job?.total_rows;
  const pct = total ? Math.min(100, Math.round(((job?.processed_rows ?? 0) / total) * 100)) : undefined;

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Imports</h1>
          <p className="mt-1 text-muted">Add many brands, products or batches at once from a CSV file.</p>
        </div>

        {!canAdminister ? (
          <section className="rounded-2xl border border-border bg-white">
            <EmptyState title="Only owners and admins can import" body="Ask an owner or admin to run the import, or add items one at a time." />
          </section>
        ) : job && !running ? (
          <ImportResult job={job} onReset={reset} />
        ) : running ? (
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6" aria-live="polite">
            <FormError message={error} />
            <h2 className="text-lg font-semibold">Importing…</h2>
            <p className="mt-1 text-sm text-muted">You can leave this page. The import keeps running and this link shows its progress.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full bg-primary transition-all ${pct === undefined ? "w-1/3 animate-pulse" : ""}`} style={pct === undefined ? undefined : { width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">{pct === undefined ? "Preparing your file" : `${(job?.processed_rows ?? 0).toLocaleString("en-US")} of ${total?.toLocaleString("en-US")} rows`}</p>
          </section>
        ) : (
          <section className="space-y-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
            <FormError message={error} />
            <fieldset>
              <legend className="text-sm font-semibold">1 · What are you importing?</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {IMPORT_TYPES.map((t) => (
                  <label key={t.key} className={`cursor-pointer rounded-xl border p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${type === t.key ? "border-primary bg-primary/5" : "border-border hover:bg-background"}`}>
                    <input type="radio" name="import_type" value={t.key} checked={type === t.key} onChange={() => setType(t.key)} className="sr-only" />
                    <span className="block font-medium">{t.label}</span>
                    <span className="mt-1 block text-xs text-muted">{t.body}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">Import in this order: brands, then products, then batches.</p>
            </fieldset>

            <div>
              <h2 className="mb-3 text-sm font-semibold">2 · Upload your CSV file</h2>
              <UploadZone file={file} onFile={setFile} disabled={starting} />
            </div>

            <div className="max-w-xs">
              <Button type="button" loading={starting} disabled={!file} onClick={start}>Start import</Button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
