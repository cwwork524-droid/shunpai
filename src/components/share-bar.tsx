import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;

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
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title, url: window.location.href });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await copy();
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="button" variant="outline" className="flex-1" onClick={copy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        複製連結
      </Button>
      <Button type="button" variant="secondary" className="flex-1" onClick={() => void nativeShare()}>
        <Share2 className="size-4" />
        分享
      </Button>
      <p className="sr-only">{url}</p>
    </div>
  );
}
