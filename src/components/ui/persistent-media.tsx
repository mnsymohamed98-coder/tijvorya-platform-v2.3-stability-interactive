/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
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

// Cloudinary-hosted URLs only - demo-mode blob: URLs and local /assets/...
// paths pass through untouched. f_auto/q_auto let Cloudinary pick the best
// format (webp/avif) and compression for the requesting browser instead of
// serving the raw uploaded file at original size/quality forever.
function toCloudinaryImageUrl(url: string, widthPx?: number): string {
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (!match) return url;
  const transform = widthPx ? `f_auto,q_auto,w_${widthPx}` : "f_auto,q_auto";
  return `${match[1]}${transform}/${match[2]}`;
}

// sp_auto (streaming profile: auto) generates adaptive-bitrate HLS renditions
// from the original upload on the fly - no separate encode step needed.
// Returns null for anything that isn't a genuine Cloudinary video URL, so
// demo-mode blobs and any other source keep playing exactly as before.
function toCloudinaryHlsUrl(url: string): string | null {
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)\.[a-zA-Z0-9]+$/);
  if (!match) return null;
  return `${match[1]}sp_auto/${match[2]}.m3u8`;
}

export const PersistentVideo = forwardRef<HTMLVideoElement, React.VideoHTMLAttributes<HTMLVideoElement> & { src?: string }>(function PersistentVideo({ src, poster, ...props }, forwardedRef) {
  const resolved = usePersistentMediaUrl(src);
  const resolvedPoster = usePersistentMediaUrl(typeof poster === "string" ? poster : undefined);
  const internalRef = useRef<HTMLVideoElement | null>(null);

  const setRefs = useCallback((node: HTMLVideoElement | null) => {
    internalRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const hlsUrl = resolved ? toCloudinaryHlsUrl(resolved) : null;

  // Attaches HLS playback for Cloudinary sources only. Safari/iOS play HLS
  // natively; everywhere else needs hls.js (MediaSource-based), loaded
  // client-side only - this touches window/MediaSource and must never run
  // during SSR. Any fatal hls.js error falls back to the plain mp4 so a
  // Cloudinary edge case degrades to prior behavior instead of a dead player.
  useEffect(() => {
    const video = internalRef.current;
    if (!video || !hlsUrl) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      return () => { video.removeAttribute("src"); video.load(); };
    }

    let cancelled = false;
    let hlsInstance: import("hls.js").default | undefined;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled || !video) return;
      if (!Hls.isSupported()) { video.src = resolved; return; }
      hlsInstance = new Hls();
      hlsInstance.loadSource(hlsUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) { hlsInstance?.destroy(); video.src = resolved; }
      });
    }).catch(() => { if (!cancelled) video.src = resolved; });

    return () => { cancelled = true; hlsInstance?.destroy(); };
  }, [hlsUrl, resolved]);

  return <video ref={setRefs} {...props} src={hlsUrl ? undefined : (resolved || undefined)} poster={resolvedPoster || undefined} />;
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
  // Applied regardless of `optimized` - a plain <img> pointed at an
  // f_auto,q_auto Cloudinary URL is still a real win with no next/image
  // involved. Fixed-size mode requests 2x the display size for retina
  // screens; fill mode skips a forced width since the container's actual
  // rendered size isn't reliably knowable from a CSS `sizes` string here.
  const cloudinaryOptimized = resolved ? toCloudinaryImageUrl(resolved, width ? width * 2 : undefined) : resolved;
  const canOptimize = optimized && Boolean(cloudinaryOptimized) && (/^https?:\/\//.test(cloudinaryOptimized) || cloudinaryOptimized.startsWith("/"));
  if (canOptimize) {
    if (width && height) return <Image src={cloudinaryOptimized} alt={alt} width={width} height={height} className={className} />;
    return <Image src={cloudinaryOptimized} alt={alt} fill sizes={sizes ?? "100vw"} className={className} />;
  }
  return <img {...props} className={className} src={cloudinaryOptimized || undefined} alt={alt} />;
}
