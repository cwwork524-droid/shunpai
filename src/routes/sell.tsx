import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createListing } from "@/lib/auction/server";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn, compressImage } from "@/lib/utils";

export const Route = createFileRoute("/sell")({ component: SellPage });

function SellPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [startingPrice, setStartingPrice] = useState("100");
  const [durationHours, setDurationHours] = useState<2 | 8>(2);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteName, setWebsiteName] = useState("Carousell");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return <main className="mx-auto max-w-xl flex-1 px-4 py-16"><div className="h-40 animate-pulse rounded-xl bg-surface-2" /></main>;
  }
  if (!user) return <RedirectToSignIn />;

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 3 - images.length;
    const slice = Array.from(files).slice(0, remaining);
    try {
      const compressed = await Promise.all(slice.map((file) => compressImage(file)));
      setImages((prev) => [...prev, ...compressed].slice(0, 3));
    } catch {
      toast.error("圖片處理失敗");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await createListing({
        data: {
          title,
          description,
          images,
          startingPrice: Number.parseInt(startingPrice, 10),
          durationHours,
          websiteUrl,
          websiteName,
          youtubeUrl,
        },
      });
      toast.success("已刊登");
      await navigate({ to: "/listing/$id", params: { id: String(result.id) } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "刊登失敗";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">刊登拍賣</h1>
      <p className="mt-2 text-sm text-muted">最多 3 張圖片。時限可選 2 小時或 8 小時。</p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label>物品圖片（最多 3 張）</Label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={src.slice(0, 32) + i} className="relative">
                <img src={src} alt="" className="aspect-square w-full rounded-md object-cover" />
                <button
                  type="button"
                  className="absolute top-1 right-1 grid size-8 place-items-center rounded-sm bg-fg text-bg"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="移除圖片"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {images.length < 3 ? (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-md border border-dashed border-border bg-surface text-sm text-muted">
                加入
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => void onFiles(e.target.files)}
                />
              </label>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">名稱</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">描述（可留空，支援換行）</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
            placeholder="成色、交收方式…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">起拍價（港幣）</Label>
          <Input
            id="price"
            inputMode="numeric"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value.replace(/[^\d]/g, ""))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>拍賣時限</Label>
          <div className="grid grid-cols-2 gap-2">
            {([2, 8] as const).map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setDurationHours(hours)}
                className={cn(
                  "h-14 rounded-md border text-sm font-medium",
                  durationHours === hours
                    ? "border-fg bg-fg text-bg"
                    : "border-border bg-surface text-fg",
                )}
              >
                {hours} 小時
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weburl">網站連結（可留空）</Label>
          <Input
            id="weburl"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webname">網站名稱</Label>
          <Input
            id="webname"
            value={websiteName}
            onChange={(e) => setWebsiteName(e.target.value)}
            placeholder="Carousell"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yt">YouTube 連結（可留空）</Label>
          <Input
            id="yt"
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </div>
        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {busy ? "刊登中…" : "開始拍賣"}
        </Button>
      </form>
    </main>
  );
}
