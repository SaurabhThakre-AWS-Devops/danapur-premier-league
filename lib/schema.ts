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
        .min(2, "Name must be at least 2 letters.")
        .max(60, "Name is too long.")
        .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,59}$/u, "Use letters in the name."),
    ),
  mobile: z
    .string()
    .transform(normalizeMobile)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Mobile must be 10 digits and start with 6, 7, 8, or 9.")),
  age: z.coerce
    .number({ invalid_type_error: "Enter age as a number." })
    .int("Age must be a whole number.")
    .min(12, "Age must be between 12 and 60.")
    .max(60, "Age must be between 12 and 60."),
  area: z
    .string()
    .optional()
    .transform((value) => normalizeName(value ?? ""))
    .pipe(z.string().max(80)),
  role: z.enum(roleValues, { errorMap: () => ({ message: "Choose a playing role." }) }),
  batting: z.enum(battingValues, { errorMap: () => ({ message: "Choose a batting hand." }) }),
  bowling: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : "Does not bowl"))
    .pipe(z.enum(BOWLING, { errorMap: () => ({ message: "Choose a bowling style from the list." }) })),
  jersey: z.enum(JERSEYS, { errorMap: () => ({ message: "Choose a jersey size." }) }),
  utr: z
    .string()
    .transform(normalizeUtr)
    .pipe(
      z
        .string()
        .min(8, "Enter the transaction ID after you pay ₹100.")
        .max(22, "Transaction ID is too long."),
    ),
  paid: z.literal(true, {
    errorMap: () => ({ message: "Tick the box after you pay ₹100." }),
  }),
  company: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export function fieldError(error: z.ZodError) {
  const first = error.issues[0];
  const field = first?.path[0];
  return {
    field: typeof field === "string" ? field : undefined,
    error: first?.message || "Check the form.",
  };
}
