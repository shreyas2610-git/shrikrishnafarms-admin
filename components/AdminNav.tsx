"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/payments", label: "Payments" },
  { href: "/inventory", label: "Inventory" },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const currentLabel = navLinks.find((l) => isActive(l.href))?.label ?? "Admin";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 bg-slate-900 min-h-screen flex-col border-r border-slate-800">
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Admin</p>
          <p className="text-white text-sm font-semibold mt-0.5">Shri Krishna Farms</p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive(href)
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

      </aside>

      {/* Mobile: top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 h-12 px-4 flex items-center border-b border-slate-800">
        <span className="text-white text-sm font-semibold">{currentLabel}</span>
      </header>

      {/* Mobile: bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 text-center py-3 text-[11px] font-medium transition-colors ${
              isActive(href) ? "text-white bg-slate-800" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
