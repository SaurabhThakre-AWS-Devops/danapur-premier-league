export const LEAGUE = "Danapur Premier League";
export const SEASON = "2026";
export const FEE_RUPEES = 100;
export const OWNER_EMAIL = "gawairatan960@gmail.com";
export const PAYEE_NAME = "Ratan Kailas Gawai";
export const UPI_ID = "9370797557@ybl";
export const DEADLINE_ISO = "2026-10-19T23:59:59+05:30";
export const DEADLINE_LABEL = "19 October 2026";
export const DEADLINE_LABEL_HI = "19 अक्टूबर 2026";
export const MAX_PLAYERS = 500;

export const ROLES = [
  { value: "Batsman", hi: "बल्लेबाज़" },
  { value: "Bowler", hi: "गेंदबाज़" },
  { value: "All-rounder", hi: "ऑलराउंडर" },
  { value: "Wicket-keeper", hi: "विकेटकीपर" },
] as const;

export const BATTING = [
  { value: "Right-hand", hi: "दाएँ हाथ" },
  { value: "Left-hand", hi: "बाएँ हाथ" },
] as const;

export const BOWLING = [
  "Nahi karta",
  "Right-arm fast",
  "Right-arm medium",
  "Right-arm off-spin",
  "Right-arm leg-spin",
  "Left-arm fast",
  "Left-arm medium",
  "Left-arm orthodox",
  "Left-arm wrist-spin",
] as const;

export const BOWLING_HI: Record<(typeof BOWLING)[number], string> = {
  "Nahi karta": "नहीं करता",
  "Right-arm fast": "राइट-आर्म फास्ट",
  "Right-arm medium": "राइट-आर्म मीडियम",
  "Right-arm off-spin": "राइट-आर्म ऑफ स्पिन",
  "Right-arm leg-spin": "राइट-आर्म लेग स्पिन",
  "Left-arm fast": "लेफ्ट-आर्म फास्ट",
  "Left-arm medium": "लेफ्ट-आर्म मीडियम",
  "Left-arm orthodox": "लेफ्ट-आर्म ऑर्थोडॉक्स",
  "Left-arm wrist-spin": "लेफ्ट-आर्म रिस्ट स्पिन",
};

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
