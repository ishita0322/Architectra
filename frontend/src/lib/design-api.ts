import { api } from "./api";

export interface Requirements {
  functional: string[];
  non_functional: string[];
  assumptions: string[];
}

/** Stored design for a project. Section fields are null until generated. */
export interface Design {
  id: number;
  project_id: number;
  requirements_json: Requirements | null;
  capacity_json: unknown | null;
  architecture_json: unknown | null;
  database_json: unknown | null;
  api_json: unknown | null;
  diagram_text: string | null;
  created_at: string;
  updated_at: string;
}

/** Load the stored design, or null if none has been generated yet (404). */
export async function getDesign(projectId: number): Promise<Design | null> {
  try {
    return await api.get<Design>(`/projects/${projectId}/design`, true);
  } catch (err) {
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

/** Generate requirements from the given prompt (or the project's stored prompt if omitted). */
export function generateRequirements(
  projectId: number,
  prompt?: string,
): Promise<Requirements> {
  return api.post<Requirements>(
    `/projects/${projectId}/generate/requirements`,
    { prompt },
    true,
  );
}
