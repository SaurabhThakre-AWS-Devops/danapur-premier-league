import Link from "next/link";
import { DEADLINE_LABEL, FEE_RUPEES, OWNER_EMAIL, PAYEE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-[#c4a15a]/25">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 text-sm text-[#f6f1e4]/75 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-display text-lg tracking-[0.14em] text-[#f6f1e4]">DANAPUR PREMIER LEAGUE</p>
          <p className="mt-2">Entry ₹{FEE_RUPEES} · Last date {DEADLINE_LABEL}, 11:59 PM</p>
          <p className="mt-1">
            Organiser {PAYEE_NAME} ·{" "}
            <a className="text-[#f6f1e4] underline decoration-[#c4a15a] underline-offset-4" href={`mailto:${OWNER_EMAIL}`}>
              {OWNER_EMAIL}
            </a>
          </p>
        </div>
        <Link href="/admin" className="inline-flex h-11 items-center text-[#c4a15a] underline-offset-4 hover:underline">
          Organiser login
        </Link>
      </div>
    </footer>
  );
}
