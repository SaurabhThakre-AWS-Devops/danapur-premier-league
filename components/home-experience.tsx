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
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-12">
      <section>
        <p className="font-display text-xs tracking-[0.22em] text-[#c4a15a] sm:text-sm sm:tracking-[0.28em]">DANAPUR · SEASON 2026</p>
        <h1 className="mt-2 max-w-4xl font-display text-4xl leading-[0.95] tracking-wide text-[#f6f1e4] sm:mt-3 sm:text-7xl">
          Danapur Premier League
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-6 text-[#f6f1e4]/85 sm:mt-4 sm:text-lg sm:leading-7">
          Player registration for the cricket league. Entry fee ₹{FEE_RUPEES}. Last date {DEADLINE_LABEL}, 11:59 PM.
        </p>
        <dl className="pitch-strip mt-4 grid grid-cols-3 overflow-hidden rounded-2xl sm:mt-6">
          <Fact label="Entry" value={`₹${FEE_RUPEES}`} />
          <Fact label="Last date" value={DEADLINE_LABEL} />
          <Fact label={open ? "Time left" : "Status"} value={open ? <Countdown /> : "Closed"} />
        </dl>
      </section>

      <ol className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
        {steps.map((step) => (
          <li key={step.n} className="rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-3 sm:flex sm:gap-3 sm:px-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#c4a15a] font-display text-base text-[#17241c] sm:size-8 sm:text-lg">
              {step.n}
            </span>
            <span className="mt-2 block sm:mt-0">
              <span className="block text-sm font-semibold leading-4 text-[#f6f1e4] sm:text-base">{step.title}</span>
              <span className="mt-0.5 hidden text-sm leading-5 text-[#f6f1e4]/70 sm:block">{step.text}</span>
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
    <div className="border-r border-[#c4a15a]/25 px-2 py-3 last:border-r-0 sm:px-4 sm:py-4">
      <dt className="font-display text-[10px] tracking-[0.12em] text-[#c4a15a] sm:text-[11px] sm:tracking-[0.18em]">{label.toUpperCase()}</dt>
      <dd className="mt-1 text-sm font-semibold leading-5 text-[#f6f1e4] sm:text-lg">{value}</dd>
    </div>
  );
}
