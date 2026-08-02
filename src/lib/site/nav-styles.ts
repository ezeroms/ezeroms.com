import { cn } from "@/lib/cn";

/**
 * Shared sidebar nav item styles (public + admin).
 * preflight オフ環境では <button> に UA の枠・背景が残るので明示的にリセットする。
 */
export function sidebarNavItemClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-2.5 rounded-md border-0 px-2 py-1.5 text-left text-sm shadow-none outline-none transition-colors",
    active
      ? "bg-accent font-medium text-foreground"
      : "bg-transparent text-foreground hover:bg-muted/70",
  );
}
