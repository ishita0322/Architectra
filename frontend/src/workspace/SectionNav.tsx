import { SECTIONS, type SectionId } from "./sections";

interface SectionNavProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export default function SectionNav({ active, onSelect }: SectionNavProps) {
  return (
    <nav aria-label="Sections" className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Sections</h2>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {SECTIONS.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(s.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
