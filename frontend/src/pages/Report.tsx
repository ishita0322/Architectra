import { useQuery } from "@tanstack/react-query";
import mermaid from "mermaid";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  fetchReportMarkdown,
  getReport,
  type DesignReport,
} from "../lib/design-api";

mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" });

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Report() {
  const { projectId } = useParams();
  const id = Number(projectId);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ["report", id],
    queryFn: () => getReport(id),
    enabled: Number.isFinite(id),
  });

  async function downloadMarkdown() {
    const md = await fetchReportMarkdown(id);
    download(new Blob([md], { type: "text/markdown" }), `report-${id}.md`);
  }

  function downloadJson() {
    download(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
      `report-${id}.json`,
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar — hidden when printing */}
      <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <Link to={`/workspace/${id}`} className="text-sm text-slate-600 hover:underline">
          ← Back to workspace
        </Link>
        <div className="flex gap-2">
          <button
            onClick={downloadMarkdown}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download Markdown
          </button>
          <button
            onClick={downloadJson}
            disabled={!report}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Download JSON
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Print / Save as PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-10">
        {isLoading && <p className="text-sm text-slate-500">Loading report…</p>}
        {isError && <p className="text-sm text-red-600">Could not load report.</p>}
        {report && <ReportBody report={report} />}
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          main { max-width: none; padding: 0; }
        }
      `}</style>
    </div>
  );
}

function ReportBody({ report }: { report: DesignReport }) {
  return (
    <article className="rounded-xl bg-white p-10 shadow-sm print:shadow-none print:p-0">
      <h1 className="text-3xl font-bold text-slate-900">{report.project.title}</h1>
      {report.project.prompt && (
        <p className="mt-2 border-l-4 border-slate-200 pl-3 text-slate-500">
          {report.project.prompt}
        </p>
      )}

      <Section title="Requirements">
        {report.requirements ? (
          <>
            <H3>Functional</H3>
            <BulletList items={report.requirements.functional} />
            <H3>Non-functional</H3>
            <BulletList items={report.requirements.non_functional} />
            <H3>Assumptions</H3>
            <BulletList items={report.requirements.assumptions} />
          </>
        ) : (
          <NotGenerated />
        )}
      </Section>

      <Section title="Capacity">
        {report.capacity ? (
          <ul className="space-y-1 text-sm text-slate-700">
            <li>Peak RPS: {report.capacity.peak_rps.toLocaleString()}</li>
            <li>Average RPS: {report.capacity.average_rps.toLocaleString()}</li>
            <li>Bandwidth (peak): {report.capacity.peak_bandwidth_human}</li>
            <li>Storage / month: {report.capacity.storage_growth_per_month_human}</li>
            <li>Database size: {report.capacity.database_size_human}</li>
            <li className="text-slate-500">{report.capacity.cache_recommendation}</li>
          </ul>
        ) : (
          <NotGenerated />
        )}
      </Section>

      <Section title="Architecture">
        {report.architecture ? (
          <>
            <H3>Services</H3>
            <BulletList
              items={report.architecture.services.map(
                (s) =>
                  `${s.name}${s.responsibility ? ` — ${s.responsibility}` : ""}`,
              )}
            />
            {report.architecture.databases.length > 0 && (
              <>
                <H3>Databases</H3>
                <BulletList items={report.architecture.databases.map((c) => c.name)} />
              </>
            )}
          </>
        ) : (
          <NotGenerated />
        )}
      </Section>

      <Section title="Diagram">
        {report.diagram ? <MermaidBlock text={report.diagram} /> : <NotGenerated />}
      </Section>

      <Section title="Database Design">
        {report.database ? (
          report.database.tables.map((t) => (
            <div key={t.name} className="mb-4">
              <H3>{t.name}</H3>
              <ul className="text-sm text-slate-700">
                {t.columns.map((c) => (
                  <li key={c.name} className="font-mono">
                    {c.name} <span className="text-slate-400">{c.type}</span>{" "}
                    <span className="text-xs text-slate-400">{c.constraints}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <NotGenerated />
        )}
      </Section>

      <Section title="API Contracts">
        {report.apis ? (
          report.apis.endpoints.map((ep, i) => (
            <div key={i} className="mb-2 text-sm">
              <span className="font-mono font-semibold">{ep.method}</span>{" "}
              <span className="font-mono">{ep.path}</span>
              {ep.summary && <span className="text-slate-500"> — {ep.summary}</span>}
            </div>
          ))
        ) : (
          <NotGenerated />
        )}
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="border-b border-slate-200 pb-1 text-xl font-semibold text-slate-900">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">None.</p>;
  return (
    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function NotGenerated() {
  return <p className="text-sm text-slate-400">Not generated.</p>;
}

function MermaidBlock({ text }: { text: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    mermaid
      .render("report_diagram", text)
      .then(({ svg }) => !cancelled && setSvg(svg))
      .catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [text]);
  return svg ? (
    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <pre className="overflow-x-auto text-xs text-slate-600">{text}</pre>
  );
}
