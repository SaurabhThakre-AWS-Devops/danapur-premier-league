import { isAdmin } from "@/lib/auth";
import { deliverList } from "@/lib/email";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdmin())) return json({ ok: false, error: "Login chahiye." }, 401);
  const mail = await deliverList(null);
  return json({ ok: mail.ok, detail: mail.detail, channel: mail.channel });
}
