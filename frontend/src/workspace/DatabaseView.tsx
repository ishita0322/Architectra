import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

import type { DatabaseSchema, DbTable } from "../lib/design-api";

interface DatabaseViewProps {
  schema: DatabaseSchema | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
}

mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" });

/** Mermaid-safe identifier from a table name. */
function erId(name: string): string {
  const slug = name.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return slug || "table";
}

/** Build a Mermaid erDiagram from tables + relationships (deterministic). */
function buildErDiagram(schema: DatabaseSchema): string {
  const lines = ["erDiagram"];
  for (const t of schema.tables) {
    lines.push(`  ${erId(t.name)} {`);
    for (const c of t.columns.slice(0, 12)) {
      const type = (c.type || "text").replace(/[^A-Za-z0-9_]+/g, "_") || "text";
      const note = /primary key/i.test(c.constraints) ? "PK" : "";
      lines.push(`    ${type} ${c.name.replace(/[^A-Za-z0-9_]+/g, "_")} ${note}`.trimEnd());
    }
    lines.push("  }");
  }
  for (const r of schema.relationships) {
    const a = erId(r.from_table);
    const b = erId(r.to_table);
    if (a && b) lines.push(`  ${b} ||--o{ ${a} : "${r.kind || "relates"}"`);
  }
  return lines.join("\n");
}

export default function DatabaseView({
  schema,
  generating,
  error,
  onGenerate,
}: DatabaseViewProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const rid = useId().replace(/:/g, "_");

  useEffect(() => {
    let cancelled = false;
    if (!schema || schema.tables.length === 0) {
      setSvg(null);
      return;
    }
    mermaid
      .render(`er_${rid}`, buildErDiagram(schema))
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setRenderError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setRenderError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [schema, rid]);

  function downloadSql() {
    if (!schema?.sql) return;
    const url = URL.createObjectURL(
      new Blob([schema.sql], { type: "application/sql" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.sql";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (generating) {
    return (
      <p className="text-sm text-slate-500">
        Generating database schema… this can take a while on local CPU inference.
      </p>
    );
  }

  if (!schema) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">Nothing generated yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Relational schema with tables, relationships and indexes. Generate
          requirements and architecture first for the best result.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onGenerate}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Generate database schema
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
          onClick={downloadSql}
          disabled={!schema.sql}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Export SQL
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ER visualization */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          ER Diagram
        </h3>
        {renderError ? (
          <p className="mt-2 text-sm text-red-600">ER render error: {renderError}</p>
        ) : (
          <div
            className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-4"
            dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
          />
        )}
      </div>

      {/* Tables */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tables
        </h3>
        <div className="mt-2 space-y-3">
          {schema.tables.map((t) => (
            <TableCard key={t.name} table={t} />
          ))}
        </div>
      </div>

      {/* SQL */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          SQL Schema
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
          {schema.sql || "— no SQL —"}
        </pre>
      </div>
    </div>
  );
}

function TableCard({ table }: { table: DbTable }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="font-medium text-slate-900">{table.name}</p>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {table.columns.map((c) => (
            <tr key={c.name} className="border-t border-slate-100">
              <td className="py-1 pr-3 font-mono text-slate-700">{c.name}</td>
              <td className="py-1 pr-3 text-slate-500">{c.type}</td>
              <td className="py-1 text-xs text-slate-400">{c.constraints}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {table.indexes.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <span className="text-slate-400">indexes:</span>
          {table.indexes.map((idx) => (
            <span
              key={idx}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700"
            >
              {idx}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
