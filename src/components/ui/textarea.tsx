import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full rounded-md border border-border bg-surface px-3 py-3 text-base text-fg outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-faint focus-visible:border-fg focus-visible:ring-2 focus-visible:ring-fg/15 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
