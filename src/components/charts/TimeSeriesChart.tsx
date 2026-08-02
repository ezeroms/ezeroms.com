"use client";

export function TimeSeriesChart({
  data,
  xKey,
  series,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
}) {
  const primary = series[0];
  if (!primary || data.length === 0) {
    return (
      <p className="m-0 text-sm text-muted-foreground">データがありません</p>
    );
  }

  const values = data.map((d) => Number(d[primary.key] || 0));
  const max = Math.max(...values, 1);
  const w = 640;
  const h = 180;
  const padX = 8;
  const padY = 12;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const points = values.map((v, i) => {
    const x =
      values.length === 1
        ? padX + innerW / 2
        : padX + (i / (values.length - 1)) * innerW;
    const y = padY + innerH - (v / max) * innerH;
    return `${x},${y}`;
  });

  const area = [
    `${padX},${padY + innerH}`,
    ...points,
    `${padX + innerW},${padY + innerH}`,
  ].join(" ");

  const first = String(data[0]?.[xKey] ?? "");
  const last = String(data[data.length - 1]?.[xKey] ?? "");

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${primary.label} trend`}
      >
        <polyline
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="1"
          points={`${padX},${padY + innerH} ${padX + innerW},${padY + innerH}`}
        />
        <polygon
          points={area}
          fill="rgba(5,3,23,0.06)"
          stroke="none"
        />
        <polyline
          fill="none"
          stroke={primary.color ?? "#050317"}
          strokeWidth="2"
          points={points.join(" ")}
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{first}</span>
        <span>{primary.label}</span>
        <span>{last}</span>
      </div>
    </div>
  );
}
