import { PersistentImage } from "@/components/ui/persistent-media";

const IMAGE_SRC_PATTERN = /^(https?:\/\/|\/|data:image\/)/i;

export function Avatar({ src, name, size = 36 }: { src?: string | null; name: string; size?: number }) {
  const isImage = typeof src === "string" && IMAGE_SRC_PATTERN.test(src);
  if (isImage) return <PersistentImage className="media-cover" src={src} alt={name} optimized width={size} height={size} />;
  return <>{(src && src.trim()) || name.slice(0, 2).toUpperCase()}</>;
}
