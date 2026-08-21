type AttendanceMetrics = {
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
};

function toMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

export function calculateAttendanceMetrics(checkIn?: string, checkOut?: string, shiftTiming = '09:00-18:00'): AttendanceMetrics {
  const [shiftStartText, shiftEndText] = shiftTiming.split('-');
  const shiftStart = toMinutes(shiftStartText ?? '') ?? 540;
  let shiftEnd = toMinutes(shiftEndText ?? '') ?? 1080;
  const inMinutes = checkIn ? toMinutes(checkIn) : null;
  const outMinutes = checkOut ? toMinutes(checkOut) : null;
  if (shiftEnd <= shiftStart) shiftEnd += 1440;
  if (inMinutes === null || outMinutes === null) {
    return { workedMinutes: 0, lateMinutes: inMinutes === null ? 0 : Math.max(0, inMinutes - shiftStart), overtimeMinutes: 0 };
  }
  const normalizedOut = outMinutes < inMinutes ? outMinutes + 1440 : outMinutes;
  const workedMinutes = Math.max(0, normalizedOut - inMinutes);
  return {
    workedMinutes,
    lateMinutes: Math.max(0, inMinutes - shiftStart),
    overtimeMinutes: Math.max(0, normalizedOut - shiftEnd),
  };
}
