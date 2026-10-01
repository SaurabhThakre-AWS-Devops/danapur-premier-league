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
import { BATTING, BOWLING, FEE_RUPEES, JERSEYS, OWNER_EMAIL, ROLES } from "@/lib/constants";
import { formatMobile, formatWhen } from "@/lib/format";
import { digest, loadRoster, saveRoster, type RosterPlayer } from "@/lib/roster-client";
import { normalizeMobile, normalizeUtr } from "@/lib/schema";
import type { EmailLogEntry, PaymentStatus, Player } from "@/lib/types";

const staticHost = process.env.NEXT_PUBLIC_STATIC_HOST === "true";
const ORGANISER_PASSWORD_HASH = "afc4c7938e797715249a4082b35ccfffb601c8e75445cb3463451121d361dc1a";
const ORGANISER_SESSION = "dpl_organiser";

function fromRoster(player: RosterPlayer): Player {
  return {
    id: player.id,
    name: player.name,
    mobile: player.mobile || player.mobileTail,
    age: player.age,
    area: player.area,
    role: player.role,
    batting: player.batting,
    bowling: player.bowling,
    jersey: player.jersey,
    utr: "In your email",
    paymentStatus: player.paymentStatus,
    createdAt: player.createdAt,
  };
}

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
    if (staticHost) {
      const roster = await loadRoster();
      setPlayers(roster.players.map(fromRoster));
      setLog([]);
      setGmailReady(false);
      setPhase("ready");
      return;
    }
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
    if (staticHost) {
      if (window.sessionStorage.getItem(ORGANISER_SESSION) === "1") {
        void load();
        return;
      }
      setPhase("login");
      return;
    }
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
      if (staticHost) {
        const hash = await digest(password);
        const emailOk = email.trim().toLowerCase() === OWNER_EMAIL;
        if (!emailOk || hash !== ORGANISER_PASSWORD_HASH) {
          setLoginError("Email or password is wrong.");
          return;
        }
        window.sessionStorage.setItem(ORGANISER_SESSION, "1");
        setPassword("");
        await load();
        return;
      }
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLoginError(data.error || "Login failed.");
        return;
      }
      setPassword("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (staticHost) window.sessionStorage.removeItem(ORGANISER_SESSION);
    else await fetch("/api/admin/logout", { method: "POST" });
    setPhase("login");
    setPlayers([]);
  }

  function downloadCsv() {
    const header = ["No", "Name", "Age", "Role", "Batting", "Bowling", "Jersey", "Mobile", "Payment", "Registered"];
    const rows = players.map((player) => [
      player.id,
      player.name,
      String(player.age),
      player.role,
      player.batting,
      player.bowling,
      player.jersey,
      player.mobile,
      player.paymentStatus,
      player.createdAt,
    ]);
    const cell = (value: string, mobile = false) => {
      const safe = value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      return mobile ? `<td style="mso-number-format:'\\@';">${safe}</td>` : `<td>${safe}</td>`;
    };
    const table = [
      `<table><tr>${header.map((item) => `<th>${item}</th>`).join("")}</tr>`,
      ...rows.map(
        (row) =>
          `<tr>${row.map((value, index) => cell(value, header[index] === "Mobile")).join("")}</tr>`,
      ),
      `</table>`,
    ].join("");
    const blob = new Blob([table], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "DPL-2026-registrations.xls";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadExcel() {
    const response = await fetch("/api/admin/export");
    if (!response.ok) {
      setNotice("Excel could not be built. Log in again and try.");
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
      setNotice(data.detail || data.error || "Email attempted.");
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
      setNotice(data.detail || data.error || "Saved.");
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
    setNotice("Gmail app password removed. The list will use the backup mail path.");
    await load();
    setBusy(false);
  }

  async function setPayment(player: Player, paymentStatus: PaymentStatus) {
    if (staticHost) {
      const roster = await loadRoster();
      await saveRoster({
        ...roster,
        players: roster.players.map((item) => (item.id === player.id ? { ...item, paymentStatus } : item)),
      });
      await load();
      return;
    }
    const response = await fetch(`/api/admin/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setNotice(data.error || "Payment was not updated.");
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
      if (staticHost) {
        const roster = await loadRoster();
        const age = Number(draft.age);
        if (!Number.isInteger(age) || age < 12 || age > 60) {
          setNotice("Age must be from 12 to 60.");
          return;
        }
        await saveRoster({
          ...roster,
          players: roster.players.map((item) =>
            item.id === editing.id
              ? {
                  ...item,
                  name: draft.name.trim(),
                  age,
                  area: draft.area.trim(),
                  role: draft.role as Player["role"],
                  batting: draft.batting as Player["batting"],
                  bowling: draft.bowling,
                  jersey: draft.jersey,
                }
              : item,
          ),
        });
        setEditing(null);
        setDraft(null);
        await load();
        return;
      }
      const response = await fetch(`/api/admin/players/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, age: draft.age, paid: true }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setNotice(data.error || "The edit was not saved.");
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
    if (staticHost) {
      const roster = await loadRoster();
      await saveRoster({ ...roster, players: roster.players.filter((item) => item.id !== removing.id) });
      setRemoving(null);
      await load();
      setBusy(false);
      return;
    }
    const response = await fetch(`/api/admin/players/${removing.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) setNotice(data.error || "Delete failed.");
    setRemoving(null);
    await load();
    setBusy(false);
  }

  if (phase === "loading") {
    return <p className="px-4 py-16 text-center text-[#f6f1e4]/70">Opening admin…</p>;
  }

  if (phase === "login") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <form onSubmit={login} className="scorecard grid gap-4 rounded-3xl p-6 sm:p-8">
          <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">ORGANISER</p>
          <h1 className="font-display text-4xl tracking-wide text-[#17241c]">Full access</h1>
          <p className="text-sm leading-6 text-[#3e5146]">
            Sign in as {OWNER_EMAIL}. Full mobile numbers and transaction IDs also arrive in that inbox.
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
            {busy ? "Checking…" : "Log in"}
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
          <h1 className="mt-2 font-display text-4xl tracking-wide text-[#f6f1e4] sm:text-5xl">All registrations</h1>
        </div>
        <Button type="button" variant="outline" className="h-11 border-white/20 bg-transparent text-[#f6f1e4] hover:bg-white/10" onClick={() => void logout()}>
          Logout
        </Button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Registered" value={String(players.length)} />
        <Stat label="Fee confirm" value={String(verified)} />
        <Stat label="Pending" value={String(pending)} />
        <Stat label="Confirmed" value={`₹${verified * FEE_RUPEES}`} />
      </dl>

      <section className="scorecard mt-6 rounded-3xl p-4 sm:p-5">
        <h2 className="font-display text-2xl tracking-wide">{staticHost ? "Player list" : "Excel email"}</h2>
        {staticHost ? (
          <p className="mt-2 text-sm leading-6 text-[#3e5146]">
            Download Excel for the full mobile number, so you can call the player any time. The transaction ID is in {OWNER_EMAIL}.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-[#3e5146]">
              Download the full list as Excel here. For automatic email, add a Gmail App Password below — Google Account, Security, 2-Step Verification, then App passwords. That is not the normal Gmail password. After it is saved, every new player sends the full Excel file to {OWNER_EMAIL}.
            </p>
            <p className="mt-2 text-sm font-semibold">{gmailReady ? "Gmail is connected for Excel attachments." : "No Gmail password is saved for Excel attachments yet."}</p>
            <form onSubmit={saveMail} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-1 text-sm">
                Gmail App Password
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={appPassword}
                  onChange={(event) => setAppPassword(event.target.value)}
                  placeholder="16 letters, spaces are fine"
                  className={inputClass}
                />
              </label>
              <Button type="submit" className="h-12" disabled={busy || appPassword.trim().length < 8}>
                Save and send test
              </Button>
            </form>
          </>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => void (staticHost ? downloadCsv() : downloadExcel())}>
            Download Excel
          </Button>
          {staticHost ? null : (
            <Button type="button" variant="outline" className="h-11 sm:h-10" disabled={busy} onClick={() => void resend()}>
              Email the full list now
            </Button>
          )}
          {!staticHost && gmailReady ? (
            <Button type="button" variant="ghost" className="h-11 sm:h-10" disabled={busy} onClick={() => void clearMail()}>
              Remove Gmail password
            </Button>
          ) : null}
        </div>
        {notice ? <p className="mt-3 text-sm text-[#1e4d34]">{notice}</p> : null}
        {log.length > 0 ? (
          <ul className="mt-4 grid gap-2 text-sm">
            {log.map((entry) => (
              <li key={`${entry.at}-${entry.playerId}`} className="rounded-xl bg-[#fffdf8] px-3 py-2">
                <span className={entry.ok ? "text-[#1e4d34]" : "text-[#9b2330]"}>{entry.ok ? "Sent" : "Not sent"}</span>
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
          placeholder="Name, mobile, UTR, or DPL number"
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
                  {formatMobile(player.mobile)} · {player.age} years
                </p>
                <p className="text-sm text-[#3e5146]">
                  {player.role} · {player.batting} · {player.bowling} · Jersey {player.jersey}
                </p>
                <p className="mt-1 font-mono text-sm">UTR {player.utr}</p>
                <p className="text-xs text-[#5c6b62]">
                  {formatWhen(player.createdAt)} · {player.paymentStatus === "verified" ? "Payment confirmed" : "Fee still to check"}
                </p>
              </div>
              <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                <Button
                  type="button"
                  className="h-11 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm"
                  onClick={() => void setPayment(player, player.paymentStatus === "verified" ? "pending" : "verified")}
                >
                  {player.paymentStatus === "verified" ? "Pending" : "Confirm ₹100"}
                </Button>
                <Button type="button" variant="outline" className="h-11 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm" onClick={() => openEdit(player)}>
                  Edit
                </Button>
                <Button type="button" variant="destructive" className="h-11 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm" onClick={() => setRemoving(player)}>
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? <p className="mt-6 text-[#f6f1e4]/70">No registrations found.</p> : null}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit player {editing?.id}</DialogTitle>
            <DialogDescription>Correct a wrong name or transaction ID here.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <form id="edit-player" onSubmit={saveEdit} className="grid gap-3">
              <Label className="grid gap-1">
                Name
                <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={inputClass} required />
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {staticHost ? null : (
                <Label className="grid gap-1">
                  Mobile
                  <Input value={draft.mobile} onChange={(event) => setDraft({ ...draft, mobile: normalizeMobile(event.target.value).slice(0, 10) })} className={inputClass} required />
                </Label>
                )}
                <Label className="grid gap-1">
                  Age
                  <Input value={draft.age} onChange={(event) => setDraft({ ...draft, age: event.target.value.replace(/\D/g, "").slice(0, 2) })} className={inputClass} required />
                </Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="grid gap-1">
                  Role
                  <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} className="h-12 rounded-lg border px-3">
                    {ROLES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.value}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label className="grid gap-1">
                  Batting
                  <select value={draft.batting} onChange={(event) => setDraft({ ...draft, batting: event.target.value })} className="h-12 rounded-lg border px-3">
                    {BATTING.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.value}
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
                        {item}
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
              {staticHost ? null : (
              <Label className="grid gap-1">
                UTR
                <Input value={draft.utr} onChange={(event) => setDraft({ ...draft, utr: normalizeUtr(event.target.value) })} className={inputClass} required />
              </Label>
              )}
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
              {removing?.id} will leave the list and the next Excel file. That registration number will not be reused.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="destructive" className="h-11" disabled={busy} onClick={() => void confirmDelete()}>
              Yes, remove
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
