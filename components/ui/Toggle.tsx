"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

/** Switch-style checkbox row. Works with react-hook-form `register`. */
export const Toggle = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }>(
  function Toggle({ label, hint, className = "", ...props }, ref) {
    return (
      <label className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border px-3.5 py-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${className}`}>
        <span>
          <span className="block text-sm font-medium">{label}</span>
          {hint && <span className="block text-xs text-muted">{hint}</span>}
        </span>
        <span className="relative mt-0.5 shrink-0">
          <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...props} />
          <span className="block h-6 w-11 rounded-full bg-black/20 transition peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
          <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </label>
    );
  }
);
