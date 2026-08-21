import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function fileFromDataUrl(src: string): File | null {
  const match = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(src);
  if (!match) return null;
  try {
    const binary = atob(match[2].replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const type = match[1];
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return new File([bytes], `cover.${ext}`, { type });
  } catch {
    return null;
  }
}

function absoluteUrl(src: string): string {
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  if (typeof window === "undefined") return src;
  return new URL(src, window.location.origin).href;
}

async function fileFromSrc(src: string): Promise<File | null> {
  const fromData = fileFromDataUrl(src);
  if (fromData) return fromData;
  try {
    const res = await fetch(absoluteUrl(src));
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return new File([blob], `cover.${ext}`, { type });
  } catch {
    return null;
  }
}

export function ShareBar({
  title,
  imageUrl,
  listingId,
}: {
  title: string;
  imageUrl?: string | null;
  listingId: number;
}) {
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const coverPath = `/api/cover/${listingId}`;

  useEffect(() => {
    let cancelled = false;
    const src = imageUrl?.startsWith("data:") ? imageUrl : coverPath;
    void fileFromSrc(src).then((next) => {
      if (!cancelled && next) setFile(next);
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, coverPath]);

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
    const ready = file ?? (imageUrl ? fileFromDataUrl(imageUrl) : null);
    const payload: ShareData = { title, text: `${title}\n${url}` };

    if (ready) {
      const withFile = { ...payload, files: [ready] };
      const allowed = !navigator.canShare || navigator.canShare({ files: [ready] });
      if (allowed && navigator.share) {
        try {
          await navigator.share(withFile);
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title, text: payload.text, url });
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
        <img src={imageUrl} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="flex-1" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          複製連結
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={() => void nativeShare()}>
          <Share2 className="size-4" />
          分享
        </Button>
      </div>
    </div>
  );
}
