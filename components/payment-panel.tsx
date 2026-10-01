"use client";

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">STEP 1 · ENTRY FEE</p>
          <h2 className="mt-1 font-display text-3xl tracking-wide text-[#17241c]">Pay ₹{FEE_RUPEES}</h2>
        </div>
        <span className="rounded-full bg-[#1e4d34] px-3 py-1 font-display text-sm tracking-wide text-[#f6f1e4]">PHONEPE</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#3e5146]">
        Send only ₹{FEE_RUPEES} to {PAYEE_NAME}. Then put the transaction ID in the form.
      </p>

      {open ? (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl bg-black">
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/phonepe-qr.jpg`}
              alt="PhonePe QR for Ratan Kailas Gawai, Danapur Premier League entry fee ₹100"
              className="mx-auto max-h-[34rem] w-full object-contain"
            />
          </div>
          <a
            href={upiPayLink()}
            className={cn(buttonVariants({ size: "lg" }), "mt-4 h-12 w-full text-base")}
          >
            Pay ₹{FEE_RUPEES} on your phone
          </a>
          <p className="mt-2 text-center text-xs text-[#5c6b62]">On a phone this button opens PhonePe or another UPI app. On a computer, scan the QR.</p>
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
                <dt className="text-xs text-[#5c6b62]">Name</dt>
                <dd className="font-semibold">{PAYEE_NAME}</dd>
              </div>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-4 rounded-xl bg-[#fffdf8] px-3 py-4 text-sm">
          Registration is closed, so new payments are not being taken.
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
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
