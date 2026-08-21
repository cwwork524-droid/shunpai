import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">登入瞬拍</h1>
      <p className="mt-2 text-sm text-muted">登入後先可以刊登同叫價。</p>
      {authEnabled ? (
        <div className="mt-8 space-y-3">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
            >
              以 {p.label} 繼續
            </Button>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">登入功能未開啟。</p>
      )}
      <Link to="/" className="mt-8 text-center text-sm text-muted hover:text-fg">
        返回桌面
      </Link>
    </main>
  );
}
