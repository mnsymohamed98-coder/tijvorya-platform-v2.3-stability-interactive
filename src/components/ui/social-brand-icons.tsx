import { useId, type SVGProps } from "react";

type BrandIconProps = SVGProps<SVGSVGElement>;

export function InstagramBrandIcon(props: BrandIconProps) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FED576" />
          <stop offset="26%" stopColor="#F47133" />
          <stop offset="61%" stopColor="#BC3081" />
          <stop offset="100%" stopColor="#4C63D2" />
        </radialGradient>
      </defs>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill={`url(#${gradientId})`} />
      <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="3.6" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16.1" cy="7.9" r="1" fill="#fff" />
    </svg>
  );
}

export function FacebookBrandIcon(props: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
      <circle cx="12" cy="12" r="10.5" fill="#1877F2" />
      <path d="M13.6 21v-7.6h2.55l.38-2.96h-2.93v-1.9c0-.86.24-1.44 1.47-1.44h1.57V4.46A21 21 0 0 0 14.9 4.3c-2.32 0-3.9 1.42-3.9 4.02v2.12H8.4v2.96h2.6V21Z" fill="#fff" />
    </svg>
  );
}

export function TikTokBrandIcon(props: BrandIconProps) {
  const note = "M14.6 5h2.02c.12 1.06.58 1.98 1.35 2.63.69.58 1.56.93 2.53.98v2.06a5.9 5.9 0 0 1-3.34-1.06v4.9c0 2.49-2.03 4.5-4.54 4.5A4.52 4.52 0 0 1 8.1 14.5c0-2.42 1.9-4.4 4.28-4.5v2.1a2.42 2.42 0 0 0-1.94 2.4 2.42 2.42 0 0 0 2.44 2.4 2.42 2.42 0 0 0 2.43-2.4V5Z";
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#000" />
      <path d={note} fill="#25F4EE" transform="translate(-0.35,-0.2)" />
      <path d={note} fill="#FE2C55" transform="translate(0.35,0.2)" />
      <path d={note} fill="#fff" />
    </svg>
  );
}

export function WhatsAppBrandIcon(props: BrandIconProps) {
  // The well-known WhatsApp glyph (phone handset inside a chat bubble) is a
  // single filled path, not a stroke drawing like the outline icons above -
  // a hand-built stroke version of this specific shape distorted badly at
  // small sizes, so this uses the same solid-path shape most icon sets use.
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" stroke="none" aria-hidden focusable={false} {...props}>
      <path d="M16.004 4C9.377 4 4 9.373 4 16c0 2.24.615 4.34 1.687 6.137L4 28l6.02-1.653A11.94 11.94 0 0 0 16.004 28C22.63 28 28 22.627 28 16S22.63 4 16.004 4Zm0 21.818a9.78 9.78 0 0 1-5.03-1.386l-.361-.214-3.573 1.03.98-3.607-.235-.372a9.8 9.8 0 0 1-1.502-5.27c0-5.415 4.31-9.727 9.72-9.727 5.412 0 9.723 4.312 9.723 9.728 0 5.416-4.31 9.818-9.722 9.818Zm5.34-7.29c-.293-.146-1.734-.856-2.003-.954-.269-.098-.464-.146-.66.147-.196.293-.758.953-.93 1.148-.171.196-.342.22-.635.073-.293-.146-1.238-.456-2.358-1.454-.872-.777-1.46-1.737-1.632-2.03-.171-.293-.018-.451.129-.597.132-.132.293-.342.44-.513.147-.171.196-.293.294-.489.098-.195.05-.366-.024-.512-.073-.147-.66-1.588-.904-2.176-.238-.572-.481-.494-.66-.503l-.562-.01a1.08 1.08 0 0 0-.783.366c-.269.293-1.026 1.001-1.026 2.442s1.05 2.834 1.196 3.03c.147.195 2.067 3.157 5.008 4.427.7.302 1.246.483 1.672.618.702.223 1.342.191 1.847.116.564-.084 1.734-.709 1.978-1.393.245-.684.245-1.27.171-1.393-.073-.122-.269-.195-.562-.342Z" />
    </svg>
  );
}
