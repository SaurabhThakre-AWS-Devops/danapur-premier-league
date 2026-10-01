export const LEAGUE = "Danapur Premier League";
export const SEASON = "2026";
export const FEE_RUPEES = 100;
export const OWNER_EMAIL = "sthakre252001@gmail.com";
export const PAYEE_NAME = "Ratan Kailas Gawai";
export const UPI_ID = "9370797557@ybl";
export const DEADLINE_ISO = "2026-10-19T23:59:59+05:30";
export const DEADLINE_LABEL = "19 October 2026";
export const MAX_PLAYERS = 500;

export const ROLES = [
  { value: "Batsman" },
  { value: "Bowler" },
  { value: "All-rounder" },
  { value: "Wicket-keeper" },
] as const;

export const BATTING = [{ value: "Right-hand" }, { value: "Left-hand" }] as const;

export const BOWLING = [
  "Does not bowl",
  "Right-arm fast",
  "Right-arm medium",
  "Right-arm off-spin",
  "Right-arm leg-spin",
  "Left-arm fast",
  "Left-arm medium",
  "Left-arm orthodox",
  "Left-arm wrist-spin",
] as const;

export const JERSEYS = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

export const AREAS = [
  "Danapur",
  "Danapur Cantt",
  "Khagaul",
  "Digha",
  "Bihta",
  "Maner",
  "Naubatpur",
  "Neora",
  "Shivala",
  "Saguna More",
  "RPS More",
  "Anand Bazar",
  "Gola Road",
  "Bailey Road",
  "Khajpura",
  "Phulwari Sharif",
];

export function isRegistrationOpen(now = Date.now()) {
  return now <= new Date(DEADLINE_ISO).getTime();
}

export function upiPayLink() {
  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=100.00&cu=INR&tn=${encodeURIComponent("DPL2026 Entry")}`;
}

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || OWNER_EMAIL).trim().toLowerCase();
}
