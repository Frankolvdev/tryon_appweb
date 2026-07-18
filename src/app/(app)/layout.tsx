import type { ReactNode } from "react";
import { AppSession } from "@/components/app/app-session";
import { AppShell } from "@/components/app/app-shell";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <AppSession>
      <AppShell>{children}</AppShell>
    </AppSession>
  );
}
