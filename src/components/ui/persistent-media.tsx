/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import { forwardRef, useEffect, useState } from "react";
import { isStoredMedia, resolveStoredMedia } from "@/lib/media-store";

export function usePersistentMediaUrl(value?: string) {
  const [url, setUrl] = useState(value ?? "");
  useEffect(() => {
    let objectUrl = "";
    let active = true;
    async function resolve() {
      if (!value || !isStoredMedia(value)) { setUrl(value ?? ""); return; }
      try {
        const blob = await resolveStoredMedia(value);
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch { setUrl(""); }
    }
    resolve();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [value]);
  return url;
}

export const PersistentVideo = forwardRef<HTMLVideoElement, React.VideoHTMLAttributes<HTMLVideoElement> & { src?: string }>(function PersistentVideo({ src, poster, ...props }, ref) {
  const resolved = usePersistentMediaUrl(src);
  const resolvedPoster = usePersistentMediaUrl(typeof poster === "string" ? poster : undefined);
  return <video ref={ref} {...props} src={resolved || undefined} poster={resolvedPoster || undefined} />;
});

type PersistentImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> & {
  src?: string;
  // Opt-in per call site (not a global behavior change): renders through
  // next/image instead of a plain <img>. Local blob-storage sources (demo
  // mode) always fall back to a plain <img>, since next/image can't
  // optimize a blob: URL.
  //
  // Two modes, pick based on the caller's existing CSS:
  // - width+height given: fixed-size mode (e.g. a logo in a padded box).
  // - neither given: `fill` mode - the containing element must already be
  //   positioned (relative/absolute) with a defined size, matching the
  //   existing .media-fill/.media-cover convention.
  optimized?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
};

export function PersistentImage({ src, alt = "", optimized = false, sizes, width, height, className, ...props }: PersistentImageProps) {
  const resolved = usePersistentMediaUrl(src);
  const canOptimize = optimized && Boolean(resolved) && (/^https?:\/\//.test(resolved) || resolved.startsWith("/"));
  if (canOptimize) {
    if (width && height) return <Image src={resolved} alt={alt} width={width} height={height} className={className} />;
    return <Image src={resolved} alt={alt} fill sizes={sizes ?? "100vw"} className={className} />;
  }
  return <img {...props} className={className} src={resolved || undefined} alt={alt} />;
}
