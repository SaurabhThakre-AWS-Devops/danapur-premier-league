import type { ReactNode } from "react";
import { Countdown } from "@/components/countdown";
import { PaymentPanel } from "@/components/payment-panel";
import { PlayerBoard } from "@/components/player-board";
import { RegistrationForm } from "@/components/registration-form";
import { DEADLINE_LABEL, FEE_RUPEES } from "@/lib/constants";

const steps = [
  { n: "1", title: "Pay ₹100", text: "Scan the PhonePe QR or tap Pay on your phone." },
  { n: "2", title: "Fill the form", text: "Name, mobile, age, and the transaction ID." },
  { n: "3", title: "Check the list", text: "Your name shows up so others can see you registered." },
];

export function HomeExperience({ open }: { open: boolean }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <section>
        <p className="font-display text-sm tracking-[0.28em] text-[#c4a15a]">DANAPUR · SEASON 2026</p>
        <h1 className="mt-3 max-w-4xl font-display text-5xl leading-[0.92] tracking-wide text-[#f6f1e4] sm:text-7xl">
          Danapur Premier League
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#f6f1e4]/85 sm:text-lg">
          Player registration for the cricket league. Entry fee ₹{FEE_RUPEES}. Last date {DEADLINE_LABEL}, 11:59 PM.
        </p>
        <dl className="pitch-strip mt-6 grid overflow-hidden rounded-2xl sm:grid-cols-3">
          <Fact label="Entry" value={`₹${FEE_RUPEES}`} />
          <Fact label="Last date" value={DEADLINE_LABEL} />
          <Fact label={open ? "Time left" : "Status"} value={open ? <Countdown /> : "Closed"} />
        </dl>
      </section>

      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.n} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#c4a15a] font-display text-lg text-[#17241c]">
              {step.n}
            </span>
            <span>
              <span className="block font-semibold text-[#f6f1e4]">{step.title}</span>
              <span className="mt-0.5 block text-sm leading-5 text-[#f6f1e4]/70">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid items-start gap-5 lg:grid-cols-12">
        <div className="order-1 lg:sticky lg:top-24 lg:order-2 lg:col-span-5">
          <PaymentPanel open={open} />
        </div>
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
      </div>

      <div className="mt-10">
        <PlayerBoard limit={5} showFilters={false} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-[#c4a15a]/25 px-4 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <dt className="font-display text-[11px] tracking-[0.18em] text-[#c4a15a]">{label.toUpperCase()}</dt>
      <dd className="mt-1 text-lg font-semibold text-[#f6f1e4]">{value}</dd>
    </div>
  );
}
