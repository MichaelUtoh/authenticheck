import { Suspense } from "react";
import { ProductEdit } from "@/components/catalogue/ProductEdit";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEdit id={id} />;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <Edit params={params} />
    </Suspense>
  );
}
