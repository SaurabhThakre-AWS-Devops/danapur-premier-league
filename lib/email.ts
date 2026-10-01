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
    return `DPL ${SEASON} — ${highlight.name} registered (total ${players.length})`;
  }
  return `DPL ${SEASON} — full registration list (${players.length} players)`;
}

function textBody(players: Player[], highlight?: Player | null) {
  const newest = highlight
    ? [
        "NEW REGISTRATION",
        `No: ${highlight.id}`,
        `Name: ${highlight.name}`,
        `Mobile: ${formatMobile(highlight.mobile)}`,
        `Age: ${highlight.age}`,
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
    : "The full list is below.\n\n";

  return [
    `${LEAGUE} ${SEASON}`,
    `Total registered players: ${players.length}`,
    "",
    newest,
    "FULL LIST — paste into Excel (columns are separated by tabs):",
    playersToTsv(players),
    "",
    "Open the attached Excel file if it is there. Otherwise copy the list above and paste it into Excel.",
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
    detail: "The full Excel list was sent to Gmail, with the file attached.",
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
  form.append("new_player", highlight ? `${highlight.id} ${highlight.name}` : "Full list");
  form.append("mobile", highlight?.mobile ?? "-");
  form.append("age", highlight ? String(highlight.age) : "-");
  form.append("area", highlight?.area ?? "-");
  form.append("role", highlight?.role ?? "-");
  form.append("utr", highlight?.utr ?? "-");
  form.append("fee", `Rs ${FEE_RUPEES}`);
  form.append(
    "excel_paste_full_list",
    "Copy the full list below and paste it into Excel. Columns are separated by tabs.\n\n" + tsv,
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
  const message = payload?.message || `The mail service returned ${response.status}.`;
  if (!response.ok || !success) {
    const blocked = response.status === 403;
    return {
      ok: false,
      channel: "formsubmit",
      detail: blocked
        ? "Direct mail is blocked on this network. Add a Gmail App Password in admin — the Excel file will then go to Gmail on its own."
        : message,
    };
  }
  return {
    ok: true,
    channel: "formsubmit",
    detail: message || "The full list was emailed.",
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
            detail: `Gmail failed: ${reason}. Backup also failed: ${backupReason}`,
          };
        });
        result = backup.ok
          ? backup
          : { ok: false, channel: "none", detail: `Gmail failed: ${reason}. ${backup.detail}` };
      }
    } else {
      result = await sendFormSubmit(players, highlight);
    }
  } catch (error) {
    result = {
      ok: false,
      channel: "none",
      detail: error instanceof Error ? error.message : "The email could not be sent.",
    };
  }

  await addEmailLog({
    at: new Date().toISOString(),
    playerId: highlight?.id ?? "LIST",
    playerName: highlight?.name ?? "Full list",
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
