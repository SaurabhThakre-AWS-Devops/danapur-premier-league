import { isAdmin } from "@/lib/auth";
import { json } from "@/lib/http";
import { fieldError, normalizeMobile, normalizeName, normalizeUtr, registerSchema } from "@/lib/schema";
import { StoreError, deletePlayer, updatePlayer } from "@/lib/store";
import type { PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await isAdmin())) return json({ ok: false, error: "Log in first." }, 401);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ ok: false, error: "Details were missing." }, 400);

  if (body.paymentStatus === "pending" || body.paymentStatus === "verified") {
    if (Object.keys(body).length === 1) {
      try {
        const player = await updatePlayer(id, { paymentStatus: body.paymentStatus as PaymentStatus });
        return json({ ok: true, player });
      } catch (error) {
        if (error instanceof StoreError) return json({ ok: false, error: error.message }, 404);
        return json({ ok: false, error: "Update failed." }, 500);
      }
    }
  }

  const parsed = registerSchema.safeParse({ ...body, paid: true, company: "" });
  if (!parsed.success) {
    return json({ ok: false, ...fieldError(parsed.error) }, 400);
  }
  try {
    const player = await updatePlayer(id, {
      name: normalizeName(parsed.data.name),
      mobile: normalizeMobile(parsed.data.mobile),
      age: parsed.data.age,
      area: normalizeName(parsed.data.area),
      role: parsed.data.role,
      batting: parsed.data.batting,
      bowling: parsed.data.bowling,
      jersey: parsed.data.jersey,
      utr: normalizeUtr(parsed.data.utr),
      paymentStatus:
        body.paymentStatus === "verified" || body.paymentStatus === "pending"
          ? body.paymentStatus
          : undefined,
    });
    return json({ ok: true, player });
  } catch (error) {
    if (error instanceof StoreError) {
      return json({ ok: false, error: error.message }, error.code === "NOT_FOUND" ? 404 : 409);
    }
    return json({ ok: false, error: "Update failed." }, 500);
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdmin())) return json({ ok: false, error: "Log in first." }, 401);
  const { id } = await context.params;
  try {
    await deletePlayer(decodeURIComponent(id));
    return json({ ok: true });
  } catch (error) {
    if (error instanceof StoreError) return json({ ok: false, error: error.message }, 404);
    return json({ ok: false, error: "Delete failed." }, 500);
  }
}
