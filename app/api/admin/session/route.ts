import { isAdmin } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({ ok: await isAdmin(), email: OWNER_EMAIL });
}
