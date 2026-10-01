import type { Metadata } from "next";
import { PlayerBoard } from "@/components/player-board";

export const metadata: Metadata = {
  title: "Who has registered",
  description: "Public registration list for Danapur Premier League 2026.",
};

export default function PlayersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <p className="font-display text-sm tracking-[0.24em] text-[#c4a15a]">PUBLIC LIST</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl leading-none tracking-wide text-[#f6f1e4] sm:text-6xl">
        Who has registered
      </h1>
      <p className="mt-3 max-w-2xl text-[#f6f1e4]/80">
        The list updates on its own. If a name is here, that player has registered. If it is not, the form is still
        pending.
      </p>
      <div className="mt-8">
        <PlayerBoard />
      </div>
    </div>
  );
}
