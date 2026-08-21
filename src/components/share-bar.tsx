import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function absoluteUrl(src: string): string {
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  if (typeof window === "undefined") return src;
  return new URL(src, window.location.origin).href;
}

async function fileFromImage(src: string): Promise<File | null> {
  try {
    const res = await fetch(absoluteUrl(src));
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return new File([blob], `listing.${ext}`, { type });
  } catch {
    return null;
  }
}

export function ShareBar({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const pageUrl = typeof window === "undefined" ? "" : window.location.href;

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("已複製連結");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("無法複製");
    }
  }

  async function nativeShare() {
    const url = window.location.href;
    const file = imageUrl ? await fileFromImage(imageUrl) : null;
    const canFiles = Boolean(file && navigator.canShare?.({ files: [file] }));

    if (canFiles && file) {
      try {
        await navigator.share({ title, text: title, url, files: [file] });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        try {
          await navigator.share({ title, files: [file] });
          return;
        } catch (err2) {
          if (err2 instanceof DOMException && err2.name === "AbortError") return;
        }
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    await copy();
  }

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="aspect-[4/3] w-full rounded-md object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="flex-1" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          複製連結
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={() => void nativeShare()}>
          <Share2 className="size-4" />
          分享
        </Button>
      </div>
      <p className="sr-only">{pageUrl}</p>
    </div>
  );
}
