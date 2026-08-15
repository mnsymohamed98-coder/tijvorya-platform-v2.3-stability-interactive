import Image from "next/image";
import Link from "next/link";

export function Logo({ locale = "ar", compact = false }: { locale?: "ar" | "en"; compact?: boolean }) {
  return <Link className={`brand ${compact ? "brand-compact" : ""}`} href={`/${locale}`} aria-label="Tijvorya">
    <Image src={compact ? "/assets/tijvorya-mark-official.png" : "/assets/tijvorya-logo-horizontal.png"} alt="Tijvorya" width={compact ? 42 : 180} height={compact ? 42 : 44} priority />
  </Link>;
}
