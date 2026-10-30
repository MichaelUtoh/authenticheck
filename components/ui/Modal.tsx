"use client";

import { useEffect, useId } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const id = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={id} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id={id} className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** Secondary (outline) button used beside the primary `Button`. */
export function GhostButton({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  );
}
