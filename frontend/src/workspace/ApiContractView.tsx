import type { ApiContract, ApiEndpoint } from "../lib/design-api";

interface ApiContractViewProps {
  contract: ApiContract | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800",
  POST: "bg-blue-100 text-blue-800",
  PUT: "bg-amber-100 text-amber-800",
  PATCH: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
};

export default function ApiContractView({
  contract,
  generating,
  error,
  onGenerate,
}: ApiContractViewProps) {
  function downloadOpenApi() {
    const doc = contract?.openapi ?? { endpoints: contract?.endpoints ?? [] };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "openapi.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (generating) {
    return (
      <p className="text-sm text-slate-500">
        Generating API contract… this can take a while on local CPU inference.
      </p>
    );
  }

  if (!contract) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">Nothing generated yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          REST endpoints with request/response and error models. Generate
          requirements, architecture and database first for the best result.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onGenerate}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Generate API contract
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Regenerate
        </button>
        <button
          type="button"
          onClick={downloadOpenApi}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export OpenAPI
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {contract.endpoints.map((ep, i) => (
          <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
        ))}
      </div>

      {contract.openapi && (
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-500">
            OpenAPI document
          </summary>
          <pre className="mt-2 overflow-x-auto text-xs text-slate-700">
            {JSON.stringify(contract.openapi, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const color =
    METHOD_COLORS[endpoint.method?.toUpperCase()] ?? "bg-slate-100 text-slate-700";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${color}`}
        >
          {endpoint.method?.toUpperCase()}
        </span>
        <span className="font-mono text-sm text-slate-900">{endpoint.path}</span>
      </div>
      {endpoint.summary && (
        <p className="mt-1 text-sm text-slate-500">{endpoint.summary}</p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ModelBlock title="Request" model={endpoint.request_model} />
        <ModelBlock title="Response" model={endpoint.response_model} />
      </div>

      {endpoint.error_responses.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Errors
          </p>
          <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
            {endpoint.error_responses.map((er, i) => (
              <li key={i}>
                <span className="font-mono text-red-600">{er.status}</span>{" "}
                {er.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ModelBlock({
  title,
  model,
}: {
  title: string;
  model: Record<string, unknown> | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {title}
      </p>
      {model && Object.keys(model).length > 0 ? (
        <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
          {JSON.stringify(model, null, 2)}
        </pre>
      ) : (
        <p className="mt-1 text-xs text-slate-400">—</p>
      )}
    </div>
  );
}
