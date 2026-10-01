import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { adminEmail } from "@/lib/constants";

const COOKIE = "dpl_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.ADMIN_SECRET;
  if (!value) throw new Error("ADMIN_SECRET missing");
  return value;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function signSession() {
  const exp = Date.now() + MAX_AGE_MS;
  const body = String(exp);
  const sig = createHmac("sha256", secret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expected = createHmac("sha256", secret()).update(exp).digest("hex");
  if (!safeEqual(sig, expected)) return false;
  return Number(exp) > Date.now();
}

export function passwordsMatch(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export function emailAllowed(input: string) {
  return input.trim().toLowerCase() === adminEmail();
}

export async function isAdmin() {
  try {
    const jar = await cookies();
    return verifySession(jar.get(COOKIE)?.value);
  } catch {
    return false;
  }
}

export function sessionCookie(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return {
    name: COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: proto === "https",
      path: "/",
      maxAge: Math.floor(MAX_AGE_MS / 1000),
    },
  };
}
