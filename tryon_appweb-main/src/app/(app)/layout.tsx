import type { ReactNode } from "react";
import { AppSession } from "@/components/app/app-session";
import { AppShell } from "@/components/app/app-shell";
import { LegalAccountGate } from "@/components/legal/legal-account-gate";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <AppSession>
      <><LegalAccountGate/><AppShell>{children}</AppShell></>
    </AppSession>
  );
}
