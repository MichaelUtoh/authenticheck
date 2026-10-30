import type { ImportType } from "@/lib/api/imports";

export const IMPORT_TYPES: { key: ImportType; label: string; body: string; next: { href: string; label: string } }[] = [
  { key: "brands", label: "Brands", body: "Add your brands first. Products refer to them.", next: { href: "/catalogue/brands", label: "Go to brands" } },
  { key: "products", label: "Products", body: "Imported products arrive as drafts. You still send them for review.", next: { href: "/catalogue/products", label: "Go to products" } },
  { key: "batches", label: "Batches", body: "Add batches to products that are already approved.", next: { href: "/issuance/batches", label: "Go to batches" } },
];

export const MAX_BYTES = 10 * 1024 * 1024; // assumed limit; the API's real limit isn't documented
