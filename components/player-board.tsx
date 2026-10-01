"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/constants";
import { formatWhen } from "@/lib/format";
import type { PublicPlayer, Role } from "@/lib/types";

type Props = {
  limit?: number;
  showFilters?: boolean;
};

export function PlayerBoard({ limit, showFilters = true }: Props) {
  const [players, setPlayers] = useState<PublicPlayer[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "all">("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/players", { cache: "no-store" });
        const data = (await response.json()) as { players?: PublicPlayer[] };
        if (!cancelled) {
          setPlayers(data.players ?? []);
          setError("");
        }
      } catch {
        if (!cancelled) setError("The list could not be loaded.");
      }
    };
    void load();
    const id = setInterval(() => void load(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const visible = useMemo(() => {
    const list = players ?? [];
    const filtered = list.filter((player) => {
      const blob = `${player.name} ${player.area} ${player.id}`.toLowerCase();
      const matchesQuery = blob.includes(query.trim().toLowerCase());
      const matchesRole = role === "all" || player.role === role;
      return matchesQuery && matchesRole;
    });
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [players, query, role, limit]);

  const count = players?.length ?? 0;

  return (
    <section className="scorecard overflow-hidden rounded-3xl" aria-live="polite">
      <div className="flex flex-col gap-4 border-b border-[#1e4d34]/15 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-xs tracking-[0.22em] text-[#8a6a2f]">PUBLIC LIST</p>
          <h2 className="mt-1 font-display text-3xl leading-none tracking-wide text-[#17241c]">Who has registered</h2>
          <p className="mt-2 max-w-xl text-sm text-[#3e5146]">
            If a name is here, that player has registered. If it is not, the form is still pending.
          </p>
        </div>
        <p className="font-display text-4xl leading-none text-[#1e4d34] tabular-nums">
          {players ? count : "–"}
          <span className="ml-2 text-base tracking-[0.14em] text-[#3e5146]">PLAYERS</span>
        </p>
      </div>

      {showFilters ? (
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:px-6">
          <label className="grid flex-1 gap-1 text-sm font-medium">
            Name or area
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="h-12 rounded-lg border border-[#17241c]/15 bg-[#fffdf8] px-3"
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <FilterChip active={role === "all"} onClick={() => setRole("all")}>
              All
            </FilterChip>
            {ROLES.map((item) => (
              <FilterChip key={item.value} active={role === item.value} onClick={() => setRole(item.value)}>
                {item.value}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="px-6 pb-4 text-sm text-[#9b2330]">{error}</p> : null}

      {players && players.length === 0 ? (
        <p className="px-6 py-10 text-[#3e5146]">
          No players have registered yet. You can be the first name on the list.
        </p>
      ) : null}

      {visible.length > 0 ? (
        <ul className="divide-y divide-[#1e4d34]/10">
          {visible.map((player) => (
            <li key={player.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:px-6">
              <p className="font-display text-lg tracking-wide text-[#1e4d34]">{player.id}</p>
              <div>
                <p className="text-lg font-semibold text-[#17241c]">{player.name}</p>
                <p className="text-sm text-[#3e5146]">
                  {player.age} years · {player.role} · {player.area}
                </p>
                <p className="text-sm text-[#3e5146]">
                  {player.batting} · Jersey {player.jersey} · mobile ••••{" "}
                  {player.mobileTail}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Badge variant={player.paymentStatus === "verified" ? "default" : "secondary"}>
                  {player.paymentStatus === "verified" ? "Payment confirmed" : "Fee submitted"}
                </Badge>
                <span className="text-xs text-[#5c6b62]">{formatWhen(player.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {players && visible.length === 0 && players.length > 0 ? (
        <p className="px-6 py-8 text-sm text-[#3e5146]">No names match this search.</p>
      ) : null}

      {typeof limit === "number" && count > limit ? (
        <div className="border-t border-[#1e4d34]/10 px-6 py-4">
          <Link href="/players" className="font-semibold text-[#1e4d34] underline decoration-[#c4a15a] underline-offset-4">
            See all {count} names
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-10 rounded-full bg-[#1e4d34] px-3 text-sm font-semibold text-[#f6f1e4]"
          : "h-10 rounded-full border border-[#17241c]/15 px-3 text-sm font-semibold text-[#17241c]"
      }
    >
      {children}
    </button>
  );
}
