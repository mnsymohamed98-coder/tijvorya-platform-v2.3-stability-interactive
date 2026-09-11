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
  // The official TikTok note-mark path (sourced from simple-icons), kept in
  // the same rounded-square badge as the Instagram/Facebook marks above so
  // all three sit at the same size and shape in a row - the earlier
  // hand-approximated note shape read as an illegible smudge at small
  // sizes and didn't match the real logo. Cyan/magenta offset copies under
  // a white top layer reproduce TikTok's signature layered-glitch mark.
  const note = "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#000" />
      <g transform="translate(3.55,1.15) scale(0.62)">
        <path d={note} transform="translate(-0.6,-0.4)" fill="#25F4EE" />
        <path d={note} transform="translate(0.6,0.4)" fill="#FE2C55" />
        <path d={note} fill="#fff" />
      </g>
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
