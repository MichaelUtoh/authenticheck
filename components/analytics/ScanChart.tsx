"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayChecks } from "@/lib/mock/dashboard";

const FIRST = "#0f5c48";
const REPEAT = "#d99a1c";

function Legend() {
  return (
    <div className="flex items-center gap-4 text-sm text-muted">
      {[["First checks", FIRST], ["Repeat checks", REPEAT]].map(([l, c]) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  );
}

export function ScanChart({ data }: { data: DayChecks[] }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Checks per day</h2>
        <Legend />
      </div>
      <div className="mt-4 h-64 sm:h-72" role="img" aria-label="Stacked bar chart of first and repeat checks per day">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8eae6" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5f6b66" }} interval="preserveStartEnd" minTickGap={40} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5f6b66" }} width={44} />
            <Tooltip
              cursor={{ fill: "rgba(15,92,72,0.06)" }}
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e4e0", fontSize: 12 }}
            />
            <Bar dataKey="first" name="First checks" stackId="c" fill={FIRST} />
            <Bar dataKey="repeat" name="Repeat checks" stackId="c" fill={REPEAT} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
