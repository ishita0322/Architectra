import { useQuery } from "@tanstack/react-query";

import { apiGet } from "./lib/api";

interface DbHealth {
  status: string;
  database: string;
}

export default function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health-db"],
    queryFn: () => apiGet<DbHealth>("/health/db"),
  });

  const connected = data?.database === "connected";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          AI System Architect
        </h1>
        <p className="mt-1 text-sm text-slate-500">Milestone 0 — environment check</p>

        <div className="mt-6 space-y-3">
          <StatusRow label="Frontend" ok={true} note="React + Vite running" />
          <StatusRow
            label="Backend API"
            ok={!isError && !isLoading}
            note={isLoading ? "checking…" : isError ? "unreachable" : "reachable"}
          />
          <StatusRow
            label="Database"
            ok={connected}
            note={
              isLoading ? "checking…" : connected ? "connected" : "not connected"
            }
          />
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  note,
}: {
  label: string;
  ok: boolean;
  note: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="flex items-center gap-2 text-sm text-slate-500">
        {note}
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            ok ? "bg-green-500" : "bg-slate-300"
          }`}
        />
      </span>
    </div>
  );
}
