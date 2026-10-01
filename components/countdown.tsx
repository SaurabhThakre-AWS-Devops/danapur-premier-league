"use client";

import { useEffect, useState } from "react";
import { DEADLINE_ISO } from "@/lib/constants";

export function Countdown() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(DEADLINE_ISO).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Closed");
        return;
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(`${days} days ${hours} hr ${mins} min`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular-nums">{label ?? "…"}</span>;
}
