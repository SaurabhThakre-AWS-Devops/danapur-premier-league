import nodemailer from "nodemailer";
import { FEE_RUPEES, LEAGUE, OWNER_EMAIL, SEASON } from "@/lib/constants";
import { buildWorkbook, playersToTsv } from "@/lib/excel";
import { formatMobile, formatWhen } from "@/lib/format";
import { addEmailLog, listPlayers, readMailPassword } from "@/lib/store";
import type { Player } from "@/lib/types";

export type MailResult = {
  ok: boolean;
  channel: "gmail" | "formsubmit" | "none";
  detail: string;
};

function subjectFor(players: Player[], highlight?: Player | null) {
  if (highlight) {
    return `DPL ${SEASON} — ${highlight.name} ne register kiya (kul ${players.length})`;
  }
  return `DPL ${SEASON} — poori registration list (${players.length} players)`;
}

function textBody(players: Player[], highlight?: Player | null) {
  const newest = highlight
    ? [
        "NAYA REGISTRATION",
        `No: ${highlight.id}`,
        `Naam: ${highlight.name}`,
        `Mobile: ${formatMobile(highlight.mobile)}`,
        `Umar: ${highlight.age}`,
        `Area: ${highlight.area}`,
        `Role: ${highlight.role}`,
        `Batting: ${highlight.batting}`,
        `Bowling: ${highlight.bowling}`,
        `Jersey: ${highlight.jersey}`,
        `UTR: ${highlight.utr}`,
        `Time: ${formatWhen(highlight.createdAt)}`,
        `Fee: Rs ${FEE_RUPEES}`,
        "",
      ].join("\n")
    : "Poori list neeche hai.\n\n";

  return [
    `${LEAGUE} ${SEASON}`,
    `Kul registered players: ${players.length}`,
    "",
    newest,
    "POORI LIST — Excel mein paste karne ke liye (columns tab se alag hain):",
    playersToTsv(players),
    "",
    "Agar Excel file attach hai to wahi kholo. Warna upar ki list copy karke Excel mein paste kar do.",
  ].join("\n");
}

async function sendGmail(players: Player[], highlight: Player | null, password: string): Promise<MailResult> {
  const buffer = await buildWorkbook(players);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: OWNER_EMAIL, pass: password },
  });
  await transporter.sendMail({
    from: `"${LEAGUE}" <${OWNER_EMAIL}>`,
    to: OWNER_EMAIL,
    subject: subjectFor(players, highlight),
    text: textBody(players, highlight),
    attachments: [
      {
        filename: "DPL-2026-registrations.xlsx",
        content: buffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
  return {
    ok: true,
    channel: "gmail",
    detail: "Poori Excel list Gmail par chali gayi, file attach hai.",
  };
}

async function sendFormSubmit(players: Player[], highlight: Player | null): Promise<MailResult> {
  const buffer = await buildWorkbook(players);
  const form = new FormData();
  const tsv = playersToTsv(players).slice(0, 45000);
  form.append("_subject", subjectFor(players, highlight));
  form.append("_captcha", "false");
  form.append("_template", "table");
  form.append("_honey", "");
  form.append("league", `${LEAGUE} ${SEASON}`);
  form.append("total_players", String(players.length));
  form.append("new_player", highlight ? `${highlight.id} ${highlight.name}` : "Poori list");
  form.append("mobile", highlight?.mobile ?? "-");
  form.append("age", highlight ? String(highlight.age) : "-");
  form.append("area", highlight?.area ?? "-");
  form.append("role", highlight?.role ?? "-");
  form.append("utr", highlight?.utr ?? "-");
  form.append("fee", `Rs ${FEE_RUPEES}`);
  form.append(
    "excel_paste_full_list",
    "Neeche ki poori list ko copy karke Excel mein paste karo. Columns tab se alag hain.\n\n" + tsv,
  );
  form.append(
    "attachment",
    new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "DPL-2026-registrations.xlsx",
  );

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(OWNER_EMAIL)}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
    signal: AbortSignal.timeout(15000),
  });
  const payload = (await response.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
  const success = payload?.success === true || payload?.success === "true";
  const message = payload?.message || `Mail service ne ${response.status} diya.`;
  if (!response.ok || !success) {
    const blocked = response.status === 403;
    return {
      ok: false,
      channel: "formsubmit",
      detail: blocked
        ? "Seedha mail is network par ruk gaya. Admin mein Gmail App Password lagao — uske baad Excel file khud Gmail par jayegi."
        : message,
    };
  }
  return {
    ok: true,
    channel: "formsubmit",
    detail: message || "Poori list mail par chali gayi.",
  };
}

export async function deliverList(highlight: Player | null): Promise<MailResult> {
  const players = await listPlayers();
  const password = await readMailPassword();
  let result: MailResult;
  try {
    if (password) {
      try {
        result = await sendGmail(players, highlight, password);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Gmail send fail";
        const backup = await sendFormSubmit(players, highlight).catch((backupError: unknown) => {
          const backupReason = backupError instanceof Error ? backupError.message : "backup fail";
          return {
            ok: false,
            channel: "none" as const,
            detail: `Gmail fail: ${reason}. Backup bhi fail: ${backupReason}`,
          };
        });
        result = backup.ok
          ? backup
          : { ok: false, channel: "none", detail: `Gmail fail: ${reason}. ${backup.detail}` };
      }
    } else {
      result = await sendFormSubmit(players, highlight);
    }
  } catch (error) {
    result = {
      ok: false,
      channel: "none",
      detail: error instanceof Error ? error.message : "Mail nahi ja paya.",
    };
  }

  await addEmailLog({
    at: new Date().toISOString(),
    playerId: highlight?.id ?? "LIST",
    playerName: highlight?.name ?? "Poori list",
    ok: result.ok,
    channel: result.channel,
    detail: result.detail.slice(0, 400),
  });
  return result;
}

export async function verifyGmailPassword(password: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: OWNER_EMAIL, pass: password.replace(/\s/g, "") },
  });
  await transporter.verify();
}
