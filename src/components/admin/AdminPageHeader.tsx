export function AdminPageHeader({
  title,
  description,
  titleAction,
  actions,
}: {
  title: string;
  description?: string;
  /** Placed immediately to the right of the title (e.g. refresh icon). */
  titleAction?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="m-0 text-2xl font-bold tracking-tight">{title}</h1>
          {titleAction}
        </div>
        {description ? (
          <p className="m-0 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
