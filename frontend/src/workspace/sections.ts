export type SectionId =
  | "requirements"
  | "capacity"
  | "architecture"
  | "database"
  | "apis"
  | "diagram";

export interface SectionMeta {
  id: SectionId;
  label: string;
  /** Short description shown in the empty state. */
  description: string;
  /** Milestone that fills this section with real generated content. */
  milestone: number;
}

/** Ordered list driving both the right-panel navigation and the content area. */
export const SECTIONS: SectionMeta[] = [
  {
    id: "requirements",
    label: "Requirements",
    description: "Functional & non-functional requirements and assumptions.",
    milestone: 5,
  },
  {
    id: "capacity",
    label: "Capacity",
    description: "Traffic, storage, bandwidth and database sizing estimates.",
    milestone: 6,
  },
  {
    id: "architecture",
    label: "Architecture",
    description: "Recommended services, databases, queues and caches.",
    milestone: 7,
  },
  {
    id: "database",
    label: "Database",
    description: "Relational schema with tables, relationships and indexes.",
    milestone: 9,
  },
  {
    id: "apis",
    label: "APIs",
    description: "REST endpoints with request/response and error models.",
    milestone: 10,
  },
  {
    id: "diagram",
    label: "Diagram",
    description: "Mermaid architecture diagram rendered from components.",
    milestone: 8,
  },
];
