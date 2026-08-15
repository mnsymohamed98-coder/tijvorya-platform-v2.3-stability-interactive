/* eslint-disable @next/next/no-img-element */
"use client";

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

export function PersistentImage({ src, alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src?: string }) {
  const resolved = usePersistentMediaUrl(src);
  return <img {...props} src={resolved || undefined} alt={alt} />;
}
