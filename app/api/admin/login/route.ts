import { cookies } from "next/headers";
import { emailAllowed, passwordsMatch, sessionCookie, signSession } from "@/lib/auth";
import { json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`login:${clientIp(request)}`, 8, 15 * 60 * 1000)) {
    return json({ ok: false, error: "Bahut saari galat koshish. 15 minute baad try karo." }, 429);
  }
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return json({ ok: false, error: "Admin password server par set nahi hai." }, 503);
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email ?? "";
  const password = body?.password ?? "";
  if (!emailAllowed(email) || !passwordsMatch(password)) {
    return json({ ok: false, error: "Email ya password galat hai." }, 401);
  }
  const jar = await cookies();
  const cookie = sessionCookie(request);
  jar.set(cookie.name, signSession(), cookie.options);
  return json({ ok: true });
}
