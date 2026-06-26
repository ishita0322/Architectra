import type { Architecture, ArchComponent } from "../lib/design-api";

interface ArchitectureViewProps {
  architecture: Architecture | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
}

/**
 * Architecture section: services (with their dependency relationships),
 * databases, queues, and caches. Data comes from the backend generator.
 */
export default function ArchitectureView({
  architecture,
  generating,
  error,
  onGenerate,
}: ArchitectureViewProps) {
  if (generating) {
    return (
      <p className="text-sm text-slate-500">
        Generating architecture… this can take a while on local CPU inference.
      </p>
    );
  }

  if (!architecture) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">Nothing generated yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Recommended services, databases, queues and caches. Generate
          requirements and capacity first for the best result.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onGenerate}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Generate architecture
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Regenerate
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Services with relationships */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Services
        </h3>
        <div className="mt-2 space-y-2">
          {architecture.services.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="font-medium text-slate-900">{s.name}</p>
              {s.responsibility && (
                <p className="mt-0.5 text-sm text-slate-500">{s.responsibility}</p>
              )}
              {s.depends_on.length > 0 && (
                <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  <span className="text-slate-400">depends on:</span>
                  {s.depends_on.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700"
                    >
                      {d}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <ComponentGroup title="Databases" items={architecture.databases} />
      <ComponentGroup title="Queues" items={architecture.queues} />
      <ComponentGroup title="Caches" items={architecture.caches} />
    </div>
  );
}

function ComponentGroup({
  title,
  items,
}: {
  title: string;
  items: ArchComponent[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">None.</p>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="font-medium text-slate-900">{c.name}</p>
              {c.purpose && (
                <p className="mt-0.5 text-sm text-slate-500">{c.purpose}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
