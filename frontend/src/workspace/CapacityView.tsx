import { useState } from "react";

import type { Capacity, CapacityInputs } from "../lib/design-api";

interface CapacityViewProps {
  capacity: Capacity | null;
  computing: boolean;
  error: string | null;
  onCompute: (inputs: CapacityInputs) => void;
}

/**
 * Capacity dashboard: inputs form → deterministic outputs + simple bar charts.
 * No AI; results come from the backend capacity engine.
 */
export default function CapacityView({
  capacity,
  computing,
  error,
  onCompute,
}: CapacityViewProps) {
  // Seed the form from a prior computation so re-tuning is easy.
  const [dau, setDau] = useState(capacity?.inputs.dau ?? 1_000_000);
  const [factor, setFactor] = useState(capacity?.inputs.peak_traffic_factor ?? 3);
  const [actions, setActions] = useState(capacity?.inputs.actions_per_user ?? 30);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onCompute({
      dau,
      peak_traffic_factor: factor,
      actions_per_user: actions,
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3"
      >
        <NumberField label="Daily Active Users" value={dau} min={1} onChange={setDau} />
        <NumberField
          label="Peak Traffic Factor"
          value={factor}
          min={1}
          step={0.5}
          onChange={setFactor}
        />
        <NumberField
          label="Actions / User / Day"
          value={actions}
          min={1}
          onChange={setActions}
        />
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={computing}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {computing ? "Computing…" : capacity ? "Recompute" : "Compute capacity"}
          </button>
          {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {!capacity ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">No estimates yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Enter traffic inputs and compute deterministic sizing estimates.
          </p>
        </div>
      ) : (
        <>
          {/* Output metric cards (the dashboard) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Metric label="Peak RPS" value={capacity.peak_rps.toLocaleString()} />
            <Metric label="Average RPS" value={capacity.average_rps.toLocaleString()} />
            <Metric label="Bandwidth (peak)" value={capacity.peak_bandwidth_human} />
            <Metric
              label="Storage Growth / mo"
              value={capacity.storage_growth_per_month_human}
            />
            <Metric label="Database Size" value={capacity.database_size_human} />
            <Metric
              label="Daily Requests"
              value={capacity.total_daily_requests.toLocaleString()}
            />
          </div>

          {/* Charts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-700">
              Average vs Peak RPS
            </h3>
            <BarChart
              data={[
                { label: "Average RPS", value: capacity.average_rps },
                { label: "Peak RPS", value: capacity.peak_rps },
              ]}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-700">
              Storage outlook (bytes)
            </h3>
            <BarChart
              data={[
                {
                  label: "Per day",
                  value: capacity.storage_growth_per_day_bytes,
                },
                {
                  label: "Per month",
                  value: capacity.storage_growth_per_month_bytes,
                },
                { label: "DB total", value: capacity.database_size_bytes },
              ]}
            />
          </div>

          {/* Cache recommendation */}
          <div className="rounded-xl border border-slate-200 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-800">
              Cache Recommendation
            </h3>
            <p className="mt-1 text-sm text-amber-900">
              {capacity.cache_recommendation}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mt-4 space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{d.label}</span>
            <span>{d.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
