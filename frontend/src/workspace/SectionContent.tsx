import type { SectionMeta } from "./sections";

/**
 * Renders the center-panel content for the active section.
 *
 * Generation lands in Milestones 5–10; until then each section shows an empty
 * state. When a milestone wires up real data, branch on `section.id` here and
 * render the generated content instead of the placeholder.
 */
export default function SectionContent({ section }: { section: SectionMeta }) {
  return (
    <section
      id={`section-${section.id}`}
      aria-labelledby={`heading-${section.id}`}
      className="scroll-mt-4"
    >
      <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
        <h2
          id={`heading-${section.id}`}
          className="text-lg font-semibold text-slate-900"
        >
          {section.label}
        </h2>
        <span className="text-xs text-slate-400">Milestone {section.milestone}</span>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">Nothing generated yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {section.description}
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Enter a prompt and run generation to populate this section.
        </p>
      </div>
    </section>
  );
}
