import { Suspense } from "react";
import { ProductReviewQueue } from "@/components/platform/ProductReviewQueue";

export default function PlatformProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductReviewQueue />
    </Suspense>
  );
}
