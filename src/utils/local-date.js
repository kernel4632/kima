// Local civil dates only. Never parse YYYY-MM-DD with Date(string) or serialize UTC.
export const pad = (value) => String(value).padStart(2, "0");
export function dateKey(date) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function civilDate(year, month, day = 1) {
  const date = new Date(2000, 0, 1, 12);
  date.setFullYear(year, month, day);
  return date;
}
export function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = civilDate(year, month - 1, day);
  return dateKey(date) === value ? date : null;
}
export function normalizeDate(value) { return parseDate(value) ? value : null; }
export function todayKey() { return dateKey(new Date()); }
export function shiftDay(value, delta) {
  const date = parseDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + delta);
  return dateKey(date);
}
export function shiftMonth(value, delta) {
  const date = parseDate(value);
  if (!date) return value;
  const day = date.getDate();
  const first = civilDate(date.getFullYear(), date.getMonth() + delta);
  const last = civilDate(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return dateKey(civilDate(first.getFullYear(), first.getMonth(), Math.min(day, last)));
}
export function monthKey(value) { return `${value.slice(0, 7)}-01`; }
export function formatDate(value, locale, options) {
  const date = parseDate(value);
  if (!date) return value || "";
  try { return new Intl.DateTimeFormat(locale || "zh-CN", options).format(date); }
  catch { return new Intl.DateTimeFormat("zh-CN", options).format(date); }
}
export function timeMinutes(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;
}
export function normalizeDatetime(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  return parseDate(value.slice(0, 10)) && timeMinutes(value.slice(11)) !== null ? value : null;
}
