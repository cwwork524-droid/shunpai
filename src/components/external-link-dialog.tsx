import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExternalLinkButton({
  href,
  name,
  children,
}: {
  href: string;
  name: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        className="h-12 w-full text-base"
        onClick={() => setOpen(true)}
      >
        {children ?? `前往 ${name}`}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>外部連結提示</DialogTitle>
          <DialogDescription>
            你即將離開瞬拍，前往以下網站：
          </DialogDescription>
          <p className="mt-4 break-all rounded-md bg-surface-2 px-3 py-3 font-mono text-sm text-fg">
            {href}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.open(href, "_blank", "noopener,noreferrer");
                setOpen(false);
              }}
            >
              繼續前往 {name}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
