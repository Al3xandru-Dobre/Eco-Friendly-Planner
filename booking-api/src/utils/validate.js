const { badRequest } = require('./httpError');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" into a Date at UTC midnight, or returns null if invalid. */
function parseDateOnly(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Reject things like 2025-02-30 that JavaScript silently rolls over.
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

/** Formats a Date as "YYYY-MM-DD" using its UTC components. */
function toDateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function isValidTime(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

/** Whole days between two UTC-midnight dates. */
function daysBetween(start, end) {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function requireDateOnly(value, field) {
  const date = parseDateOnly(value);
  if (!date) throw badRequest(`${field} must be a valid date in YYYY-MM-DD format`, { field });
  return date;
}

function requireTime(value, field) {
  if (!isValidTime(value)) throw badRequest(`${field} must be a time in HH:MM (24h) format`, { field });
  return value;
}

function requireInt(value, field, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, defaultValue } = {}) {
  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw badRequest(`${field} is required`, { field });
  }
  const n = Number(value);
  if (!Number.isInteger(n)) throw badRequest(`${field} must be an integer`, { field });
  if (n < min || n > max) throw badRequest(`${field} must be between ${min} and ${max}`, { field });
  return n;
}

function optionalInt(value, field, opts = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  return requireInt(value, field, opts);
}

function optionalNumber(value, field, { min, max } = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) throw badRequest(`${field} must be a number`, { field });
  if (min !== undefined && n < min) throw badRequest(`${field} must be at least ${min}`, { field });
  if (max !== undefined && n > max) throw badRequest(`${field} must be at most ${max}`, { field });
  return n;
}

function requireString(value, field, { maxLength = 500 } = {}) {
  if (typeof value !== 'string' || value.trim() === '') throw badRequest(`${field} is required`, { field });
  if (value.length > maxLength) throw badRequest(`${field} must be at most ${maxLength} characters`, { field });
  return value.trim();
}

function optionalString(value, field, opts = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  return requireString(value, field, opts);
}

/** Accepts "A,B" or ["A","B"], returns an upper-cased array (or undefined). */
function csvList(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const list = raw.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
  return list.length ? list : undefined;
}

function oneOf(value, field, allowed, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (!allowed.includes(value)) throw badRequest(`${field} must be one of: ${allowed.join(', ')}`, { field });
  return value;
}

module.exports = {
  parseDateOnly,
  toDateOnly,
  isValidTime,
  daysBetween,
  requireDateOnly,
  requireTime,
  requireInt,
  optionalInt,
  optionalNumber,
  requireString,
  optionalString,
  csvList,
  oneOf,
  MS_PER_DAY,
};
