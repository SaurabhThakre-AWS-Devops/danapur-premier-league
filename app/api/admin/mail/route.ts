import { isAdmin } from "@/lib/auth";
import { deliverList, verifyGmailPassword } from "@/lib/email";
import { json } from "@/lib/http";
import { clearMailPassword, writeMailPassword } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdmin())) return json({ ok: false, error: "Log in first." }, 401);
  const body = (await request.json().catch(() => null)) as { appPassword?: string; clear?: boolean } | null;
  if (body?.clear) {
    await clearMailPassword();
    return json({ ok: true, gmailReady: false, detail: "Gmail app password removed." });
  }
  const password = body?.appPassword?.trim() ?? "";
  if (password.replace(/\s/g, "").length < 8) {
    return json({ ok: false, error: "Paste the full app password." }, 400);
  }
  try {
    await verifyGmailPassword(password);
  } catch {
    return json(
      {
        ok: false,
        error:
          "Gmail did not accept that password. Turn on 2-Step Verification and create a new App Password. The normal Gmail password will not work.",
      },
      400,
    );
  }
  await writeMailPassword(password);
  const mail = await deliverList(null);
  return json({
    ok: true,
    gmailReady: true,
    detail: mail.ok
      ? "Gmail is connected. The current full Excel list was emailed."
      : "Password saved, but the test email did not send. Use Email the full list now.",
  });
}
