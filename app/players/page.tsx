import type { Metadata } from "next";
import { PlayerBoard } from "@/components/player-board";

export const metadata: Metadata = {
  title: "किसने फॉर्म भरा",
  description: "Danapur Premier League 2026 ki public registration list.",
};

export default function PlayersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <p className="font-display text-sm tracking-[0.24em] text-[#c4a15a]">SABKO DIKHTA HAI</p>
      <h1 className="mt-2 max-w-3xl font-hindi text-4xl leading-tight text-[#f6f1e4] sm:text-6xl">
        किसने फॉर्म भरा, किसने नहीं
      </h1>
      <p className="mt-3 max-w-2xl text-[#f6f1e4]/80">
        List khud update hoti rehti hai. Naam hai to form bhar chuka. Naam nahi hai to abhi register karna baaki hai.
      </p>
      <div className="mt-8">
        <PlayerBoard />
      </div>
    </div>
  );
}
