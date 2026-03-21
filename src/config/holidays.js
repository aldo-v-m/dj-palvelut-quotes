// Finnish public holidays helper
export function isFinnishHoliday(date) {
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()

  const fixedHolidays = [
    [1, 1],   // New Year
    [1, 6],   // Epiphany
    [5, 1],   // Labour Day
    [12, 6],  // Independence Day
    [12, 24], // Christmas Eve
    [12, 25], // Christmas Day
    [12, 26], // Boxing Day
  ]

  return fixedHolidays.some(([m, dy]) => m === month && dy === day)
}

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}
