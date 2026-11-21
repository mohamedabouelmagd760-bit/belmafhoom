import type { Metadata } from "next";
import "./globals.css";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "بالمفهوم | مش مجرد شرح.. فهم حقيقي",
  description: "منصة تعليمية تجمع الطلاب بالمدرسين والكورسات المنظمة.",
  applicationName: "بالمفهوم",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  themeColor: "#172B4D"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}<MobileBottomNav /></body></html>;
}
