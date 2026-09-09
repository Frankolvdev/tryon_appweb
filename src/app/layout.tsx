import type { Metadata } from "next";
import "./globals.css";
import { AppToaster } from "@/components/ui/app-toaster";
import { BrandingBootstrap } from "@/components/ui/platform-logo";

export const metadata: Metadata = {
  title: "LUXIA AI Fashion Studio",
  description: "Aplicación web de AI Virtual Try-On",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <BrandingBootstrap />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
