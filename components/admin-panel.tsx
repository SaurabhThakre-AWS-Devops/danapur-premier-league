"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BATTING, BOWLING, BOWLING_HI, FEE_RUPEES, JERSEYS, OWNER_EMAIL, ROLES } from "@/lib/constants";
import { formatMobile, formatWhen } from "@/lib/format";
import { normalizeMobile, normalizeUtr } from "@/lib/schema";
import type { EmailLogEntry, PaymentStatus, Player } from "@/lib/types";

const inputClass = "h-12 border-[#17241c]/15 bg-[#fffdf8] text-[#17241c]";

type Draft = {
  name: string;
  mobile: string;
  age: string;
  area: string;
  role: string;
  batting: string;
  bowling: string;
  jersey: string;
  utr: string;
  paymentStatus: PaymentStatus;
};

export function AdminPanel() {
  const [phase, setPhase] = useState<"loading" | "login" | "ready">("loading");
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [log, setLog] = useState<EmailLogEntry[]>([]);
  const [gmailReady, setGmailReady] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<Player | null>(null);
  const [appPassword, setAppPassword] = useState("");

  async function load() {
    const response = await fetch("/api/admin/players", { cache: "no-store" });
    if (response.status === 401) {
      setPhase("login");
      return;
    }
    const data = (await response.json()) as {
      players: Player[];
      emailLog: EmailLogEntry[];
      gmailReady: boolean;
    };
    setPlayers(data.players);
    setLog(data.emailLog);
    setGmailReady(data.gmailReady);
    setPhase("ready");
  }

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const data = (await response.json()) as { ok: boolean };
      if (!data.ok) {
        setPhase("login");
        return;
      }
      await load();
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((player) =>
      `${player.name} ${player.mobile} ${player.area} ${player.id} ${player.utr}`.toLowerCase().includes(q),
    );
  }, [players, query]);

  const verified = players.filter((player) => player.paymentStatus === "verified").length;
  const pending = players.length - verified;

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLoginError(data.error || "Login nahi hua.");
        return;
      }
      setPassword("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setPhase("login");
    setPlayers([]);
  }

  async function downloadExcel() {
    const response = await fetch("/api/admin/export");
    if (!response.ok) {
      setNotice("Excel nahi bani. Dobara login karke try karo.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "DPL-2026-registrations.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function resend() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/resend", { method: "POST" });
      const data = (await response.json()) as { detail?: string; error?: string };
      setNotice(data.detail || data.error || "Mail try ho gaya.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveMail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appPassword }),
      });
      const data = (await response.json()) as { detail?: string; error?: string };
      setNotice(data.detail || data.error || "Save ho gaya.");
      if (response.ok) setAppPassword("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function clearMail() {
    setBusy(true);
    await fetch("/api/admin/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: true }),
    });
    setNotice("Gmail app password hata diya. Ab list FormSubmit se jayegi.");
    await load();
    setBusy(false);
  }

  async function setPayment(player: Player, paymentStatus: PaymentStatus) {
    const response = await fetch(`/api/admin/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setNotice(data.error || "Payment update nahi hua.");
      return;
    }
    await load();
  }

  function openEdit(player: Player) {
    setEditing(player);
    setDraft({
      name: player.name,
      mobile: player.mobile,
      age: String(player.age),
      area: player.area,
      role: player.role,
      batting: player.batting,
      bowling: player.bowling,
      jersey: player.jersey,
      utr: player.utr,
      paymentStatus: player.paymentStatus,
    });
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing || !draft) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/players/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, age: draft.age, paid: true }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setNotice(data.error || "Edit save nahi hua.");
        return;
      }
      setEditing(null);
      setDraft(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!removing) return;
    setBusy(true);
    const response = await fetch(`/api/admin/players/${removing.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) setNotice(data.error || "Delete nahi hua.");
    setRemoving(null);
    await load();
    setBusy(false);
  }

  if (phase === "loading") {
    return <p className="px-4 py-16 text-center text-[#f6f1e4]/70">Admin khul raha hai…</p>;
  }

  if (phase === "login") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <form onSubmit={login} className="scorecard grid gap-4 rounded-3xl p-6">
          <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">ORGANISER</p>
          <h1 className="font-hindi text-4xl text-[#17241c]">पूरा एक्सेस</h1>
          <p className="text-sm leading-6 text-[#3e5146]">
            Sirf {OWNER_EMAIL} is list ka owner hai. Yahan mobile, UTR aur Excel sab dikhega.
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} required />
          </div>
          {loginError ? <p className="text-sm text-[#9b2330]">{loginError}</p> : null}
          <Button type="submit" className="h-12" disabled={busy}>
            {busy ? "Check ho raha hai…" : "Login"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.22em] text-[#c4a15a]">FULL ACCESS · {OWNER_EMAIL}</p>
          <h1 className="mt-2 font-hindi text-4xl text-[#f6f1e4] sm:text-5xl">सभी रजिस्ट्रेशन</h1>
        </div>
        <Button type="button" variant="outline" className="h-11 border-white/20 bg-transparent text-[#f6f1e4] hover:bg-white/10" onClick={() => void logout()}>
          Logout
        </Button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Registered" value={String(players.length)} />
        <Stat label="Fee confirm" value={String(verified)} />
        <Stat label="Pending" value={String(pending)} />
        <Stat label="Confirm hua" value={`₹${verified * FEE_RUPEES}`} />
      </dl>

      <section className="scorecard mt-6 rounded-3xl p-4 sm:p-5">
        <h2 className="font-hindi text-2xl">Excel mail</h2>
        <p className="mt-2 text-sm leading-6 text-[#3e5146]">
          Jaise hi koi register karega, poori list {OWNER_EMAIL} par jayegi. Gmail App Password lagao to Excel file attach hoke aayegi. Bina uske bhi list mail ke andar aati hai — pehli baar Gmail mein FormSubmit ka Activate link aa sakta hai, use confirm kar dena.
        </p>
        <p className="mt-2 text-sm font-semibold">{gmailReady ? "Gmail Excel attach ke liye jud chuka hai." : "Abhi Excel attachment ke liye Gmail password nahi laga."}</p>
        <form onSubmit={saveMail} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-1 text-sm">
            Gmail App Password
            <Input
              type="password"
              autoComplete="new-password"
              value={appPassword}
              onChange={(event) => setAppPassword(event.target.value)}
              placeholder="16 letters, spaces chalenge"
              className={inputClass}
            />
          </label>
          <Button type="submit" className="h-12" disabled={busy || appPassword.trim().length < 8}>
            Save aur test mail
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-10" onClick={() => void downloadExcel()}>
            Excel download
          </Button>
          <Button type="button" variant="outline" className="h-10" disabled={busy} onClick={() => void resend()}>
            Poori list abhi mail karo
          </Button>
          {gmailReady ? (
            <Button type="button" variant="ghost" className="h-10" disabled={busy} onClick={() => void clearMail()}>
              Gmail password hatao
            </Button>
          ) : null}
        </div>
        {notice ? <p className="mt-3 text-sm text-[#1e4d34]">{notice}</p> : null}
        {log.length > 0 ? (
          <ul className="mt-4 grid gap-2 text-sm">
            {log.map((entry) => (
              <li key={`${entry.at}-${entry.playerId}`} className="rounded-xl bg-[#fffdf8] px-3 py-2">
                <span className={entry.ok ? "text-[#1e4d34]" : "text-[#9b2330]"}>{entry.ok ? "Gayi" : "Nahi gayi"}</span>
                {" · "}
                {entry.playerName} · {formatWhen(entry.at)}
                <span className="block text-[#5c6b62]">{entry.detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="mt-6">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Naam, mobile, UTR ya DPL number"
          className="h-12 border-white/15 bg-white/5 text-[#f6f1e4] placeholder:text-[#f6f1e4]/40"
        />
      </div>

      <ul className="mt-4 grid gap-3">
        {filtered.map((player) => (
          <li key={player.id} className="scorecard rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-[#1e4d34]">{player.id}</p>
                <p className="text-xl font-semibold">{player.name}</p>
                <p className="text-sm text-[#3e5146]">
                  {formatMobile(player.mobile)} · {player.age} saal · {player.area}
                </p>
                <p className="text-sm text-[#3e5146]">
                  {player.role} · {player.batting} · {player.bowling} · Jersey {player.jersey}
                </p>
                <p className="mt-1 font-mono text-sm">UTR {player.utr}</p>
                <p className="text-xs text-[#5c6b62]">
                  {formatWhen(player.createdAt)} · {player.paymentStatus === "verified" ? "Payment confirm" : "Fee check baaki"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-10"
                  onClick={() => void setPayment(player, player.paymentStatus === "verified" ? "pending" : "verified")}
                >
                  {player.paymentStatus === "verified" ? "Pending karo" : "₹100 confirm"}
                </Button>
                <Button type="button" variant="outline" className="h-10" onClick={() => openEdit(player)}>
                  Edit
                </Button>
                <Button type="button" variant="destructive" className="h-10" onClick={() => setRemoving(player)}>
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? <p className="mt-6 text-[#f6f1e4]/70">Koi registration nahi mili.</p> : null}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Player edit {editing?.id}</DialogTitle>
            <DialogDescription>Galat naam ya UTR yahin theek karo.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <form id="edit-player" onSubmit={saveEdit} className="grid gap-3">
              <Label className="grid gap-1">
                Naam
                <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={inputClass} required />
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="grid gap-1">
                  Mobile
                  <Input value={draft.mobile} onChange={(event) => setDraft({ ...draft, mobile: normalizeMobile(event.target.value).slice(0, 10) })} className={inputClass} required />
                </Label>
                <Label className="grid gap-1">
                  Umar
                  <Input value={draft.age} onChange={(event) => setDraft({ ...draft, age: event.target.value.replace(/\D/g, "").slice(0, 2) })} className={inputClass} required />
                </Label>
              </div>
              <Label className="grid gap-1">
                Ilaka
                <Input value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} className={inputClass} required />
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="grid gap-1">
                  Role
                  <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} className="h-12 rounded-lg border px-3">
                    {ROLES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.hi}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label className="grid gap-1">
                  Batting
                  <select value={draft.batting} onChange={(event) => setDraft({ ...draft, batting: event.target.value })} className="h-12 rounded-lg border px-3">
                    {BATTING.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.hi}
                      </option>
                    ))}
                  </select>
                </Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="grid gap-1">
                  Bowling
                  <select value={draft.bowling} onChange={(event) => setDraft({ ...draft, bowling: event.target.value })} className="h-12 rounded-lg border px-3">
                    {BOWLING.map((item) => (
                      <option key={item} value={item}>
                        {BOWLING_HI[item]}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label className="grid gap-1">
                  Jersey
                  <select value={draft.jersey} onChange={(event) => setDraft({ ...draft, jersey: event.target.value })} className="h-12 rounded-lg border px-3">
                    {JERSEYS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Label>
              </div>
              <Label className="grid gap-1">
                UTR
                <Input value={draft.utr} onChange={(event) => setDraft({ ...draft, utr: normalizeUtr(event.target.value) })} className={inputClass} required />
              </Label>
            </form>
          ) : null}
          <DialogFooter>
            <Button type="submit" form="edit-player" className="h-11" disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {removing?.name}?</DialogTitle>
            <DialogDescription>
              {removing?.id} list aur agli Excel se hat jayega. Registration number dobara use nahi hoga.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="destructive" className="h-11" disabled={busy} onClick={() => void confirmDelete()}>
              Haan, hatao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#c4a15a]/30 bg-white/5 px-4 py-3">
      <dt className="font-display text-[11px] tracking-[0.16em] text-[#c4a15a]">{label.toUpperCase()}</dt>
      <dd className="mt-1 font-display text-3xl text-[#f6f1e4] tabular-nums">{value}</dd>
    </div>
  );
}
