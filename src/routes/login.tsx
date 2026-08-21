import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({ email, password, name: name || email.split("@")[0] });
        if (error) throw new Error(error.message || "註冊失敗");
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message || "登入失敗");
      }
      toast.success("已登入");
      await navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登入失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">登入瞬拍</h1>
      <p className="mt-2 text-sm text-muted">登入後才可以刊登與叫價。不登入也可看拍賣列表。</p>
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
          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-faint">或以電郵</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-surface-2 p-1">
            <button
              type="button"
              className={`h-10 rounded-sm text-sm ${mode === "in" ? "bg-surface text-fg" : "text-muted"}`}
              onClick={() => setMode("in")}
            >
              登入
            </button>
            <button
              type="button"
              className={`h-10 rounded-sm text-sm ${mode === "up" ? "bg-surface text-fg" : "text-muted"}`}
              onClick={() => setMode("up")}
            >
              註冊
            </button>
          </div>
          <form onSubmit={(e) => void onEmail(e)} className="space-y-3">
            {mode === "up" ? (
              <div className="space-y-2">
                <Label htmlFor="name">名稱</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">電郵</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "請稍候…" : mode === "up" ? "註冊並登入" : "登入"}
            </Button>
          </form>
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
