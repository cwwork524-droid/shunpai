import { Link } from "@tanstack/react-router";
import { BidCount, Countdown } from "@/components/countdown";
import { PopularityBadge } from "@/components/popularity-badge";
import type { ListingCard as ListingCardType } from "@/lib/auction/types";
import { cn, formatHkd } from "@/lib/utils";

const STATUS_LABEL: Record<ListingCardType["status"], string> = {
  active: "拍賣中",
  sold: "已成交",
  unsold: "流標",
  removed: "已下架",
};

export function ListingCard({ listing }: { listing: ListingCardType }) {
  const live = listing.status === "active";
  return (
    <Link
      to="/listing/$id"
      params={{ id: String(listing.id) }}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5"
    >
      <div className="relative">
        {listing.coverImage ? (
          <img
            src={listing.coverImage}
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="aspect-[4/3] bg-surface-2" />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {listing.popularityRank ? <PopularityBadge rank={listing.popularityRank} /> : null}
          <span
            className={cn(
              "inline-flex w-fit rounded-sm px-2 py-1 text-xs font-medium",
              live ? "bg-accent text-accent-fg" : "bg-fg/80 text-bg",
            )}
          >
            {STATUS_LABEL[listing.status]}
          </span>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <h2 className="font-display text-lg font-semibold leading-snug text-fg group-hover:text-accent">
          {listing.title}
        </h2>
        <p className="font-display text-2xl font-semibold tabular-nums tracking-tight">
          {formatHkd(listing.currentPrice)}
        </p>
        <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
          <Countdown endsAt={listing.endsAt} size="md" />
          <BidCount count={listing.bidCount} size="md" />
        </div>
      </div>
    </Link>
  );
}
