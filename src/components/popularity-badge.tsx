import { cn } from "@/lib/utils";

export function PopularityBadge({ rank }: { rank: number }) {
  if (rank < 1 || rank > 5) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-1 font-display text-xs font-semibold tracking-wide",
        rank === 1 ? "bg-accent text-accent-fg" : "bg-fg text-bg",
      )}
    >
      人氣 No.{rank}
    </span>
  );
}
