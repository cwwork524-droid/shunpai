import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminOverview, adminRemoveListing, adminSetBlocked } from "@/lib/auction/server";
import type { AdminUser, ListingCard } from "@/lib/auction/types";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatHkd } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type AdminListing = ListingCard & { viewCount: number; sellerId: string };

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    const data = await adminOverview();
    setListings(data.listings);
    setUsers(data.users);
  }

  useEffect(() => {
    if (!user) return;
    void load().catch((err) => {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("管理員")) setForbidden(true);
      else toast.error(message || "無法載入");
    });
  }, [user]);

  if (isPending) {
    return <main className="mx-auto max-w-4xl flex-1 px-4 py-16"><div className="h-40 animate-pulse rounded-xl bg-surface-2" /></main>;
  }
  if (!user) return <RedirectToSignIn />;
  if (forbidden) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-4 py-16 text-center">
        <p className="font-display text-xl">沒有管理員權限</p>
        <Link to="/" className="mt-4 inline-flex text-sm text-accent">返回桌面</Link>
      </main>
    );
  }

  async function removeListing(id: number) {
    try {
      await adminRemoveListing({ data: { id } });
      toast.success("已下架");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "失敗");
    }
  }

  async function toggleBlock(userId: string, blocked: boolean) {
    try {
      await adminSetBlocked({ data: { userId, blocked } });
      toast.success(blocked ? "已封鎖" : "已解封");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "失敗");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">系統管理</h1>
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">拍賣品</h2>
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {listings.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Link to="/listing/$id" params={{ id: String(item.id) }} className="font-medium hover:text-accent">
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {item.status} · {formatHkd(item.currentPrice)} · {item.viewCount} 次瀏覽
                </p>
              </div>
              {item.status !== "removed" ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void removeListing(item.id)}>
                  下架
                </Button>
              ) : (
                <span className="text-xs text-faint">已下架</span>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">用戶</h2>
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {users.map((u) => (
            <div key={u.userId} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {u.displayName}
                  {u.isAdmin ? <span className="ml-2 text-xs text-muted">管理員</span> : null}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-faint">{u.userId}</p>
              </div>
              {u.isAdmin ? null : (
                <Button
                  type="button"
                  variant={u.isBlocked ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => void toggleBlock(u.userId, !u.isBlocked)}
                >
                  {u.isBlocked ? "解封" : "封鎖"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
