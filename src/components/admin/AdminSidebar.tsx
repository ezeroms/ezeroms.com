"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  BookOpen,
  Bookmark,
  Briefcase,
  ChevronUp,
  Pizza,
  FileText,
  Image as ImageIcon,
  Landmark,
  LayoutDashboard,
  Music2,
  Newspaper,
  NotebookPen,
  Palette,
  Smile,
  User,
  type LucideIcon,
} from "lucide-react";
import { adminNavSections, type AdminNavItem } from "@/lib/admin/nav";
import { cn } from "@/lib/cn";
import { sidebarNavItemClass } from "@/lib/site/nav-styles";

const icons: Record<AdminNavItem["icon"], LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "notebook-pen": NotebookPen,
  bookmark: Bookmark,
  "file-text": FileText,
  briefcase: Briefcase,
  palette: Palette,
  "music-2": Music2,
  smile: Smile,
  aperture: Aperture,
  pizza: Pizza,
  image: ImageIcon,
  "book-open": BookOpen,
  landmark: Landmark,
  user: User,
  newspaper: Newspaper,
};

function isActive(pathname: string, href: string) {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (href === "/admin/") return path === "/admin/";
  return path === href || path.startsWith(href);
}

function AdminUserMenu({ email }: { email: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/admin/auth/logout/", { method: "POST" });
      router.replace("/admin/login/");
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  const label = email ?? "未ログイン";

  return (
    <div ref={rootRef} className="relative">
      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-md border border-border bg-card shadow-md">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
            onClick={logout}
            disabled={loading}
          >
            {loading ? "ログアウト中…" : "ログアウト"}
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {(email?.[0] ?? "?").toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {label}
        </span>
        <ChevronUp
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}

export function AdminSidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-[rgba(0,0,0,0.08)] bg-card">
      <div className="border-b border-border px-4 pb-4 pt-6">
        <Link
          href="/admin/"
          className="block opacity-100 transition-opacity hover:opacity-60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/common/logo.svg"
            alt="ezeroms.com"
            className="block h-auto w-[132px] max-w-full"
          />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {adminNavSections.map((section) => (
          <div key={section.id} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {section.items.map((item) => {
                const Icon = icons[item.icon];
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={sidebarNavItemClass(active)}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.status === "soon" ? (
                        <span
                          className={cn(
                            "rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide",
                            active
                              ? "bg-muted-foreground/15 text-muted-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          Soon
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-2 py-2">
        <AdminUserMenu email={userEmail} />
      </div>
    </aside>
  );
}
