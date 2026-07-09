// Parse a date-only string (yyyy-MM-dd) in local time.
// new Date('yyyy-MM-dd') parses as UTC midnight, which displays as the
// previous day in timezones west of UTC.
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
