import { cookies } from "next/headers";
import { emailAllowed, passwordsMatch, sessionCookie, signSession } from "@/lib/auth";
import { json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`login:${clientIp(request)}`, 8, 15 * 60 * 1000)) {
    return json({ ok: false, error: "Too many failed attempts. Try again in 15 minutes." }, 429);
  }
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return json({ ok: false, error: "The admin password is not set on the server." }, 503);
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email ?? "";
  const password = body?.password ?? "";
  if (!emailAllowed(email) || !passwordsMatch(password)) {
    return json({ ok: false, error: "Email or password is wrong." }, 401);
  }
  const jar = await cookies();
  const cookie = sessionCookie(request);
  jar.set(cookie.name, signSession(), cookie.options);
  return json({ ok: true });
}
