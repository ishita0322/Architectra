import { api } from "./api";

export interface Requirements {
  functional: string[];
  non_functional: string[];
  assumptions: string[];
}

export interface Capacity {
  inputs: {
    dau: number;
    peak_traffic_factor: number;
    actions_per_user: number;
    avg_request_size_kb: number;
    bytes_per_action: number;
    retention_days: number;
  };
  total_daily_requests: number;
  average_rps: number;
  peak_rps: number;
  storage_growth_per_day_bytes: number;
  storage_growth_per_month_bytes: number;
  storage_growth_per_month_human: string;
  peak_bandwidth_bytes_per_sec: number;
  peak_bandwidth_human: string;
  database_size_bytes: number;
  database_size_human: string;
  cache_recommendation: string;
}

export interface CapacityInputs {
  dau: number;
  peak_traffic_factor: number;
  actions_per_user: number;
}

export interface ArchService {
  name: string;
  responsibility: string;
  depends_on: string[];
}

export interface ArchComponent {
  name: string;
  purpose: string;
}

export interface Architecture {
  services: ArchService[];
  databases: ArchComponent[];
  queues: ArchComponent[];
  caches: ArchComponent[];
}

/** Stored design for a project. Section fields are null until generated. */
export interface Design {
  id: number;
  project_id: number;
  requirements_json: Requirements | null;
  capacity_json: Capacity | null;
  architecture_json: Architecture | null;
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

/** Compute deterministic capacity estimates from traffic inputs (no AI). */
export function generateCapacity(
  projectId: number,
  inputs: CapacityInputs,
): Promise<Capacity> {
  return api.post<Capacity>(
    `/projects/${projectId}/generate/capacity`,
    inputs,
    true,
  );
}

/** Generate the component architecture from the project's requirements + capacity. */
export function generateArchitecture(projectId: number): Promise<Architecture> {
  return api.post<Architecture>(
    `/projects/${projectId}/generate/architecture`,
    {},
    true,
  );
}
