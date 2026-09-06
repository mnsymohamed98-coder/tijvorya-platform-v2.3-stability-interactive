import type { SVGProps } from "react";

type BrandIconProps = SVGProps<SVGSVGElement>;

const sharedProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function InstagramBrandIcon(props: BrandIconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.4" cy="6.7" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookBrandIcon(props: BrandIconProps) {
  return (
    <svg {...sharedProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M13.2 20v-7h2.35l.35-2.75h-2.7V8.5c0-.8.22-1.35 1.38-1.35H16V4.7c-.62-.08-1.25-.12-1.88-.12-2.35 0-3.95 1.44-3.95 4.08v1.59H8V13h2.17v7" />
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
