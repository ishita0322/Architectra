import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

interface DbHealth {
  status: string;
  database: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health-db"],
    queryFn: () => api.get<DbHealth>("/health/db"),
  });

  const connected = data?.database === "connected";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-semibold text-slate-900">AI System Architect</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {user?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          You are authenticated. Milestone 1 complete.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-medium text-slate-700">Environment</h2>
          <div className="mt-4 space-y-3">
            <StatusRow label="Frontend" ok={true} note="running" />
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
      </main>
    </div>
  );
}

function StatusRow({ label, ok, note }: { label: string; ok: boolean; note: string }) {
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
