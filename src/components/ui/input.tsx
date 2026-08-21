import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-fg outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-faint focus-visible:border-fg focus-visible:ring-2 focus-visible:ring-fg/15 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
