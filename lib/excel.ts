import ExcelJS from "exceljs";
import { DEADLINE_LABEL, FEE_RUPEES, LEAGUE, OWNER_EMAIL, PAYEE_NAME, SEASON } from "@/lib/constants";
import { formatMobile, formatWhen } from "@/lib/format";
import type { Player } from "@/lib/types";

function excelSafe(value: string | number) {
  const text = String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export async function buildWorkbook(players: Player[]) {
  const ordered = [...players].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const workbook = new ExcelJS.Workbook();
  workbook.creator = LEAGUE;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Players", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Kr.", key: "n", width: 6 },
    { header: "Registration No.", key: "id", width: 18 },
    { header: "Khilaadi ka naam", key: "name", width: 28 },
    { header: "Mobile", key: "mobile", width: 16 },
    { header: "Umar", key: "age", width: 8 },
    { header: "Mohalla / Area", key: "area", width: 22 },
    { header: "Role", key: "role", width: 16 },
    { header: "Batting", key: "batting", width: 14 },
    { header: "Bowling", key: "bowling", width: 22 },
    { header: "Jersey", key: "jersey", width: 10 },
    { header: "UTR", key: "utr", width: 24 },
    { header: "Payment", key: "payment", width: 14 },
    { header: "Registered at (IST)", key: "when", width: 24 },
  ];

  ordered.forEach((player, index) => {
    sheet.addRow({
      n: index + 1,
      id: excelSafe(player.id),
      name: excelSafe(player.name),
      mobile: excelSafe(formatMobile(player.mobile)),
      age: player.age,
      area: excelSafe(player.area),
      role: excelSafe(player.role),
      batting: excelSafe(player.batting),
      bowling: excelSafe(player.bowling),
      jersey: excelSafe(player.jersey),
      utr: excelSafe(player.utr),
      payment: player.paymentStatus === "verified" ? "Verified" : "Pending",
      when: formatWhen(player.createdAt),
    });
  });

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFF6F1E4" }, name: "Calibri", size: 12 };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E4D34" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  sheet.autoFilter = { from: "A1", to: "M1" };
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0D3B0" } },
        left: { style: "thin", color: { argb: "FFE0D3B0" } },
        bottom: { style: "thin", color: { argb: "FFE0D3B0" } },
        right: { style: "thin", color: { argb: "FFE0D3B0" } },
      };
    });
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F4EA" } };
    }
  });

  const verified = ordered.filter((player) => player.paymentStatus === "verified").length;
  const pending = ordered.length - verified;
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Cheez", key: "label", width: 36 },
    { header: "Value", key: "value", width: 42 },
  ];
  const rows: Array<[string, string | number]> = [
    ["League", `${LEAGUE} ${SEASON}`],
    ["Organiser", PAYEE_NAME],
    ["Organiser email", OWNER_EMAIL],
    ["Entry fee", `Rs ${FEE_RUPEES}`],
    ["Last date", DEADLINE_LABEL],
    ["Total registered", ordered.length],
    ["Payment verified", verified],
    ["Payment pending", pending],
    ["Verified collection (Rs)", verified * FEE_RUPEES],
    ["Pending collection (Rs)", pending * FEE_RUPEES],
    ["Excel banne ka time (IST)", formatWhen(new Date().toISOString())],
  ];
  rows.forEach(([label, value]) => summary.addRow({ label, value: excelSafe(value) }));
  summary.getRow(1).font = { bold: true, color: { argb: "FFF6F1E4" } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E4D34" } };

  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}

export function playersToTsv(players: Player[]) {
  const ordered = [...players].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const header = [
    "Kr.",
    "Registration No.",
    "Name",
    "Mobile",
    "Age",
    "Area",
    "Role",
    "Batting",
    "Bowling",
    "Jersey",
    "UTR",
    "Payment",
    "Registered at (IST)",
  ].join("\t");
  const lines = ordered.map((player, index) =>
    [
      index + 1,
      player.id,
      player.name.replace(/\t/g, " "),
      player.mobile,
      player.age,
      player.area.replace(/\t/g, " "),
      player.role,
      player.batting,
      player.bowling,
      player.jersey,
      player.utr,
      player.paymentStatus,
      formatWhen(player.createdAt),
    ].join("\t"),
  );
  return [header, ...lines].join("\n");
}
