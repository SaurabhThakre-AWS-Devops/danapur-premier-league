import { isAdmin } from "@/lib/auth";
import { json } from "@/lib/http";
import { latestEmailLog, listPlayers, readMailPassword } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return json({ ok: false, error: "Login chahiye." }, 401);
  const players = await listPlayers();
  const ordered = [...players].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({
    ok: true,
    players: ordered,
    emailLog: await latestEmailLog(),
    gmailReady: Boolean(await readMailPassword()),
  });
}
