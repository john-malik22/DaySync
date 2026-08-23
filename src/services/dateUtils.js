/**
 * Centralized Date Calculation & Formatting Utility for DaySync Plans & Subscriptions
 * Safe calendar arithmetic with zero timezone shifts and month-end overflow protection.
 */

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Safely parses YYYY-MM-DD string into numeric year, month (1-12), and day components.
 */
export function parseDateComponents(dateStr) {
  if (!dateStr) {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }

  const clean = String(dateStr).trim().split('T')[0];
  const parts = clean.split('-').map(p => parseInt(p, 10));

  if (parts.length === 3 && !parts.some(isNaN) && parts[0] > 1900 && parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }

  // Fallback to JS Date if non-standard format
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
  } catch (e) {}

  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/**
 * Formats numeric year, month (1-12), and day into ISO YYYY-MM-DD string.
 */
export function formatDateComponents(year, month, day) {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses structured durationValue and durationUnit from string or numeric inputs.
 * E.g., "1 month" -> { durationValue: 1, durationUnit: "months" }
 * E.g., "12 months" -> { durationValue: 12, durationUnit: "months" }
 * E.g., "1 year" -> { durationValue: 1, durationUnit: "years" }
 * E.g., "28 days" -> { durationValue: 28, durationUnit: "days" }
 */
export function parseDuration(durationInput, frequencyStr = 'Monthly') {
  if (typeof durationInput === 'object' && durationInput !== null) {
    const val = parseInt(durationInput.durationValue || durationInput.value, 10);
    const unit = String(durationInput.durationUnit || durationInput.unit || 'months').toLowerCase();
    if (!isNaN(val) && val > 0) {
      return { durationValue: val, durationUnit: unit };
    }
  }

  const str = String(durationInput || '').toLowerCase().trim();
  const freqStr = String(frequencyStr || '').toLowerCase().trim();

  // Find the FIRST matching (number + unit) pattern in string order
  const match = str.match(/(\d+)\s*(months?|years?|days?|weeks?)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    let unit = match[2].toLowerCase();
    if (unit.startsWith('year')) unit = 'years';
    else if (unit.startsWith('month')) unit = 'months';
    else if (unit.startsWith('day')) unit = 'days';
    else if (unit.startsWith('week')) unit = 'weeks';
    return { durationValue: val, durationUnit: unit };
  }

  // Pure number case (e.g. 1, 3, 6, 12, 28)
  const numMatch = str.match(/^(\d+)$/);
  if (numMatch) {
    const val = parseInt(numMatch[1], 10);
    if (val === 28 || val === 56 || val === 84 || freqStr.includes('28')) {
      return { durationValue: val, durationUnit: 'days' };
    }
    if (val === 1 || val === 2) {
      if (freqStr.includes('year')) return { durationValue: val, durationUnit: 'years' };
    }
    return { durationValue: val, durationUnit: 'months' };
  }

  // Frequency-based fallback
  if (freqStr.includes('28')) return { durationValue: 28, durationUnit: 'days' };
  if (freqStr.includes('year')) return { durationValue: 1, durationUnit: 'years' };

  return { durationValue: 1, durationUnit: 'months' };
}

/**
 * Performs safe, exact calendar date arithmetic.
 * Handles month-end overflow (Jan 31 + 1 month -> Feb 28/29) and leap years.
 */
export function calculateEndDate(startDateStr, durationInput, frequencyStr = 'Monthly') {
  const comp = parseDateComponents(startDateStr);
  const { durationValue, durationUnit } = parseDuration(durationInput, frequencyStr);

  const startYear = comp.year;
  const startMonth = comp.month;
  const startDay = comp.day;

  if (durationUnit === 'days') {
    const utcDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    utcDate.setUTCDate(utcDate.getUTCDate() + durationValue);
    return formatDateComponents(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate());
  }

  if (durationUnit === 'weeks') {
    const utcDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    utcDate.setUTCDate(utcDate.getUTCDate() + (durationValue * 7));
    return formatDateComponents(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate());
  }

  let totalMonthsToAdd = durationValue;
  if (durationUnit === 'years') {
    totalMonthsToAdd = durationValue * 12;
  }

  const zeroBasedStartMonth = startMonth - 1;
  const totalMonths = zeroBasedStartMonth + totalMonthsToAdd;

  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonthOneBased = (totalMonths % 12 + 12) % 12 + 1;

  // Maximum days in target month
  const maxDaysInTargetMonth = new Date(Date.UTC(targetYear, targetMonthOneBased, 0)).getUTCDate();
  const safeTargetDay = Math.min(startDay, maxDaysInTargetMonth);

  return formatDateComponents(targetYear, targetMonthOneBased, safeTargetDay);
}

/**
 * Formats ISO YYYY-MM-DD string into human-readable date format (e.g. "23 Aug 2027").
 */
export function formatHumanDate(dateStr) {
  if (!dateStr) return 'N/A';
  const comp = parseDateComponents(dateStr);
  if (!comp) return dateStr;
  const monthName = MONTH_NAMES_SHORT[comp.month - 1] || '';
  return `${comp.day} ${monthName} ${comp.year}`;
}
