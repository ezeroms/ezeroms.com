import Link from "next/link";
import { itemHasTag } from "@/lib/workspace/tags";
import type { WorkspaceDoc, WorkspaceTask } from "@/types/workspace";

type Props = {
  tag: string;
  docs: WorkspaceDoc[];
  tasks: WorkspaceTask[];
  current: "docs" | "tasks";
};

export function TagBoardCrossLink({ tag, docs, tasks, current }: Props) {
  const other = current === "docs" ? "tasks" : "docs";
  const items =
    other === "docs"
      ? docs.filter((doc) => itemHasTag(doc, tag))
      : tasks.filter((task) => itemHasTag(task, tag));
  if (items.length === 0) return null;

  const href =
    other === "docs"
      ? `/admin/workspace/docs/?tag=${encodeURIComponent(tag)}`
      : `/admin/workspace/tasks/?tag=${encodeURIComponent(tag)}`;
  const label = other === "docs" ? "Docs" : "Tasks";

  return (
    <p className="m-0 mt-1 text-xs text-muted-foreground">
      <Link
        href={href}
        className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        {label} {items.length} 件
      </Link>
    </p>
  );
}
