import { api } from "./api";

export interface Project {
  id: number;
  user_id: number;
  title: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  title: string;
  prompt?: string;
}

export function listProjects(): Promise<Project[]> {
  return api.get<Project[]>("/projects", true);
}

export function getProject(id: number): Promise<Project> {
  return api.get<Project>(`/projects/${id}`, true);
}

export function createProject(payload: ProjectCreate): Promise<Project> {
  return api.post<Project>("/projects", payload, true);
}

export interface ProjectUpdate {
  title?: string;
  prompt?: string;
}

export function updateProject(
  id: number,
  payload: ProjectUpdate,
): Promise<Project> {
  return api.patch<Project>(`/projects/${id}`, payload, true);
}

export function deleteProject(id: number): Promise<void> {
  return api.del<void>(`/projects/${id}`, true);
}
