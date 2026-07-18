import { cn } from "@/lib/cn";

/** Shared sidebar nav item styles (public + admin). */
export function sidebarNavItemClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
    active
      ? "bg-accent font-medium text-foreground"
      : "text-foreground hover:bg-black/[0.025]",
  );
}
