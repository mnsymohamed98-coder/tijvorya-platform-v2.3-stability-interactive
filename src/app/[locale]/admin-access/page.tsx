import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Logo } from "@/components/ui/logo";
import type { Locale } from "@/types";

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <main className="admin-login-page"><div className="admin-login-brand"><Logo locale={locale} /></div><AdminLoginForm /></main>;
}
