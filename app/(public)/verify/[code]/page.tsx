import { apiFetch } from "@/lib/api/client";

interface VerifyResult {
  result: "genuine" | "recalled" | "deactivated" | "not_found";
  product_name?: string;
  batch_number?: string;
  expiry?: string;
  manufacturer?: string;
  deactivated_at?: string;
  scan_count?: number;
}

export default async function VerifyPage({ params }: { params: { code: string } }) {
  let data: VerifyResult | null = null;
  let fetchError = false;

  try {
    data = await apiFetch<VerifyResult>(`/verify/${params.code}`);
  } catch {
    fetchError = true;
  }

  if (fetchError || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600">Unable to verify this code. Please try again.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      {data.result === "genuine" && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-6 max-w-md w-full">
          <p className="font-semibold text-green-800">This code is registered to {data.manufacturer}</p>
          <p className="text-sm text-gray-600">Product: {data.product_name}</p>
          <p className="text-sm text-gray-600">Batch: {data.batch_number}</p>
          <p className="text-sm text-gray-600">Expiry: {data.expiry}</p>
          {data.scan_count !== undefined && (
            <p className="text-sm text-gray-500 mt-2">This code has been used {data.scan_count} times.</p>
          )}
        </div>
      )}
      {data.result === "recalled" && (
        <div className="rounded-lg border border-red-600 bg-red-50 p-6 max-w-md w-full">
          <p className="font-bold text-red-700 text-lg">WARNING: This batch has been recalled. Do not use.</p>
          <p className="text-sm text-gray-600">Product: {data.product_name}</p>
          <p className="text-sm text-gray-600">Batch: {data.batch_number}</p>
        </div>
      )}
      {data.result === "deactivated" && (
        <div className="rounded-lg border border-amber-500 bg-amber-50 p-6 max-w-md w-full">
          <p className="font-semibold text-amber-800">This code has been deactivated. Do not use.</p>
          <p className="text-sm text-gray-600">Deactivated: {data.deactivated_at}</p>
        </div>
      )}
      {data.result === "not_found" && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-6 max-w-md w-full">
          <p className="font-semibold text-red-700">Code not found. This code is not registered in our system.</p>
        </div>
      )}
      <a href="#report" className="text-sm text-blue-600 underline">Report a problem with this code</a>
    </main>
  );
}
