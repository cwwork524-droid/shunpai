import { parseYouTubeId } from "@/lib/utils";

export function YouTubeEmbed({ url }: { url: string }) {
  const id = parseYouTubeId(url);
  if (!id) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-fg">
      <iframe
        title="YouTube"
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
