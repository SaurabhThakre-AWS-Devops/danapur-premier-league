import { z } from "zod";
import { BATTING, BOWLING, JERSEYS, ROLES } from "@/lib/constants";

const roleValues = ROLES.map((role) => role.value) as [
  (typeof ROLES)[number]["value"],
  ...(typeof ROLES)[number]["value"][],
];
const battingValues = BATTING.map((item) => item.value) as [
  (typeof BATTING)[number]["value"],
  ...(typeof BATTING)[number]["value"][],
];

export function normalizeMobile(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function normalizeUtr(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 22);
}

export function normalizeName(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export const registerSchema = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .pipe(
      z
        .string()
        .min(2, "Naam kam se kam 2 akshar ka hona chahiye.")
        .max(60, "Naam bahut lamba hai.")
        .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,59}$/u, "Naam mein sirf akshar likho."),
    ),
  mobile: z
    .string()
    .transform(normalizeMobile)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Mobile 10 digit ka hona chahiye, aur 6, 7, 8 ya 9 se shuru.")),
  age: z.coerce
    .number({ invalid_type_error: "Umar number mein likho." })
    .int("Umar poora number hona chahiye.")
    .min(12, "Umar 12 se 60 saal ke beech honi chahiye.")
    .max(60, "Umar 12 se 60 saal ke beech honi chahiye."),
  area: z
    .string()
    .transform(normalizeName)
    .pipe(
      z
        .string()
        .min(2, "Mohalla ya ilaka likho.")
        .max(80, "Ilaka bahut lamba hai."),
    ),
  role: z.enum(roleValues, { errorMap: () => ({ message: "Khelne ki bhumika chuno." }) }),
  batting: z.enum(battingValues, { errorMap: () => ({ message: "Batting haath chuno." }) }),
  bowling: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : "Nahi karta"))
    .pipe(z.enum(BOWLING, { errorMap: () => ({ message: "Bowling style list se chuno." }) })),
  jersey: z.enum(JERSEYS, { errorMap: () => ({ message: "Jersey size chuno." }) }),
  utr: z
    .string()
    .transform(normalizeUtr)
    .pipe(
      z
        .string()
        .min(8, "Transaction ID kam se kam 8 character ki honi chahiye.")
        .max(22, "Transaction ID bahut lambi hai."),
    ),
  paid: z.literal(true, {
    errorMap: () => ({ message: "₹100 bhejne ke baad checkbox par nishaan lagao." }),
  }),
  company: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export function fieldError(error: z.ZodError) {
  const first = error.issues[0];
  const field = first?.path[0];
  return {
    field: typeof field === "string" ? field : undefined,
    error: first?.message || "Form check karo.",
  };
}
