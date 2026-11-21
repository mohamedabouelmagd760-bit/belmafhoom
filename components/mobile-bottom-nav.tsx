"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/courses", label: "الكورسات", icon: "book" },
  { href: "/teachers", label: "المدرسون", icon: "users" },
  { href: "/dashboard", label: "حسابي", icon: "user" },
];

function NavIcon({ name }: { name: string }) {
  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>;
  if (name === "book") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h7" /></svg>;
  if (name === "users") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13h2a5.5 5.5 0 0 1 5.5 5.5V20zM16 4.8a3.5 3.5 0 0 1 0 6.7M17 14h.5a4 4 0 0 1 4 4v2h-4" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2z"/></svg>;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-bottom-nav" aria-label="التنقل السريع">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
        return <Link key={item.href} href={item.href} className={active ? "mobile-bottom-nav-link is-active" : "mobile-bottom-nav-link"} aria-current={active ? "page" : undefined}>
          <NavIcon name={item.icon} /><span>{item.label}</span>
        </Link>;
      })}
    </nav>
  );
}
