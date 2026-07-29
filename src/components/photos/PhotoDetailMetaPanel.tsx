import { contentCard } from "@/lib/site/card-styles";

type MetaRowProps = {
  label: string;
  value: string;
};

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className="m-0 text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="m-0 break-words text-base leading-snug text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

type Props = {
  dateLabel: string;
  place: string;
  camera: string;
};

/** 写真詳細の右側：Date / Place / Camera */
export function PhotoDetailMetaPanel({ dateLabel, place, camera }: Props) {
  return (
    <aside
      className={contentCard({
        className:
          "flex flex-col gap-5 px-5 py-5 min-[1080px]:px-6 min-[1080px]:py-6",
      })}
    >
      <MetaRow label="Date" value={dateLabel} />
      <MetaRow label="Place" value={place} />
      <MetaRow label="Camera" value={camera} />
    </aside>
  );
}
