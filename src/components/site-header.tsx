import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile } from "@/lib/auction/server";
import type { ProfileMe } from "@/lib/auction/types";

export function SiteHeader() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<ProfileMe | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void getMyProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link
          to="/"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-fg px-3 text-sm font-medium text-bg"
        >
          <LayoutGrid className="size-4" />
          桌面
        </Link>
        <Link to="/" className="ml-1 truncate font-display text-xl font-semibold tracking-tight">
          瞬拍
        </Link>
        <div className="ml-auto flex min-w-0 max-w-[58%] items-center justify-end overflow-hidden">
          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-surface-2" />
          ) : (
            <>
              <SignedOut>
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
                >
                  登入
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          )}
        </div>
      </div>
      <SignedIn>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-3">
          <Link
            to="/sell"
            className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-fg hover:bg-surface-2"
          >
            刊登
          </Link>
          <Link
            to="/mine"
            className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-fg hover:bg-surface-2"
          >
            我的拍賣
          </Link>
          {profile?.isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-fg hover:bg-surface-2"
            >
              管理
            </Link>
          ) : null}
        </nav>
      </SignedIn>
      {profile?.isBlocked ? (
        <p className="bg-accent px-4 py-2 text-center text-sm text-accent-fg">
          你的帳戶已被封鎖，暫時不能買賣。
        </p>
      ) : null}
    </header>
  );
}
