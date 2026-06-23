import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/api";
import {
  createProject,
  deleteProject,
  listProjects,
  type Project,
} from "../lib/projects-api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["projects"] });

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: deleteProject,
    onSuccess: invalidate,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-semibold text-slate-900">AI System Architect</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              Each project is a single system design exercise.
            </p>
          </div>
        </div>

        <NewProjectForm
          onCreate={(title, prompt) => createMut.mutate({ title, prompt })}
          pending={createMut.isPending}
          error={
            createMut.error instanceof ApiError ? createMut.error.message : null
          }
        />

        <div className="mt-8">
          {isLoading && <p className="text-sm text-slate-500">Loading projects…</p>}
          {isError && (
            <p className="text-sm text-red-600">Could not load projects.</p>
          )}
          {projects && projects.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-600">No projects yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first design project above.
              </p>
            </div>
          )}
          {projects && projects.length > 0 && (
            <ul className="space-y-3">
              {projects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onDelete={() => deleteMut.mutate(p.id)}
                  deleting={deleteMut.isPending && deleteMut.variables === p.id}
                />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function NewProjectForm({
  onCreate,
  pending,
  error,
}: {
  onCreate: (title: string, prompt: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), prompt.trim());
    setTitle("");
    setPrompt("");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <h2 className="text-sm font-medium text-slate-700">New project</h2>
      <div className="mt-3 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title (e.g. Netflix design)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Prompt (optional) — e.g. Design Netflix for 10 million users."
          rows={2}
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending || title.trim().length === 0}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create project"}
        </button>
      </div>
    </form>
  );
}

function ProjectRow({
  project,
  onDelete,
  deleting,
}: {
  project: Project;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
      <Link
        to={`/workspace/${project.id}`}
        className="min-w-0 flex-1 rounded-lg -mx-2 px-2 py-1 hover:bg-slate-50"
      >
        <p className="truncate font-medium text-slate-900">{project.title}</p>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {project.prompt || "No prompt yet"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Updated {new Date(project.updated_at).toLocaleString()}
        </p>
      </Link>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="ml-4 shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </li>
  );
}
