"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/lib/format";
import type { ScanAnalytics } from "@/lib/api/analytics";

const COLOR = "#0f5c48";

/** "2026-10-28" -> "28 Oct" */
const dayLabel = (iso: string) => fmtDate(iso).replace(/ \d{4}$/, "");

export function ScanChart({ data }: { data: ScanAnalytics["by_day"] }) {
  const days = data.map((d) => ({ label: dayLabel(d.date), count: d.count }));
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Checks per day</h2>
      </div>
      <div className="mt-4 h-64 sm:h-72" role="img" aria-label="Bar chart of checks per day">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8eae6" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5f6b66" }} interval="preserveStartEnd" minTickGap={40} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5f6b66" }} width={44} />
            <Tooltip
              cursor={{ fill: "rgba(15,92,72,0.06)" }}
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e4e0", fontSize: 12 }}
            />
            <Bar dataKey="count" name="Checks" fill={COLOR} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
