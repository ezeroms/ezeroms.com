import { cn } from "@/lib/cn";

/** Shared section header — floating card (matches secondary rail). */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 shadow-sm",
        "sm:flex-row sm:items-end sm:justify-between sm:gap-3",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="m-0 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="m-0 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
