import { cookies } from "next/headers";
import { sessionCookie } from "@/lib/auth";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const jar = await cookies();
  const cookie = sessionCookie(request);
  jar.set(cookie.name, "", { ...cookie.options, maxAge: 0 });
  return json({ ok: true });
}
