import Link from "next/link";
import { DEADLINE_LABEL, FEE_RUPEES, OWNER_EMAIL, PAYEE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[#f6f1e4]/75 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-base tracking-[0.16em] text-[#f6f1e4]">DANAPUR PREMIER LEAGUE 2026</p>
          <p className="mt-1">
            Entry ₹{FEE_RUPEES} · Last date {DEADLINE_LABEL}
          </p>
          <p className="mt-1">
            Organiser {PAYEE_NAME} ·{" "}
            <a className="underline decoration-[#c4a15a] underline-offset-4" href={`mailto:${OWNER_EMAIL}`}>
              {OWNER_EMAIL}
            </a>
          </p>
        </div>
        <Link href="/admin" className="text-[#c4a15a] underline-offset-4 hover:underline">
          Organiser login
        </Link>
      </div>
    </footer>
  );
}
