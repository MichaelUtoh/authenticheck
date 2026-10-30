"use client";

import { useRef, useState } from "react";
import { MAX_BYTES } from "./importTypes";

/** Returns an error message for a file we won't send, or null. */
export function checkFile(file: File): string | null {
  if (!/\.csv$/i.test(file.name)) return "Choose a .csv file. Export your spreadsheet as CSV first.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_BYTES) return `That file is larger than ${MAX_BYTES / 1024 / 1024} MB. Split it and import in parts.`;
  return null;
}

export function UploadZone({ file, onFile, disabled }: { file: File | null; onFile: (f: File | null) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    const problem = checkFile(f);
    setError(problem);
    onFile(problem ? null : f);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) pick(e.dataTransfer.files[0]); }}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${over ? "border-primary bg-primary/5" : "border-border bg-background"}`}
      >
        {file ? (
          <p className="text-sm">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-muted">{(file.size / 1024).toFixed(file.size < 10240 ? 1 : 0)} KB</span>
            {!disabled && (
              <button type="button" onClick={() => { onFile(null); if (input.current) input.current.value = ""; }} className="ml-3 font-medium text-primary hover:underline">Remove</button>
            )}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">Drag a CSV file here</p>
            <p className="mt-1 text-xs text-muted">or</p>
            <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="mt-2 inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold hover:bg-background disabled:opacity-60">
              Choose file
            </button>
          </>
        )}
        <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
