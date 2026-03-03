"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

interface FallbackImageProps {
  src: string;
  alt: string;
  fallback: ReactNode;
}

/**
 * Client wrapper around next/image that shows a fallback element
 * when the image fails to load. Use this in Server Components
 * that can't use useState directly.
 */
export function FallbackImage({ src, alt, fallback }: FallbackImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setFailed(true)}
    />
  );
}
