import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { listListings } from "@/lib/auction/server";
import type { ListingCard as ListingCardType } from "@/lib/auction/types";

export const Route = createFileRoute("/")({
  loader: () => listListings(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const [listings, setListings] = useState<ListingCardType[]>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setListings(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listListings();
        if (!cancelled) {
          setListings(rows);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "無法載入拍賣");
      }
    }
    const id = window.setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-wide text-muted">今日拍場</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">最新拍賣</h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          不登入也可瀏覽。登入後即可刊登與叫價。拍賣時限 2 小時或 8 小時。
        </p>
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">暫時沒有拍賣品</p>
          <p className="mt-2 text-sm text-muted">登入後可以刊登第一件物品。</p>
          <Link to="/sell" className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg">
            刊登拍賣
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
