import { OWNER_EMAIL } from "@/lib/constants";
import type { PublicPlayer } from "@/lib/types";

const ROSTER_PAGE = "https://rentry.co/dpl2026-roster";
const ROSTER_EDIT = "https://rentry.co/api/edit/dpl2026-roster";
const ROSTER_EDIT_CODE = "xttsQCbT";

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

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export async function loadRoster(): Promise<Roster> {
  const response = await fetch(`${ROSTER_PAGE}?t=${Date.now()}`, { cache: "no-store" });
  if (response.status === 404) return empty();
  if (!response.ok) throw new Error("The public list could not be loaded.");
  const html = await response.text();
  const pre = html.match(/<pre><span><\/span>([\s\S]*?)<\/pre>/);
  const text = pre ? decodeHtml(pre[1].replace(/<[^>]+>/g, "")).trim() : "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return empty();
  try {
    const data = JSON.parse(text.slice(start, end + 1)) as Partial<Roster>;
    return {
      nextNumber: typeof data.nextNumber === "number" ? data.nextNumber : 1,
      players: Array.isArray(data.players) ? data.players : [],
    };
  } catch {
    return empty();
  }
}

export async function saveRoster(roster: Roster) {
  const text = `\`\`\`\n${JSON.stringify(roster)}\n\`\`\`\n`;
  if (text.length > 40_000) {
    throw new Error("The public list is full. Email the organiser before adding more names.");
  }
  const response = await fetch(ROSTER_EDIT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ edit_code: ROSTER_EDIT_CODE, text }),
  });
  const payload = (await response.json().catch(() => null)) as { status?: string; content?: string } | null;
  if (!response.ok || payload?.status !== "200") {
    throw new Error(payload?.content || "The public list could not be saved.");
  }
}

export async function emailRegistration(
  player: {
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
  },
  roster: Roster,
) {
  const lines = roster.players.map((item) =>
    [item.id, item.name, item.age, item.area, item.role, item.batting, item.bowling, item.jersey, `••••${item.mobileTail}`].join("\t"),
  );
  const fields: Record<string, string> = {
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
  };
  const frameId = "dpl-mail-frame";
  let frame = document.getElementById(frameId) as HTMLIFrameElement | null;
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = frameId;
    frame.name = frameId;
    frame.title = "Registration email";
    frame.hidden = true;
    document.body.appendChild(frame);
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `https://formsubmit.co/${OWNER_EMAIL}`;
  form.target = frameId;
  form.acceptCharset = "UTF-8";
  form.style.display = "none";
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  window.setTimeout(() => form.remove(), 4000);
  return { ok: true, message: "handed to the mail form" };
}
