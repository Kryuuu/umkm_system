export const MANUAL_ATTENDANCE_CODE_LENGTH = 8;

export function manualCodeFromToken(token: string | null | undefined) {
  if (!token) return "";
  return token.replace(/[^a-zA-Z0-9]/g, "").slice(0, MANUAL_ATTENDANCE_CODE_LENGTH).toUpperCase();
}

export function normalizeAttendanceInput(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function isManualAttendanceCode(value: string) {
  return /^[A-Z0-9]{8}$/.test(value.toUpperCase());
}
