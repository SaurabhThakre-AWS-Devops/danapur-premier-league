import { isAdmin } from "@/lib/auth";
import { buildWorkbook } from "@/lib/excel";
import { json } from "@/lib/http";
import { listPlayers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return json({ ok: false, error: "Log in first." }, 401);
  const buffer = await buildWorkbook(await listPlayers());
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=DPL-2026-registrations.xlsx",
      "Cache-Control": "no-store",
    },
  });
}
