"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const links = [
  { href: "/", label: "रजिस्टर" },
  { href: "/players", label: "कौन आया" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[#c4a15a]/40 bg-[#07110c]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center bg-[#1e4d34] font-display text-lg tracking-wide text-[#f6f1e4]">
            DPL
          </span>
          <span className="min-w-0">
            <span className="block truncate font-hindi text-lg leading-none text-[#f6f1e4] sm:text-xl">
              दानापुर प्रीमियर लीग
            </span>
            <span className="mt-1 block font-display text-[11px] tracking-[0.22em] text-[#c4a15a]">
              CRICKET 2026
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold sm:px-4",
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
