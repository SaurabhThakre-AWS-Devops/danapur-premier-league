"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AREAS,
  BATTING,
  BOWLING,
  BOWLING_HI,
  FEE_RUPEES,
  JERSEYS,
  ROLES,
} from "@/lib/constants";
import { maskTail } from "@/lib/format";
import { normalizeMobile, normalizeUtr, registerSchema } from "@/lib/schema";
import type { PublicPlayer } from "@/lib/types";
import type { ZodError } from "zod";
import { ChevronDown } from "lucide-react";

const inputClass = "h-12 border-[#17241c]/15 bg-[#fffdf8] text-[#17241c] placeholder:text-[#17241c]/35";

type Errors = Record<string, string>;

function collect(error: ZodError) {
  const map: Errors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !map[key]) map[key] = issue.message;
  }
  return map;
}

export function RegistrationForm() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [area, setArea] = useState("");
  const [role, setRole] = useState("");
  const [batting, setBatting] = useState("");
  const [bowling, setBowling] = useState("Nahi karta");
  const [jersey, setJersey] = useState("");
  const [utr, setUtr] = useState("");
  const [paid, setPaid] = useState(false);
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ player: PublicPlayer; emailSent: boolean } | null>(null);

  function onMobile(value: string) {
    const digits = value.replace(/\D/g, "");
    setMobile(digits.length > 10 ? normalizeMobile(digits).slice(0, 10) : digits.slice(0, 10));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = registerSchema.safeParse({
      name,
      mobile,
      age,
      area,
      role,
      batting,
      bowling,
      jersey,
      utr,
      paid: paid ? true : false,
      company,
    });
    if (!parsed.success) {
      const next = collect(parsed.error);
      setErrors(next);
      const first = parsed.error.issues[0]?.path[0];
      if (typeof first === "string") {
        document.getElementById(first)?.focus();
      }
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, company }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        field?: string;
        player?: PublicPlayer;
        emailSent?: boolean;
      };
      if (!response.ok || !data.ok || !data.player) {
        if (data.field) setErrors({ [data.field]: data.error || "Check karo." });
        setFormError(data.error || "Registration nahi ho payi.");
        return;
      }
      setDone({ player: data.player, emailSent: Boolean(data.emailSent) });
    } catch {
      setFormError("Network ruk gaya. Dobara try karo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="scorecard rounded-3xl p-5 sm:p-7">
        <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">REGISTRATION CONFIRMED</p>
        <h2 className="mt-2 font-hindi text-4xl text-[#17241c]">नाम लिख गया</h2>
        <p className="mt-3 font-display text-5xl tracking-wide text-[#1e4d34]">{done.player.id}</p>
        <p className="mt-2 text-2xl font-semibold">{done.player.name}</p>
        <p className="mt-1 text-[#3e5146]">
          {done.player.age} saal · {done.player.area} · {done.player.role} · Jersey {done.player.jersey}
        </p>
        <p className="mt-1 text-sm text-[#3e5146]">UTR {maskTail(utr)}</p>
        <p className="mt-4 text-sm leading-6">
          Aapka naam public list mein aa gaya hai, taaki sab dekh saken.{" "}
          {done.emailSent
            ? "Poori list organiser ke mail par bhi chali gayi."
            : "Naam save hai. Mail thodi der mein ja sakta hai."}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/players" className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1e4d34] px-4 font-semibold text-[#f6f1e4]">
            Saari list dekho
          </Link>
          <Button
            type="button"
            variant="outline"
            className="h-12 border-[#17241c]/20 bg-transparent text-[#17241c]"
            onClick={() => {
              setDone(null);
              setName("");
              setMobile("");
              setAge("");
              setArea("");
              setRole("");
              setBatting("");
              setJersey("");
              setUtr("");
              setPaid(false);
            }}
          >
            Ek aur player
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="scorecard rounded-3xl p-5 sm:p-7">
      <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">01 · PLAYER FORM</p>
      <h2 className="mt-1 font-hindi text-3xl text-[#17241c]">रजिस्ट्रेशन</h2>
      <p className="mt-2 text-sm text-[#3e5146]">
        Mobile aur umar zaroori hain. Ek mobile se ek hi player. Entry ₹{FEE_RUPEES}.
      </p>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4" noValidate>
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>
            Company
            <input value={company} onChange={(event) => setCompany(event.target.value)} tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <Field id="name" label="खिलाड़ी का नाम" hint="Player name" error={errors.name}>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={inputClass} aria-invalid={Boolean(errors.name)} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="mobile" label="मोबाइल नंबर" hint="10 digit, +91 ki zaroorat nahi" error={errors.mobile}>
            <Input
              id="mobile"
              inputMode="numeric"
              autoComplete="tel"
              value={mobile}
              onChange={(event) => onMobile(event.target.value)}
              placeholder="9876543210"
              className={inputClass}
              aria-invalid={Boolean(errors.mobile)}
              required
            />
          </Field>
          <Field id="age" label="उम्र" hint="Saal mein, 12 se 60" error={errors.age}>
            <Input
              id="age"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="22"
              className={inputClass}
              aria-invalid={Boolean(errors.age)}
              required
            />
          </Field>
        </div>
        <Field id="area" label="मोहल्ला / इलाका" hint="Danapur, Khagaul, Digha..." error={errors.area}>
          <Input id="area" list="dpl-areas" value={area} onChange={(event) => setArea(event.target.value)} className={inputClass} aria-invalid={Boolean(errors.area)} required />
          <datalist id="dpl-areas">
            {AREAS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="role" label="क्या खेलते हो" hint="Playing role" error={errors.role}>
            <Select id="role" value={role} onChange={setRole} invalid={Boolean(errors.role)}>
              <option value="">चुनो</option>
              {ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.hi} · {item.value}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="batting" label="बल्लेबाज़ी" hint="Batting hand" error={errors.batting}>
            <Select id="batting" value={batting} onChange={setBatting} invalid={Boolean(errors.batting)}>
              <option value="">चुनो</option>
              {BATTING.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.hi}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="bowling" label="गेंदबाज़ी" hint="Agar nahi daalte to wahi rehne do" error={errors.bowling}>
            <Select id="bowling" value={bowling} onChange={setBowling} invalid={Boolean(errors.bowling)}>
              {BOWLING.map((item) => (
                <option key={item} value={item}>
                  {BOWLING_HI[item]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="jersey" label="जर्सी साइज़" hint="T-shirt size" error={errors.jersey}>
            <Select id="jersey" value={jersey} onChange={setJersey} invalid={Boolean(errors.jersey)}>
              <option value="">चुनो</option>
              {JERSEYS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field id="utr" label="UPI transaction ID" hint="₹100 bhejne ke baad PhonePe history se UTR" error={errors.utr}>
          <Input
            id="utr"
            value={utr}
            onChange={(event) => setUtr(normalizeUtr(event.target.value))}
            placeholder="12 digit UTR"
            className={inputClass}
            aria-invalid={Boolean(errors.utr)}
            autoComplete="off"
            required
          />
        </Field>
        <div className="flex items-start gap-3 rounded-xl bg-[#fffdf8] px-3 py-3">
          <Checkbox
            checked={paid}
            onCheckedChange={(checked) => setPaid(checked)}
            aria-labelledby="paid-label"
            className="mt-1 size-5"
          />
          <button id="paid-label" type="button" className="text-left text-sm leading-6" onClick={() => setPaid((value) => !value)}>
            Maine PhonePe se ₹{FEE_RUPEES} bhej diya hai, aur upar wali transaction ID meri hai.
          </button>
        </div>
        {errors.paid ? <p className="text-sm text-[#9b2330]">{errors.paid}</p> : null}
        {formError ? (
          <p className="rounded-xl bg-[#9b2330]/10 px-3 py-3 text-sm text-[#9b2330]" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting} className="h-12 text-base">
          {submitting ? "Save ho raha hai…" : `रजिस्टर करो · ₹${FEE_RUPEES}`}
        </Button>
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="flex-col items-start gap-0.5 text-[#17241c]">
        <span className="text-[15px] font-semibold">
          {label} <span className="text-[#9b2330]">*</span>
        </span>
        <span className="text-xs font-normal text-[#5c6b62]">{hint}</span>
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-[#9b2330]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  invalid,
  children,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        className="h-12 w-full appearance-none rounded-lg border border-[#17241c]/15 bg-[#fffdf8] px-3 pr-10 text-[#17241c]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#17241c]/50" aria-hidden />
    </div>
  );
}
