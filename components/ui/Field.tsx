"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, trailing, className = "", ...props },
  ref
) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-lg border bg-white px-3.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            error ? "border-danger" : "border-border"
          } ${trailing ? "pr-16" : ""} ${className}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, "type" | "trailing">>(
  function PasswordField(props, ref) {
    const [show, setShow] = useState(false);
    return (
      <Field
        ref={ref}
        {...props}
        type={show ? "text" : "password"}
        trailing={
          <button type="button" onClick={() => setShow((s) => !s)} className="text-xs font-medium text-primary hover:underline">
            {show ? "Hide" : "Show"}
          </button>
        }
      />
    );
  }
);
