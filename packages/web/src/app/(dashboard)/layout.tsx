import { AppShell } from "@/components/layout/app-shell";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <OnboardingWizard />
    </AppShell>
  );
}
