import fs from "fs/promises";
import path from "path";
import { MAX_PLAYERS, isRegistrationOpen } from "@/lib/constants";
import type { EmailLogEntry, Player, PublicPlayer } from "@/lib/types";

type Database = {
  nextNumber: number;
  players: Player[];
  emailLog: EmailLogEntry[];
};

const dir = path.join(process.cwd(), "data");
const file = path.join(dir, "registrations.json");
const mailFile = path.join(dir, "mail-secret.json");

const empty = (): Database => ({ nextNumber: 1, players: [], emailLog: [] });

let chain: Promise<unknown> = Promise.resolve();

function lock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function read(): Promise<Database> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      nextNumber: typeof parsed.nextNumber === "number" ? parsed.nextNumber : 1,
      players: Array.isArray(parsed.players) ? parsed.players : [],
      emailLog: Array.isArray(parsed.emailLog) ? parsed.emailLog : [],
    };
  } catch {
    return empty();
  }
}

async function write(db: Database) {
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, file);
}

export class StoreError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function toPublic(player: Player): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    age: player.age,
    area: player.area,
    role: player.role,
    batting: player.batting,
    bowling: player.bowling,
    jersey: player.jersey,
    paymentStatus: player.paymentStatus,
    mobileTail: player.mobile.slice(-4),
    createdAt: player.createdAt,
  };
}

export async function listPlayers() {
  const db = await lock(read);
  return db.players;
}

export async function addPlayer(input: Omit<Player, "id" | "createdAt" | "paymentStatus">) {
  return lock(async () => {
    if (!isRegistrationOpen()) {
      throw new StoreError("CLOSED", "Registration is closed. The last date was 19 October 2026.");
    }
    const db = await read();
    if (db.players.length >= MAX_PLAYERS) {
      throw new StoreError("FULL", "This league's registration list is full.");
    }
    if (db.players.some((player) => player.mobile === input.mobile)) {
      throw new StoreError(
        "DUPLICATE_MOBILE",
        "This mobile number is already registered.",
      );
    }
    if (db.players.some((player) => player.utr === input.utr)) {
      throw new StoreError("DUPLICATE_UTR", "This transaction ID is already used by another player.");
    }
    const player: Player = {
      ...input,
      id: `DPL-${String(db.nextNumber).padStart(3, "0")}`,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    db.nextNumber += 1;
    db.players.push(player);
    await write(db);
    return { player, players: db.players };
  });
}

export async function updatePlayer(id: string, patch: Partial<Omit<Player, "id" | "createdAt">>) {
  return lock(async () => {
    const db = await read();
    const index = db.players.findIndex((player) => player.id === id);
    if (index < 0) throw new StoreError("NOT_FOUND", "Player not found.");
    const current = db.players[index];
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<Player>;
    const next = { ...current, ...clean, id: current.id, createdAt: current.createdAt };
    if (db.players.some((player) => player.id !== id && player.mobile === next.mobile)) {
      throw new StoreError("DUPLICATE_MOBILE", "This mobile number belongs to another player.");
    }
    if (db.players.some((player) => player.id !== id && player.utr === next.utr)) {
      throw new StoreError("DUPLICATE_UTR", "This transaction ID belongs to another player.");
    }
    db.players[index] = next;
    await write(db);
    return next;
  });
}

export async function deletePlayer(id: string) {
  return lock(async () => {
    const db = await read();
    const before = db.players.length;
    db.players = db.players.filter((player) => player.id !== id);
    if (db.players.length === before) throw new StoreError("NOT_FOUND", "Player not found.");
    await write(db);
    return db.players;
  });
}

export async function addEmailLog(entry: EmailLogEntry) {
  return lock(async () => {
    const db = await read();
    db.emailLog.push(entry);
    db.emailLog = db.emailLog.slice(-40);
    await write(db);
    return db.emailLog;
  });
}

export async function latestEmailLog() {
  const db = await lock(read);
  return db.emailLog.slice(-8).reverse();
}

export async function readMailPassword() {
  try {
    const raw = await fs.readFile(mailFile, "utf8");
    const parsed = JSON.parse(raw) as { appPassword?: string };
    const password = parsed.appPassword?.replace(/\s/g, "") ?? "";
    return password.length >= 8 ? password : "";
  } catch {
    return "";
  }
}

export async function writeMailPassword(appPassword: string) {
  await fs.mkdir(dir, { recursive: true });
  const cleaned = appPassword.replace(/\s/g, "");
  await fs.writeFile(mailFile, JSON.stringify({ appPassword: cleaned }), { mode: 0o600 });
}

export async function clearMailPassword() {
  await fs.rm(mailFile, { force: true });
}
