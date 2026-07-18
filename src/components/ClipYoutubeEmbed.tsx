type Props = {
  videoId: string;
  title?: string;
  className?: string;
};

/**
 * Clips カード内の YouTube 埋め込み（OGP 画像の代わりに表示）。
 */
export function ClipYoutubeEmbed({ videoId, title, className }: Props) {
  return (
    <div
      className={
        className ??
        "relative aspect-video w-full overflow-hidden bg-black"
      }
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title?.trim() || "YouTube video"}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
