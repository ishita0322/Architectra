import mermaid from "mermaid";
import { useEffect, useId, useRef, useState } from "react";

interface DiagramViewProps {
  diagramText: string | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
}

mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" });

/**
 * Renders the stored Mermaid diagram and offers SVG / PNG export.
 * The diagram source is generated deterministically on the backend.
 */
export default function DiagramView({
  diagramText,
  generating,
  error,
  onGenerate,
}: DiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderId = useId().replace(/:/g, "_");

  useEffect(() => {
    let cancelled = false;
    if (!diagramText) {
      setSvg(null);
      return;
    }
    mermaid
      .render(`mermaid_${renderId}`, diagramText)
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
  }, [diagramText, renderId]);

  function downloadSvg() {
    if (!svg) return;
    triggerDownload(
      new Blob([svg], { type: "image/svg+xml" }),
      "architecture-diagram.svg",
    );
  }

  function downloadPng() {
    if (!svg) return;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const scale = 2; // higher-res raster
      const canvas = document.createElement("canvas");
      canvas.width = (img.width || 800) * scale;
      canvas.height = (img.height || 600) * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) triggerDownload(blob, "architecture-diagram.png");
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  if (generating) {
    return <p className="text-sm text-slate-500">Building diagram…</p>;
  }

  if (!diagramText) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No diagram yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Generate the architecture first, then build the diagram from it.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onGenerate}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Generate diagram
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          onClick={downloadSvg}
          disabled={!svg}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Export SVG
        </button>
        <button
          type="button"
          onClick={downloadPng}
          disabled={!svg}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Export PNG
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {renderError && (
        <p className="text-sm text-red-600">Diagram render error: {renderError}</p>
      )}

      <div
        ref={containerRef}
        className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4"
        // mermaid output is sanitized (securityLevel: strict)
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />

      <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-500">
          Mermaid source
        </summary>
        <pre className="mt-2 overflow-x-auto text-xs text-slate-700">
          {diagramText}
        </pre>
      </details>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
