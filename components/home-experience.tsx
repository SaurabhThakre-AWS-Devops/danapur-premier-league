import type { ReactNode } from "react";
import { Countdown } from "@/components/countdown";
import { PaymentPanel } from "@/components/payment-panel";
import { PlayerBoard } from "@/components/player-board";
import { RegistrationForm } from "@/components/registration-form";
import { DEADLINE_LABEL, FEE_RUPEES } from "@/lib/constants";

export function HomeExperience({ open }: { open: boolean }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <section className="max-w-3xl">
        <p className="font-display text-sm tracking-[0.28em] text-[#c4a15a]">DANAPUR · CRICKET · 2026</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-wide text-[#f6f1e4] sm:text-7xl">
          Danapur Premier League
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#f6f1e4]/85">
          Cricket player registration. Entry fee ₹{FEE_RUPEES}. Last date {DEADLINE_LABEL}, 11:59 PM. Everyone who
          registers shows up on the public list.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact label="Entry" value={`₹${FEE_RUPEES}`} />
          <Fact label="Last date" value={DEADLINE_LABEL} />
          <Fact label={open ? "Time left" : "Status"} value={open ? <Countdown /> : "Closed"} />
        </dl>
      </section>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7">
          {open ? (
            <RegistrationForm />
          ) : (
            <section className="scorecard rounded-3xl p-6">
              <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">REGISTRATION CLOSED</p>
              <h2 className="mt-2 font-display text-4xl tracking-wide">Registration closed</h2>
              <p className="mt-3 text-[#3e5146]">
                The last date was {DEADLINE_LABEL}. New forms cannot be submitted. Players who already registered are
                listed below.
              </p>
            </section>
          )}
        </div>
        <div className="order-1 lg:sticky lg:top-24 lg:order-2 lg:col-span-5">
          <PaymentPanel open={open} />
        </div>
      </div>

      <ul className="mt-6 grid gap-2 text-sm text-[#f6f1e4]/75 sm:grid-cols-3">
        <li className="rounded-2xl border border-white/10 px-4 py-3">One player per mobile number.</li>
        <li className="rounded-2xl border border-white/10 px-4 py-3">
          The full mobile number is only in the organiser email and admin.
        </li>
        <li className="rounded-2xl border border-white/10 px-4 py-3">
          A wrong transaction ID will not be marked as paid.
        </li>
      </ul>

      <div className="mt-10">
        <PlayerBoard limit={5} showFilters={false} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#c4a15a]/30 bg-white/5 px-4 py-3">
      <dt className="font-display text-[11px] tracking-[0.18em] text-[#c4a15a]">{label.toUpperCase()}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#f6f1e4] sm:text-base">{value}</dd>
    </div>
  );
}
