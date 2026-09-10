import { cn } from "@/lib/cn";

/** Shared admin block heading — same as dashboard 「今日の予定」. */
export const adminSectionTitleClass =
  "m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function AdminSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const hasHead = Boolean(title || description || actions);
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {hasHead ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? <h2 className={adminSectionTitleClass}>{title}</h2> : null}
            {description ? (
              <p className="m-0 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminTableScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("overflow-x-auto", className)}>{children}</div>;
}
