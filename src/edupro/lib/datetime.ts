/**
 * All schedule times in this LMS are handled in a single fixed zone (IST) so that
 * an admin in any timezone and a student in any timezone always see the exact
 * same wall-clock time that was entered. Nothing is ever re-interpreted with the
 * browser's local zone.
 */
export const APP_TIME_ZONE = 'Asia/Kolkata';
const OFFSET_MINUTES = 5 * 60 + 30; // IST = UTC+05:30, no DST.

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO timestamp -> value for an <input type="datetime-local"> in app time. */
export const toAppInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const d = new Date(t + OFFSET_MINUTES * 60_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

/** <input type="datetime-local"> value (app time) -> ISO timestamp for the database. */
export const appInputToIso = (value: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return new Date(value).toISOString();
  const [, y, mo, da, h, mi] = m;
  const utcMs = Date.UTC(Number(y), Number(mo) - 1, Number(da), Number(h), Number(mi)) - OFFSET_MINUTES * 60_000;
  return new Date(utcMs).toISOString();
};

/** Human readable date + 12-hour AM/PM time, always in app time. */
export const formatAppDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleString('en-IN', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
};

/** Time only, 12-hour AM/PM, app time. */
export const formatAppTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleTimeString('en-IN', {
    timeZone: APP_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const nowAppInput = () => toAppInput(new Date().toISOString());
