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
