import type {
  ApiContract,
  Architecture,
  Capacity,
  CapacityInputs,
  DatabaseSchema,
  Requirements,
} from "../lib/design-api";
import ApiContractView from "./ApiContractView";
import ArchitectureView from "./ArchitectureView";
import CapacityView from "./CapacityView";
import DatabaseView from "./DatabaseView";
import DiagramView from "./DiagramView";
import type { SectionMeta } from "./sections";

interface SectionContentProps {
  section: SectionMeta;
  requirements: Requirements | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  // Capacity (Milestone 6)
  capacity: Capacity | null;
  capacityComputing: boolean;
  capacityError: string | null;
  onComputeCapacity: (inputs: CapacityInputs) => void;
  // Architecture (Milestone 7)
  architecture: Architecture | null;
  architectureGenerating: boolean;
  architectureError: string | null;
  onGenerateArchitecture: () => void;
  // Diagram (Milestone 8)
  diagramText: string | null;
  diagramGenerating: boolean;
  diagramError: string | null;
  onGenerateDiagram: () => void;
  // Database (Milestone 9)
  database: DatabaseSchema | null;
  databaseGenerating: boolean;
  databaseError: string | null;
  onGenerateDatabase: () => void;
  // APIs (Milestone 10)
  apis: ApiContract | null;
  apisGenerating: boolean;
  apisError: string | null;
  onGenerateApis: () => void;
}

/**
 * Renders the center-panel content for the active section.
 *
 * Requirements (Milestone 5) and Capacity (Milestone 6) render generated data
 * with their controls. Sections from later milestones (7–10) still show an
 * empty state until their generators land.
 */
export default function SectionContent({
  section,
  requirements,
  generating,
  error,
  onGenerate,
  capacity,
  capacityComputing,
  capacityError,
  onComputeCapacity,
  architecture,
  architectureGenerating,
  architectureError,
  onGenerateArchitecture,
  diagramText,
  diagramGenerating,
  diagramError,
  onGenerateDiagram,
  database,
  databaseGenerating,
  databaseError,
  onGenerateDatabase,
  apis,
  apisGenerating,
  apisError,
  onGenerateApis,
}: SectionContentProps) {
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

      <div className="mt-4">
        {section.id === "requirements" ? (
          <RequirementsView
            requirements={requirements}
            generating={generating}
            error={error}
            onGenerate={onGenerate}
          />
        ) : section.id === "capacity" ? (
          <CapacityView
            capacity={capacity}
            computing={capacityComputing}
            error={capacityError}
            onCompute={onComputeCapacity}
          />
        ) : section.id === "architecture" ? (
          <ArchitectureView
            architecture={architecture}
            generating={architectureGenerating}
            error={architectureError}
            onGenerate={onGenerateArchitecture}
          />
        ) : section.id === "diagram" ? (
          <DiagramView
            diagramText={diagramText}
            generating={diagramGenerating}
            error={diagramError}
            onGenerate={onGenerateDiagram}
          />
        ) : section.id === "database" ? (
          <DatabaseView
            schema={database}
            generating={databaseGenerating}
            error={databaseError}
            onGenerate={onGenerateDatabase}
          />
        ) : section.id === "apis" ? (
          <ApiContractView
            contract={apis}
            generating={apisGenerating}
            error={apisError}
            onGenerate={onGenerateApis}
          />
        ) : (
          <Placeholder description={section.description} />
        )}
      </div>
    </section>
  );
}

function RequirementsView({
  requirements,
  generating,
  error,
  onGenerate,
}: {
  requirements: Requirements | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  if (generating) {
    return (
      <p className="text-sm text-slate-500">
        Generating requirements… this can take a while on local CPU inference.
      </p>
    );
  }

  if (!requirements) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">Nothing generated yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Functional &amp; non-functional requirements and assumptions.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onGenerate}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Generate requirements
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

      <RequirementsList title="Functional" items={requirements.functional} />
      <RequirementsList
        title="Non-functional"
        items={requirements.non_functional}
      />
      <RequirementsList title="Assumptions" items={requirements.assumptions} />
    </div>
  );
}

function RequirementsList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">None.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Placeholder({ description }: { description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-600">Nothing generated yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      <p className="mt-3 text-xs text-slate-400">
        Generation for this section lands in a later milestone.
      </p>
    </div>
  );
}
