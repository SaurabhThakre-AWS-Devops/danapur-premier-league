import { isAdmin } from "@/lib/auth";
import { deliverList, verifyGmailPassword } from "@/lib/email";
import { json } from "@/lib/http";
import { clearMailPassword, writeMailPassword } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdmin())) return json({ ok: false, error: "Login chahiye." }, 401);
  const body = (await request.json().catch(() => null)) as { appPassword?: string; clear?: boolean } | null;
  if (body?.clear) {
    await clearMailPassword();
    return json({ ok: true, gmailReady: false, detail: "Gmail app password hata diya." });
  }
  const password = body?.appPassword?.trim() ?? "";
  if (password.replace(/\s/g, "").length < 8) {
    return json({ ok: false, error: "App password poora paste karo." }, 400);
  }
  try {
    await verifyGmailPassword(password);
  } catch {
    return json(
      {
        ok: false,
        error:
          "Gmail ne password accept nahi kiya. 2-Step Verification on karke naya App Password banao, normal Gmail password nahi chalega.",
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
      ? "Gmail jud gaya. Abhi ki poori Excel list mail par bhej di."
      : "Password save ho gaya, par test mail nahi gaya. Resend dabao.",
  });
}
