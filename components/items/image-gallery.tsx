"use client";

import { Expand } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageGalleryProps {
  alt: string;
  images: { id: string; url: string }[];
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No images
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            alt={`${alt} - image ${selectedIndex + 1}`}
            className="object-cover"
            fill
            loading="eager"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            src={images[selectedIndex].url}
          />
          <Button
            className="absolute right-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setLightboxOpen(true)}
            size="icon"
            variant="secondary"
          >
            <Expand className="size-4" />
            <span className="sr-only">Expand image</span>
          </Button>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <button
                className={`relative aspect-video h-20 shrink-0 overflow-hidden rounded-md transition-opacity ${
                  index === selectedIndex
                    ? "ring-2 ring-primary ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
                key={img.id}
                onClick={() => setSelectedIndex(index)}
                type="button"
              >
                <Image
                  alt={`${alt} - thumbnail ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={img.url}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog onOpenChange={setLightboxOpen} open={lightboxOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {alt} - image {selectedIndex + 1}
          </DialogTitle>
          <div className="relative max-h-[80vh] w-full">
            <Image
              alt={`${alt} - image ${selectedIndex + 1}`}
              className="rounded-lg object-contain"
              height={0}
              sizes="90vw"
              src={images[selectedIndex].url}
              style={{ height: "auto", width: "100%" }}
              unoptimized
              width={0}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
