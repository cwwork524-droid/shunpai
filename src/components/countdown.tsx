import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function useRemaining(endsAt: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (now === null) {
    return { ms: null, hours: 0, minutes: 0, seconds: 0, ended: false, ready: false };
  }
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const total = Math.floor(ms / 1000);
  return {
    ms,
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    ended: ms <= 0,
    ready: true,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({
  endsAt,
  size = "md",
}: {
  endsAt: string;
  size?: "sm" | "md" | "lg";
}) {
  const { hours, minutes, seconds, ended, ready } = useRemaining(endsAt);
  if (!ready) {
    return (
      <div
        className={cn(
          "flex items-end gap-1 font-display font-semibold tabular-nums tracking-tight text-fg",
          size === "lg" && "gap-2 text-4xl leading-none sm:text-5xl",
          size === "md" && "text-2xl leading-none",
          size === "sm" && "text-lg leading-none",
        )}
      >
        <Unit value="--" label="時" size={size} />
        <span className="pb-0.5 text-faint">:</span>
        <Unit value="--" label="分" size={size} />
        <span className="pb-0.5 text-faint">:</span>
        <Unit value="--" label="秒" size={size} />
      </div>
    );
  }
  if (ended) {
    return (
      <p className={cn("font-display font-semibold tracking-tight text-muted", size === "lg" ? "text-2xl" : "text-base")}>
        已結束
      </p>
    );
  }
  const urgent = hours === 0 && minutes < 15;
  return (
    <div
      className={cn(
        "flex items-end gap-1 font-display font-semibold tabular-nums tracking-tight",
        urgent ? "text-accent" : "text-fg",
        size === "lg" && "gap-2 text-4xl leading-none sm:text-5xl",
        size === "md" && "text-2xl leading-none",
        size === "sm" && "text-lg leading-none",
      )}
    >
      <Unit value={pad(hours)} label="時" size={size} />
      <span className="pb-0.5 text-faint">:</span>
      <Unit value={pad(minutes)} label="分" size={size} />
      <span className="pb-0.5 text-faint">:</span>
      <Unit value={pad(seconds)} label="秒" size={size} />
    </div>
  );
}

function Unit({
  value,
  label,
  size,
}: {
  value: string;
  label: string;
  size: "sm" | "md" | "lg";
}) {
  return (
    <span className="flex flex-col items-center">
      <span>{value}</span>
      <span
        className={cn(
          "font-sans font-medium tracking-normal text-muted",
          size === "lg" ? "mt-1 text-xs" : "text-xs",
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function BidCount({ count, size = "md" }: { count: number; size?: "sm" | "md" | "lg" }) {
  return (
    <p
      className={cn(
        "font-display font-semibold tracking-tight text-accent",
        size === "lg" && "text-4xl leading-none sm:text-5xl",
        size === "md" && "text-2xl leading-none",
        size === "sm" && "text-lg leading-none",
      )}
    >
      <span className="tabular-nums">{count}</span>
      <span
        className={cn(
          "ml-1.5 font-sans font-medium text-accent",
          size === "lg" ? "text-base" : "text-xs",
        )}
      >
        人叫價
      </span>
    </p>
  );
}
