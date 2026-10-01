import { FEE_RUPEES, isRegistrationOpen } from "@/lib/constants";
import { deliverList } from "@/lib/email";
import { json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldError, registerSchema } from "@/lib/schema";
import { StoreError, addPlayer, toPublic } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!rateLimit(`register:${clientIp(request)}`, 8, 60 * 60 * 1000)) {
    return json({ ok: false, error: "Bahut saari koshish ho chuki. Thodi der baad try karo." }, 429);
  }
  if (!isRegistrationOpen()) {
    return json(
      { ok: false, error: "Registration band ho chuka hai. Aakhri tareekh 19 October 2026 thi." },
      403,
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "Form samajh nahi aaya. Dobara bharo." }, 400);
  }
  if (typeof (body as { company?: string }).company === "string" && (body as { company?: string }).company) {
    return json({ ok: false, error: "Form reject ho gaya." }, 400);
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
        ? "Organiser ke Gmail par poori list chali gayi."
        : "Naam save ho gaya. Mail abhi nahi pahuncha — organiser admin se Excel le sakta hai.",
    });
  } catch (error) {
    if (error instanceof StoreError) {
      const status = error.code === "CLOSED" ? 403 : 409;
      return json({ ok: false, error: error.message, field: error.code === "DUPLICATE_MOBILE" ? "mobile" : error.code === "DUPLICATE_UTR" ? "utr" : undefined }, status);
    }
    return json({ ok: false, error: "Registration save nahi ho payi. Dobara try karo." }, 500);
  }
}
