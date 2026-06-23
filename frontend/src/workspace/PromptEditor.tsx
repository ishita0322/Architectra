interface PromptEditorProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  generating?: boolean;
}

const EXAMPLES = [
  "Design Netflix for 10 million users.",
  "Design a food delivery platform for 1 million daily active users.",
  "Design Uber for 1 million users.",
];

export default function PromptEditor({
  prompt,
  onPromptChange,
  onGenerate,
  generating = false,
}: PromptEditorProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Prompt</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Describe the system you want to design.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Design Netflix for 10 million users."
          className="min-h-40 flex-1 resize-none rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Examples
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onPromptChange(ex)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-slate-400 hover:text-slate-900"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || prompt.trim().length === 0}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate design"}
        </button>
      </div>
    </div>
  );
}
