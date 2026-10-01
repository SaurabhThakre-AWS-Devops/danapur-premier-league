"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const links = [
  { href: "/", label: "Register" },
  { href: "/players", label: "Who's in" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[#c4a15a]/35 bg-[#06110c]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:h-[4.25rem] sm:px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#1e4d34] font-display text-base tracking-wide text-[#f6f1e4] ring-1 ring-[#c4a15a]/50 sm:size-11 sm:text-lg">
            DPL
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-none tracking-wide text-[#f6f1e4] sm:text-2xl">
              <span className="md:hidden">DPL 2026</span>
              <span className="hidden md:inline">Danapur Premier League</span>
            </span>
            <span className="mt-1 hidden font-display text-[11px] tracking-[0.22em] text-[#c4a15a] sm:block">CRICKET 2026</span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2.5 text-sm font-semibold sm:px-4",
                  active ? "bg-[#f6f1e4] text-[#17241c]" : "text-[#f6f1e4]/80 hover:bg-white/10",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
