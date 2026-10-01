import { OWNER_EMAIL } from "@/lib/constants";
import type { PublicPlayer } from "@/lib/types";

const ROSTER_URL = "https://kvdb.io/Q93hgPQ1KBKYesh8cTHT79/roster";

export type RosterPlayer = PublicPlayer & {
  mobileHash: string;
  utrHash: string;
};

type Roster = {
  nextNumber: number;
  players: RosterPlayer[];
};

const empty = (): Roster => ({ nextNumber: 1, players: [] });

export async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buffer)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

export function toPublic(player: RosterPlayer): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    age: player.age,
    area: player.area,
    role: player.role,
    batting: player.batting,
    bowling: player.bowling,
    jersey: player.jersey,
    paymentStatus: player.paymentStatus,
    mobileTail: player.mobileTail,
    createdAt: player.createdAt,
  };
}

export async function loadRoster(): Promise<Roster> {
  const response = await fetch(ROSTER_URL, { cache: "no-store" });
  if (response.status === 404) return empty();
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = (await response.json()) as Partial<Roster>;
  return {
    nextNumber: typeof data.nextNumber === "number" ? data.nextNumber : 1,
    players: Array.isArray(data.players) ? data.players : [],
  };
}

export async function saveRoster(roster: Roster) {
  const body = JSON.stringify(roster);
  if (body.length > 15_000) {
    throw new Error("The public list is full for this free store. Email the organiser before adding more names.");
  }
  const response = await fetch(ROSTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function emailRegistration(player: {
  id: string;
  name: string;
  mobile: string;
  age: number;
  area: string;
  role: string;
  batting: string;
  bowling: string;
  jersey: string;
  utr: string;
}, roster: Roster) {
  const lines = roster.players.map((item) =>
    [item.id, item.name, item.age, item.area, item.role, item.batting, item.bowling, item.jersey, `••••${item.mobileTail}`].join("\t"),
  );
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(OWNER_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `DPL 2026 — ${player.name} registered (${roster.players.length})`,
      _template: "table",
      _captcha: "false",
      registration_no: player.id,
      name: player.name,
      mobile: player.mobile,
      age: String(player.age),
      area: player.area,
      role: player.role,
      batting: player.batting,
      bowling: player.bowling,
      jersey: player.jersey,
      utr: player.utr,
      fee: "Rs 100",
      public_list: ["No.\tName\tAge\tArea\tRole\tBatting\tBowling\tJersey\tMobile", ...lines].join("\n"),
    }),
  });
  const payload = (await response.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
  const ok = response.ok && (payload?.success === true || payload?.success === "true");
  return { ok, message: payload?.message || "" };
}
