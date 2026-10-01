import { FEE_RUPEES, isRegistrationOpen } from "@/lib/constants";
import { deliverList } from "@/lib/email";
import { json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldError, registerSchema } from "@/lib/schema";
import { StoreError, addPlayer, toPublic } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`register:${clientIp(request)}`, 8, 60 * 60 * 1000)) {
    return json({ ok: false, error: "Too many attempts. Try again in a little while." }, 429);
  }
  if (!isRegistrationOpen()) {
    return json(
      { ok: false, error: "Registration is closed. The last date was 19 October 2026." },
      403,
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "The form could not be read. Fill it in again." }, 400);
  }
  if (typeof (body as { company?: string }).company === "string" && (body as { company?: string }).company) {
    return json({ ok: false, error: "The form was rejected." }, 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const issue = fieldError(parsed.error);
    return json({ ok: false, ...issue }, 400);
  }

  try {
    const { player } = await addPlayer({
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      age: parsed.data.age,
      area: parsed.data.area,
      role: parsed.data.role,
      batting: parsed.data.batting,
      bowling: parsed.data.bowling,
      jersey: parsed.data.jersey,
      utr: parsed.data.utr,
    });
    const mail = await deliverList(player);
    return json({
      ok: true,
      player: toPublic(player),
      fee: FEE_RUPEES,
      emailSent: mail.ok,
      emailDetail: mail.ok
        ? "The full list was sent to the organiser's Gmail."
        : "Your name is saved. The email has not arrived yet — the organiser can download the Excel from admin.",
    });
  } catch (error) {
    if (error instanceof StoreError) {
      const status = error.code === "CLOSED" ? 403 : 409;
      return json({ ok: false, error: error.message, field: error.code === "DUPLICATE_MOBILE" ? "mobile" : error.code === "DUPLICATE_UTR" ? "utr" : undefined }, status);
    }
    return json({ ok: false, error: "Registration could not be saved. Try again." }, 500);
  }
}
