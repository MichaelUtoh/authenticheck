"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { asList, catalogueApi, type BatchWrite } from "@/lib/api/catalogue";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/client";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { useApi } from "@/lib/hooks/useApi";

interface Values {
  product_id: string;
  batch_number: string;
  manufacture_date: string;
  expiry: string;
  declared_quantity: string;
  pack_format: string;
}

const card = "rounded-2xl border border-border bg-white p-5 sm:p-6";
const today = () => new Date().toISOString().slice(0, 10);

export function BatchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { canEdit } = useCatalogueRole();
  // Only approved, active products can have batches (the API answers 409 product_not_approved otherwise).
  const products = useApi(() => catalogueApi.listProducts({ status: ["approved"], is_active: true, ordering: "name", page_size: 100 }), []);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      product_id: params.get("product_id") ?? "",
      batch_number: "",
      manufacture_date: "",
      expiry: "",
      declared_quantity: "",
      pack_format: "",
    },
  });

  const list = products.data?.results ?? asList(products.data);

  async function onSubmit(v: Values) {
    setError(null);
    const body: BatchWrite = {
      product_id: v.product_id,
      batch_number: v.batch_number.trim(),
      manufacture_date: v.manufacture_date,
      expiry: v.expiry,
      declared_quantity: Number(v.declared_quantity),
      ...(v.pack_format.trim() ? { pack_format: v.pack_format.trim() } : {}),
    };
    try {
      await catalogueApi.createBatch(body);
      // The product page lists real batches; the batch detail page still runs on sample data.
      router.push(`/catalogue/products/${v.product_id}`);
    } catch (e) {
      const details = fieldErrors(e);
      const known: Record<string, keyof Values> = { manufactured_at: "manufacture_date", quantity: "declared_quantity", expires_at: "expiry", best_before: "expiry", product: "product_id" };
      let leftover = "";
      let first = true;
      for (const [k, msg] of Object.entries(details)) {
        const name = (known[k] ?? k) as keyof Values;
        if (name in v) { setFieldError(name, { message: msg }, { shouldFocus: first }); first = false; }
        else leftover += `${k}: ${msg} `;
      }
      if (e instanceof ApiError && e.error.code === "product_not_approved") setError("That product isn't approved yet, so it can't have batches.");
      else if (leftover) setError(leftover.trim());
      else if (!Object.keys(details).length) setError(errorMessage(e, "We couldn't create the batch. Please try again."));
    }
  }

  if (!canEdit) {
    return <EmptyState title="You can't create batches" body="Owners, admins and production/quality members can add batches. Ask one of them to do this." />;
  }
  if (products.error) return <ErrorState message={errorMessage(products.error, "We couldn't load your products.")} onRetry={products.reload} />;
  if (products.loading && !products.data) return <LoadingSpinner />;
  if (list.length === 0) {
    return (
      <EmptyState
        title="No approved products yet"
        body="A batch belongs to an approved product. Submit a product for review first; once it's approved you can add batches."
        action={<Link href="/catalogue/products" className="text-sm font-medium text-primary hover:underline">Go to products</Link>}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={`${card} max-w-2xl space-y-5`}>
      <FormError message={error} />

      <Select label="Product *" error={errors.product_id?.message} {...register("product_id", { required: "Choose a product" })}>
        <option value="">Select a product</option>
        {list.map((p) => (
          <option key={p.id} value={p.id}>{[p.name, p.variant, p.size].filter(Boolean).join(" · ")} ({p.sku})</option>
        ))}
      </Select>

      <Field
        label="Batch number *"
        className="font-mono"
        placeholder="EN-2409-117"
        hint="Unique in your company. Letters, numbers, - . and _ only; no spaces or slashes."
        error={errors.batch_number?.message}
        {...register("batch_number", {
          required: "Enter a batch number",
          pattern: { value: /^[A-Za-z0-9._-]+$/, message: "Use letters, numbers, - . and _ only" },
          maxLength: { value: 64, message: "Keep it under 64 characters" },
        })}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Manufacture date *"
          type="date"
          max={today()}
          error={errors.manufacture_date?.message}
          {...register("manufacture_date", { required: "Enter the manufacture date" })}
        />
        <Field
          label="Best before *"
          type="date"
          error={errors.expiry?.message}
          {...register("expiry", {
            required: "Enter the best-before date",
            validate: (x) => !getValues("manufacture_date") || x > getValues("manufacture_date") || "Must be after the manufacture date",
          })}
        />
      </div>

      <Field
        label="Declared quantity *"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        placeholder="20000"
        hint="Units you plan to produce. Codes are issued against this later."
        error={errors.declared_quantity?.message}
        {...register("declared_quantity", {
          required: "Enter the quantity",
          validate: (x) => (Number.isInteger(Number(x)) && Number(x) >= 1) || "Enter a whole number, 1 or more",
        })}
      />

      <Field
        label="Pack format"
        placeholder="Bottle · QR + scratch panel"
        hint="Optional. How the code is carried on the pack."
        error={errors.pack_format?.message}
        {...register("pack_format")}
      />

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isSubmitting} className="!w-auto">Create batch</Button>
        <Link href="/issuance/batches" className="text-sm text-muted hover:underline">Cancel</Link>
      </div>
    </form>
  );
}
