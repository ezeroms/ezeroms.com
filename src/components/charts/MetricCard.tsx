import { cn } from "@/lib/cn";

export function MetricCard({
  label,
  value,
  change,
  hint,
}: {
  label: string;
  value: string;
  change?: number | null;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="m-0 mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        {change != null ? (
          <span
            className={cn(
              change > 0
                ? "text-emerald-700"
                : change < 0
                  ? "text-red-600"
                  : "text-muted-foreground",
            )}
          >
            前期間比 {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        ) : null}
        {hint ? (
          <span className="text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}
