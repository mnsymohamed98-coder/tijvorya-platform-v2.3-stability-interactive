import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MerchantOnboardingGate } from "@/components/dashboard/merchant-onboarding-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="merchant"><MerchantOnboardingGate>{children}</MerchantOnboardingGate></DashboardShell>;
}
