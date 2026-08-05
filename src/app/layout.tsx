import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXIA AI Fashion Studio",
  description: "Aplicación web de AI Virtual Try-On",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
