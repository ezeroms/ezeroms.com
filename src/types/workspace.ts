export type ProjectStatus = "active" | "paused" | "completed" | "archived";

export type TaskStatus = "inbox" | "active" | "waiting" | "done" | "archived";

export type TaskPriority = "none" | "low" | "medium" | "high";

export type DocStatus = "inbox" | "active" | "archived";

export type ItemLinkType = "doc" | "task" | "project";

export type ItemLinkRelation =
  | "related"
  | "supports"
  | "created_from"
  | "follow_up"
  | "blocks";

export type WorkspaceProject = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type WorkspaceTask = {
  id: string;
  title: string;
  body_md: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string | null;
  scheduled_date: string | null;
  /** Local work-block start (ISO). Duration: estimated_minutes or 30. */
  scheduled_at: string | null;
  due_at: string | null;
  estimated_minutes: number | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  archived_at: string | null;
};

export type WorkspaceDoc = {
  id: string;
  title: string;
  body_md: string;
  status: DocStatus;
  project_id: string | null;
  occurred_at: string | null;
  review_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type WorkspaceItemLink = {
  id: string;
  from_type: ItemLinkType;
  from_id: string;
  to_type: ItemLinkType;
  to_id: string;
  relation: ItemLinkRelation;
  created_at: string;
};

export const PROJECT_STATUSES: ProjectStatus[] = [
  "active",
  "paused",
  "completed",
  "archived",
];

export const TASK_STATUSES: TaskStatus[] = [
  "inbox",
  "active",
  "waiting",
  "done",
  "archived",
];

export const TASK_PRIORITIES: TaskPriority[] = [
  "none",
  "low",
  "medium",
  "high",
];

export const DOC_STATUSES: DocStatus[] = ["inbox", "active", "archived"];

export const ITEM_LINK_TYPES: ItemLinkType[] = ["doc", "task", "project"];

export const ITEM_LINK_RELATIONS: ItemLinkRelation[] = [
  "related",
  "supports",
  "created_from",
  "follow_up",
  "blocks",
];

export function isProjectStatus(v: unknown): v is ProjectStatus {
  return typeof v === "string" && PROJECT_STATUSES.includes(v as ProjectStatus);
}

export function isTaskStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && TASK_STATUSES.includes(v as TaskStatus);
}

export function isTaskPriority(v: unknown): v is TaskPriority {
  return typeof v === "string" && TASK_PRIORITIES.includes(v as TaskPriority);
}

export function isDocStatus(v: unknown): v is DocStatus {
  return typeof v === "string" && DOC_STATUSES.includes(v as DocStatus);
}

export function isItemLinkType(v: unknown): v is ItemLinkType {
  return typeof v === "string" && ITEM_LINK_TYPES.includes(v as ItemLinkType);
}

export function isItemLinkRelation(v: unknown): v is ItemLinkRelation {
  return (
    typeof v === "string" &&
    ITEM_LINK_RELATIONS.includes(v as ItemLinkRelation)
  );
}
