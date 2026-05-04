/**
 * Academic Year Week Utilities
 * Week 1 = week starting on the first Monday on/after August 1
 * Week ~52 = last week of July
 */

/** Returns the Monday that starts Week 1 of the academic year containing referenceDate. */
export const getAcademicYearStart = (referenceDate = new Date()) => {
  const year =
    referenceDate.getMonth() >= 7
      ? referenceDate.getFullYear()
      : referenceDate.getFullYear() - 1
  const aug1 = new Date(year, 7, 1)
  const day = aug1.getDay() // 0=Sun … 6=Sat
  const daysToMonday = (8 - day) % 7 // 0 if already Monday
  return new Date(year, 7, 1 + daysToMonday)
}

/** Returns 1-based academic week number for a date. */
export const getAcademicWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  const yearStart = getAcademicYearStart(d)
  const diff = d - yearStart
  if (diff < 0) return 1
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}

/** Returns the Monday (start) of academic week `weekNum`. */
export const getWeekStartForAcademicWeek = (weekNum, referenceDate = new Date()) => {
  const yearStart = getAcademicYearStart(referenceDate)
  const result = new Date(yearStart)
  result.setDate(yearStart.getDate() + (weekNum - 1) * 7)
  return result
}

/** Returns the Sunday (end) of academic week `weekNum`. */
export const getWeekEndForAcademicWeek = (weekNum, referenceDate = new Date()) => {
  const start = getWeekStartForAcademicWeek(weekNum, referenceDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

/** Formats a Date as YYYY-MM-DD. */
export const toDateString = (date) => {
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const fmtShort = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/** Returns a label like "Week 3 (18 Aug – 24 Aug)". */
export const getAcademicWeekLabel = (weekNum, referenceDate = new Date()) => {
  const start = getWeekStartForAcademicWeek(weekNum, referenceDate)
  const end = getWeekEndForAcademicWeek(weekNum, referenceDate)
  return `Week ${weekNum}  (${fmtShort(start)} – ${fmtShort(end)})`
}

/** Returns array of 52 week option objects for the current academic year. */
export const getAcademicWeekOptions = (referenceDate = new Date()) =>
  Array.from({ length: 52 }, (_, i) => {
    const weekNum = i + 1
    const startDate = getWeekStartForAcademicWeek(weekNum, referenceDate)
    const endDate = getWeekEndForAcademicWeek(weekNum, referenceDate)
    return { weekNum, startDate, endDate, label: getAcademicWeekLabel(weekNum, referenceDate) }
  })
