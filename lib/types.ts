import type { BATTING, ROLES } from "@/lib/constants";

export type Role = (typeof ROLES)[number]["value"];
export type Batting = (typeof BATTING)[number]["value"];
export type PaymentStatus = "pending" | "verified";

export type Player = {
  id: string;
  name: string;
  mobile: string;
  age: number;
  area: string;
  role: Role;
  batting: Batting;
  bowling: string;
  jersey: string;
  utr: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type PublicPlayer = {
  id: string;
  name: string;
  age: number;
  area: string;
  role: Role;
  batting: Batting;
  bowling: string;
  jersey: string;
  paymentStatus: PaymentStatus;
  mobileTail: string;
  createdAt: string;
};

export type EmailLogEntry = {
  at: string;
  playerId: string;
  playerName: string;
  ok: boolean;
  channel: "gmail" | "formsubmit" | "none";
  detail: string;
};
