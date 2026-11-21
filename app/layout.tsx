import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بالمفهوم | مش مجرد شرح.. فهم حقيقي",
  description: "منصة تعليمية تجمع الطلاب بالمدرسين والكورسات المنظمة.",
  applicationName: "بالمفهوم",
  manifest: "/manifest.webmanifest",
  themeColor: "#172B4D"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
