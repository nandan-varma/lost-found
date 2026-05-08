"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageGalleryProps {
  images: { id: string; url: string }[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No images
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <Image
          alt={`${alt} - image ${selectedIndex + 1}`}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          src={images[selectedIndex].url}
        />
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
  );
}
