import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current) {
    return <div className="aspect-[4/3] rounded-lg bg-surface-2" />;
  }
  const hasMany = images.length > 1;
  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-2">
      <img
        src={current}
        alt={alt}
        className="aspect-[4/3] w-full object-cover"
      />
      {hasMany ? (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-md bg-surface/90 text-fg"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            aria-label="上一張"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-md bg-surface/90 text-fg"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label="下一張"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={cn(
                  "h-2 w-2 rounded-full",
                  i === index ? "bg-accent" : "bg-surface/80",
                )}
                onClick={() => setIndex(i)}
                aria-label={`第 ${i + 1} 張`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
