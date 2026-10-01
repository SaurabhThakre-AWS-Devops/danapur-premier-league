"use client";

import Image from "next/image";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { FEE_RUPEES, PAYEE_NAME, UPI_ID, upiPayLink } from "@/lib/constants";
import { cn } from "cn";

export function PaymentPanel({ open }: { open: boolean }) {
  const [copied, setCopied] = useState("");

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  }

  return (
    <aside className="scorecard rounded-3xl p-4 sm:p-5">
      <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">02 · ENTRY FEE</p>
      <h2 className="mt-1 font-hindi text-3xl text-[#17241c]">₹{FEE_RUPEES} PhonePe</h2>
      <p className="mt-2 text-sm leading-6 text-[#3e5146]">
        {PAYEE_NAME} ko sirf ₹{FEE_RUPEES} bhejo. Bhejne ke baad transaction ID form mein likhna zaroori hai.
      </p>

      {open ? (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl bg-black">
            <Image
              src="/phonepe-qr.jpg"
              alt="PhonePe QR for Ratan Kailas Gawai, Danapur Premier League entry fee ₹100"
              width={836}
              height={1600}
              priority
              className="mx-auto h-auto max-h-[440px] w-auto"
            />
          </div>
          <a
            href={upiPayLink()}
            className={cn(buttonVariants({ size: "lg" }), "mt-4 h-12 w-full text-base")}
          >
            Phone se ₹{FEE_RUPEES} bhejo
          </a>
          <p className="mt-2 text-center text-xs text-[#5c6b62]">Phone par yeh button PhonePe / UPI kholta hai. Computer par QR scan karo.</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <CopyRow label="UPI ID" value={UPI_ID} copied={copied === "upi"} onCopy={() => copy(UPI_ID, "upi")} />
            <CopyRow
              label="Amount"
              value={`₹${FEE_RUPEES}`}
              copied={copied === "amt"}
              onCopy={() => copy(String(FEE_RUPEES), "amt")}
            />
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#fffdf8] px-3 py-3">
              <div>
                <dt className="text-xs text-[#5c6b62]">Naam</dt>
                <dd className="font-semibold">{PAYEE_NAME}</dd>
              </div>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-4 rounded-xl bg-[#fffdf8] px-3 py-4 text-sm">
          Registration band hai, isliye naya payment nahi lena.
        </p>
      )}
    </aside>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#fffdf8] px-3 py-3">
      <div className="min-w-0">
        <p className="text-xs text-[#5c6b62]">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
      <button type="button" onClick={onCopy} className="shrink-0 text-sm font-semibold text-[#1e4d34] underline decoration-[#c4a15a] underline-offset-4">
        {copied ? "Copy ho gaya" : "Copy"}
      </button>
    </div>
  );
}
