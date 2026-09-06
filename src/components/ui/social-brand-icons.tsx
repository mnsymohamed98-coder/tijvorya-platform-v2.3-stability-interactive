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
  // Uses the same rounded-square badge as the Instagram/TikTok marks above
  // (rather than the older plain circle) so all three sit at the same size
  // and shape in a row instead of one looking mismatched next to the others.
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#1877F2" />
      <path d="M13.6 20v-6.6h2.2l.34-2.6h-2.54v-1.65c0-.75.21-1.27 1.28-1.27h1.38V5.5c-.24-.03-1.05-.1-2-.1-1.98 0-3.33 1.21-3.33 3.43v1.92H8.4v2.6h2.53V20Z" fill="#fff" />
    </svg>
  );
}

export function TikTokBrandIcon(props: BrandIconProps) {
  // A finely-detailed note path held up fine at large preview sizes but
  // turned into an illegible smudge at the ~15-18px this actually renders at
  // in the footer/follow-row - swapped for a bold, simple stroke note (the
  // same shape lucide's Music2 icon uses) that stays crisp at small sizes,
  // with the cyan/pink offset copies kept for the recognizable TikTok look.
  const stem = "M12.5 16.5V4l5.3 3";
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#000" />
      <g transform="translate(-0.55,-0.35)" fill="#25F4EE">
        <circle cx="9.5" cy="16.5" r="3" />
        <path d={stem} fill="none" stroke="#25F4EE" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(0.55,0.35)" fill="#FE2C55">
        <circle cx="9.5" cy="16.5" r="3" />
        <path d={stem} fill="none" stroke="#FE2C55" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="9.5" cy="16.5" r="3" fill="#fff" />
      <path d={stem} fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
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
