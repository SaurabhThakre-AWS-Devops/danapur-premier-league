const when = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return when.format(date);
}

export function formatMobile(mobile: string) {
  if (mobile.length !== 10) return mobile;
  return `${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

export function maskTail(value: string, keep = 4) {
  const tail = value.slice(-keep);
  return `•••• ${tail}`;
}
