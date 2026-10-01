import { DEADLINE_ISO, DEADLINE_LABEL, FEE_RUPEES, isRegistrationOpen } from "@/lib/constants";
import { json } from "@/lib/http";
import { listPlayers, toPublic } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const players = await listPlayers();
  const publicPlayers = players
    .map(toPublic)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({
    ok: true,
    open: isRegistrationOpen(),
    deadline: DEADLINE_ISO,
    deadlineLabel: DEADLINE_LABEL,
    fee: FEE_RUPEES,
    count: publicPlayers.length,
    players: publicPlayers,
  });
}
