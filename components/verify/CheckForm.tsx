"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cleanCode, formatCode, validateCode } from "@/lib/api/verify";

/** Type-the-code form. Shape errors are caught here, so a typo never counts as a check. */
export function CheckForm({ initial = "", initialError = null, autoFocus, card }: { initial?: string; initialError?: string | null; autoFocus?: boolean; card?: boolean }) {
  const router = useRouter();
  const prefill = useSearchParams().get("code") ?? initial;
  const [value, setValue] = useState(prefill);
  const [error, setError] = useState<string | null>(initialError);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateCode(value);
    setError(problem);
    if (!problem) router.push(`/verify/${formatCode(cleanCode(value))}`);
  }

  return (
    <form onSubmit={submit} noValidate className={card ? "flex flex-1 flex-col" : undefined}>
      <label htmlFor="code" className="block font-semibold">Product code</label>
      <input
        id="code"
        value={value}
        onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
        placeholder="e.g. 7KQ2-M9XW-4PRT"
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={24}
        aria-invalid={!!error}
        aria-describedby="code-help"
        className={`mt-2 h-14 w-full rounded-xl border bg-white px-4 font-mono text-lg uppercase tracking-wider placeholder:normal-case placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${error ? "border-danger" : "border-border"}`}
      />
      <p id="code-help" role={error ? "alert" : undefined} className={`mt-2 text-sm ${error ? "text-danger" : "text-muted"}`}>
        {error ?? "12 letters and numbers. You can leave out the dashes."}
      </p>
      {card && <p className="mt-4 text-[15px] text-muted">Example: 7KQ2-M9XW-4PRT</p>}
      <button type="submit" className={`inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${card ? "mt-auto bg-primary text-white hover:bg-primary-hover" : "mt-4 bg-white text-primary hover:bg-primary-soft"}`}>
        Check code
      </button>
    </form>
  );
}
