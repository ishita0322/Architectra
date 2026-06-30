import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/api";
import {
  generateApis,
  generateArchitecture,
  generateCapacity,
  generateDatabase,
  generateDiagram,
  generateRequirements,
  getDesign,
  type CapacityInputs,
} from "../lib/design-api";
import { getProject, updateProject } from "../lib/projects-api";
import PromptEditor from "../workspace/PromptEditor";
import SectionContent from "../workspace/SectionContent";
import SectionNav from "../workspace/SectionNav";
import { SECTIONS, type SectionId } from "../workspace/sections";

export default function Workspace() {
  const { user, logout } = useAuth();
  const { projectId } = useParams();
  const id = Number(projectId);
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
    enabled: Number.isFinite(id),
  });

  // Stored design (sections generated so far). null until first generation.
  const { data: design } = useQuery({
    queryKey: ["design", id],
    queryFn: () => getDesign(id),
    enabled: Number.isFinite(id),
  });

  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState<SectionId>("requirements");

  // Mobile drawer toggles (panels are static columns on lg+).
  const [showPrompt, setShowPrompt] = useState(false);
  const [showNav, setShowNav] = useState(false);

  // Seed the editor from the loaded project's prompt.
  useEffect(() => {
    if (project) setPrompt(project.prompt);
  }, [project]);

  const requirementsMut = useMutation({
    mutationFn: () => generateRequirements(id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", id] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });

  const savePromptMut = useMutation({
    mutationFn: () => updateProject(id, { prompt }),
    onSuccess: (updated) => {
      // Refresh the cached project so `dirty` resets to false.
      queryClient.setQueryData(["project", id], updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const capacityMut = useMutation({
    mutationFn: (inputs: CapacityInputs) => generateCapacity(id, inputs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", id] });
    },
  });

  const architectureMut = useMutation({
    mutationFn: () => generateArchitecture(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", id] });
    },
  });

  const diagramMut = useMutation({
    mutationFn: () => generateDiagram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", id] });
    },
  });

  const databaseMut = useMutation({
    mutationFn: () => generateDatabase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", id] });
    },
  });

  const apisMut = useMutation({
    mutationFn: () => generateApis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", id] });
    },
  });

  const promptDirty = project != null && prompt !== project.prompt;

  const activeSection = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  function handleSelect(sectionId: SectionId) {
    setActive(sectionId);
    setShowNav(false);
  }

  function handleGenerate() {
    setShowPrompt(false);
    // Only requirements generation exists today (Milestone 5); later
    // milestones add a branch per section.
    if (active === "requirements" && requirementsMut.isIdle) {
      requirementsMut.mutate();
    }
  }

  const requirementsError =
    requirementsMut.error instanceof ApiError
      ? requirementsMut.error.message
      : requirementsMut.error
        ? "Generation failed."
        : null;

  const capacityError =
    capacityMut.error instanceof ApiError
      ? capacityMut.error.message
      : capacityMut.error
        ? "Capacity computation failed."
        : null;

  const architectureError =
    architectureMut.error instanceof ApiError
      ? architectureMut.error.message
      : architectureMut.error
        ? "Architecture generation failed."
        : null;

  const diagramError =
    diagramMut.error instanceof ApiError
      ? diagramMut.error.message
      : diagramMut.error
        ? "Diagram generation failed."
        : null;

  const databaseError =
    databaseMut.error instanceof ApiError
      ? databaseMut.error.message
      : databaseMut.error
        ? "Database generation failed."
        : null;

  const apisError =
    apisMut.error instanceof ApiError
      ? apisMut.error.message
      : apisMut.error
        ? "API generation failed."
        : null;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 lg:hidden"
            aria-label="Toggle prompt panel"
          >
            Prompt
          </button>
          <Link to="/" className="font-semibold text-slate-900">
            AI System Architect
          </Link>
          {project && (
            <span className="hidden text-sm text-slate-400 sm:inline">
              / {project.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNav((v) => !v)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 lg:hidden"
            aria-label="Toggle sections panel"
          >
            Sections
          </button>
          <Link
            to={`/workspace/${id}/report`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export report
          </Link>
          <span className="hidden text-sm text-slate-500 sm:inline">{user?.email}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Three-panel body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left: prompt editor */}
        <Panel
          side="left"
          open={showPrompt}
          onClose={() => setShowPrompt(false)}
          className="w-80 border-r"
        >
          <PromptEditor
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            generating={requirementsMut.isPending}
            onSave={() => savePromptMut.mutate()}
            saving={savePromptMut.isPending}
            dirty={promptDirty}
          />
        </Panel>

        {/* Center: generated content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">
            {isLoading && (
              <p className="text-sm text-slate-500">Loading project…</p>
            )}
            {isError && (
              <p className="text-sm text-red-600">
                Could not load this project.{" "}
                <Link to="/" className="underline">
                  Back to projects
                </Link>
              </p>
            )}
            {!isLoading && !isError && (
              <SectionContent
                section={activeSection}
                requirements={design?.requirements_json ?? null}
                generating={requirementsMut.isPending}
                error={requirementsError}
                onGenerate={handleGenerate}
                capacity={design?.capacity_json ?? null}
                capacityComputing={capacityMut.isPending}
                capacityError={capacityError}
                onComputeCapacity={(inputs) => capacityMut.mutate(inputs)}
                architecture={design?.architecture_json ?? null}
                architectureGenerating={architectureMut.isPending}
                architectureError={architectureError}
                onGenerateArchitecture={() => architectureMut.mutate()}
                diagramText={design?.diagram_text ?? null}
                diagramGenerating={diagramMut.isPending}
                diagramError={diagramError}
                onGenerateDiagram={() => diagramMut.mutate()}
                database={design?.database_json ?? null}
                databaseGenerating={databaseMut.isPending}
                databaseError={databaseError}
                onGenerateDatabase={() => databaseMut.mutate()}
                apis={design?.api_json ?? null}
                apisGenerating={apisMut.isPending}
                apisError={apisError}
                onGenerateApis={() => apisMut.mutate()}
              />
            )}
          </div>
        </main>

        {/* Right: section navigation */}
        <Panel
          side="right"
          open={showNav}
          onClose={() => setShowNav(false)}
          className="w-56 border-l"
        >
          <SectionNav active={active} onSelect={handleSelect} />
        </Panel>
      </div>
    </div>
  );
}

/**
 * A side panel that is a static column on large screens and an overlay drawer
 * on small screens.
 */
function Panel({
  side,
  open,
  onClose,
  className,
  children,
}: {
  side: "left" | "right";
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="absolute inset-0 z-20 bg-slate-900/20 lg:hidden"
        />
      )}
      <aside
        className={`${className ?? ""} absolute ${
          side === "left" ? "left-0" : "right-0"
        } top-0 z-30 h-full bg-white transition-transform lg:static lg:z-0 lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full"
        }`}
      >
        {children}
      </aside>
    </>
  );
}
