import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BidCount, Countdown } from "@/components/countdown";
import { Button } from "@/components/ui/button";
import { listMine, relistListing } from "@/lib/auction/server";
import type { MineListing } from "@/lib/auction/types";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatHkd } from "@/lib/utils";

export const Route = createFileRoute("/mine")({ component: MinePage });

const STATUS: Record<MineListing["status"], string> = {
  active: "拍賣中",
  sold: "已成交",
  unsold: "流標",
  removed: "已下架",
};

function MinePage() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<MineListing[] | null>(null);

  async function load() {
    const data = await listMine();
    setRows(data);
  }

  useEffect(() => {
    if (!user) return;
    void load().catch((err) => {
      toast.error(err instanceof Error ? err.message : "無法載入");
    });
  }, [user]);

  if (isPending) {
    return <main className="mx-auto max-w-3xl flex-1 px-4 py-16"><div className="h-40 animate-pulse rounded-xl bg-surface-2" /></main>;
  }
  if (!user) return <RedirectToSignIn />;

  async function onRelist(id: number) {
    try {
      await relistListing({ data: { id } });
      toast.success("已重新拍賣");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "無法重新拍賣");
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">我的拍賣</h1>
      <p className="mt-2 text-sm text-muted">只有賣家看得見瀏覽次數。流標物品可以重新拍賣。</p>
      <div className="mt-8 space-y-3">
        {rows === null ? <div className="h-32 animate-pulse rounded-xl bg-surface-2" /> : null}
        {rows && rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-muted">還沒有刊登過。</p>
            <Link to="/sell" className="mt-4 inline-flex h-11 items-center text-sm font-medium text-accent">
              刊登拍賣
            </Link>
          </div>
        ) : null}
        {rows?.map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex gap-4">
              {item.coverImage ? (
                <img src={item.coverImage} alt="" className="size-24 rounded-md object-cover" />
              ) : (
                <div className="size-24 rounded-md bg-surface-2" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/listing/$id"
                    params={{ id: String(item.id) }}
                    className="font-display text-lg font-semibold hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  <span className="rounded-sm bg-surface-2 px-2 py-0.5 text-xs">{STATUS[item.status]}</span>
                </div>
                <p className="mt-1 font-medium tabular-nums">{formatHkd(item.currentPrice)}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
                  <Eye className="size-4" />
                  <span className="tabular-nums">{item.viewCount}</span> 次瀏覽
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
              <Countdown endsAt={item.endsAt} size="sm" />
              <BidCount count={item.bidCount} size="sm" />
            </div>
            {item.status === "unsold" ? (
              <Button type="button" className="mt-4 w-full" onClick={() => void onRelist(item.id)}>
                重新拍賣
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </main>
  );
}
