"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { adminStatusLabel } from "@/lib/admin/list-format";

/** Shared chrome for admin content list tables. */
export const adminListTableClassName =
  "w-full min-w-[720px] border-collapse text-left text-sm";

export const adminListHeadRowClassName =
  "bg-card text-xs uppercase tracking-wide text-muted-foreground";

export const adminListThClassName = "px-4 py-3 font-medium";

export const adminListTdClassName = "px-4 py-2.5 align-middle";

export function AdminListStatus({ status }: { status: string }) {
  return (
    <span
      className={
        status === "published" ? "text-foreground" : "text-muted-foreground"
      }
    >
      {adminStatusLabel(status)}
    </span>
  );
}

export function AdminListEmptyRow({
  colSpan,
  children,
  className,
}: {
  colSpan: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={className}>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-muted-foreground"
      >
        {children}
      </td>
    </tr>
  );
}

export function AdminListActionsCell({ children }: { children: ReactNode }) {
  return (
    <td className={adminListTdClassName}>
      <div className="flex justify-end gap-0.5">{children}</div>
    </td>
  );
}

export function AdminListThumb({ src }: { src: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="m-0 h-12 w-12 rounded-md object-cover"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
      —
    </div>
  );
}

export function adminListTableClass(className?: string) {
  return cn(adminListTableClassName, className);
}
