import { Suspense } from "react";
import { ProductList } from "@/components/catalogue/ProductList";

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductList />
    </Suspense>
  );
}
