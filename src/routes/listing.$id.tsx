import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BidCount, Countdown } from "@/components/countdown";
import { ExternalLinkButton } from "@/components/external-link-dialog";
import { ImageGallery } from "@/components/image-gallery";
import { ShareBar } from "@/components/share-bar";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { Button } from "@/components/ui/button";
import { getListing, getListingContacts, placeBid, recordView } from "@/lib/auction/server";
import type { ListingContacts, ListingDetail } from "@/lib/auction/types";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn, formatHkd } from "@/lib/utils";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id)) return null;
    try {
      return await getListing({ data: { id } });
    } catch {
      return null;
    }
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.title ? `${loaderData.title} · 瞬拍` : "瞬拍";
    const desc = (loaderData?.description ?? "").trim() || "限時競投，即刻成交。";
    const meta: Array<{ title?: string; name?: string; content?: string }> = [
      { title },
      { name: "description", content: desc.slice(0, 160) },
    ];
    if (loaderData?.title) {
      meta.push({ name: "share-title", content: loaderData.title });
    }
    if (loaderData?.images?.[0]) {
      meta.push({ name: "share-image", content: `/api/cover/${params.id}` });
    }
    return { meta };
  },
  component: ListingPage,
});
