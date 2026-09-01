/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

// Matches a real image reference (URL or data URI) as opposed to the 2-letter
// initials string auth.ts falls back to for accounts without a photo (e.g.
// email/password sign-ups, which never get a Google avatar_url).
const AVATAR_IMAGE_RE = /^(https?:\/\/|\/|data:image\/)/i;

export function Avatar({ value, fallback, className }: { value?: string; fallback: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const isImage = Boolean(value) && AVATAR_IMAGE_RE.test(value!);
  return <span className={className}>
    {isImage && !failed
      ? <img src={value} alt={fallback} onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      : (isImage ? fallback : (value || fallback))}
  </span>;
}
