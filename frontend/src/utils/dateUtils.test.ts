import { describe, expect, it } from 'vitest';
import {
  convertHtmlDateToIso8601,
  convertIso8601ToHtmlDate,
  formatIso8601ForDisplay,
  isValidIso8601,
  isNotFutureDate,
  normalizeToIso8601,
} from './dateUtils';

describe('dateUtils', () => {
  describe('convertHtmlDateToIso8601', () => {
    it('converts HTML date to ISO 8601 format', () => {
      expect(convertHtmlDateToIso8601('2023-12-25')).toBe(
        '2023-12-25T00:00:00.000Z'
      );
      expect(convertHtmlDateToIso8601('1999-10-30')).toBe(
        '1999-10-30T00:00:00.000Z'
      );
    });

    it('returns empty string for invalid input', () => {
      expect(convertHtmlDateToIso8601('')).toBe('');
      expect(convertHtmlDateToIso8601('invalid')).toBe('');
      expect(convertHtmlDateToIso8601('2023-13-01')).toBe('');
    });
  });

  describe('convertIso8601ToHtmlDate', () => {
    it('converts ISO 8601 to HTML date format', () => {
      expect(convertIso8601ToHtmlDate('2023-12-25T00:00:00.000Z')).toBe(
        '2023-12-25'
      );
      expect(convertIso8601ToHtmlDate('1999-10-30T00:00:00Z')).toBe(
        '1999-10-30'
      );
      expect(convertIso8601ToHtmlDate('2023-01-01T15:30:45.123Z')).toBe(
        '2023-01-01'
      );
    });

    it('handles null/undefined/empty input', () => {
      expect(convertIso8601ToHtmlDate(null)).toBe('');
      expect(convertIso8601ToHtmlDate(undefined)).toBe('');
      expect(convertIso8601ToHtmlDate('')).toBe('');
    });

    it('returns empty string for invalid ISO 8601', () => {
      expect(convertIso8601ToHtmlDate('invalid')).toBe('');
      expect(convertIso8601ToHtmlDate('2023-25-01')).toBe('');
    });
  });

  describe('formatIso8601ForDisplay', () => {
    it('formats ISO 8601 dates for display', () => {
      const result = formatIso8601ForDisplay('2023-12-25T12:00:00.000Z');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('uses custom formatting options', () => {
      const result = formatIso8601ForDisplay('2023-12-25T00:00:00.000Z', {
        year: 'numeric',
        month: 'short',
      });
      expect(result).toContain('Dec');
      expect(result).toContain('2023');
    });

    it('handles invalid dates', () => {
      expect(formatIso8601ForDisplay('invalid')).toBe('Invalid Date');
      expect(formatIso8601ForDisplay(null)).toBe('Unknown');
      expect(formatIso8601ForDisplay(undefined)).toBe('Unknown');
    });
  });

  describe('isValidIso8601', () => {
    it('validates proper ISO 8601 format', () => {
      expect(isValidIso8601('2023-12-25T00:00:00.000Z')).toBe(true);
      expect(isValidIso8601('1999-10-30T00:00:00Z')).toBe(true);
      expect(isValidIso8601('2023-01-01T15:30:45.123Z')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidIso8601('2023-12-25')).toBe(false); // No time component
      expect(isValidIso8601('invalid')).toBe(false);
      expect(isValidIso8601('')).toBe(false);
      expect(isValidIso8601('2023-25-01T00:00:00Z')).toBe(false); // Invalid month
    });
  });

  describe('isNotFutureDate', () => {
    it('validates dates are not in the future', () => {
      expect(isNotFutureDate('2020-01-01T00:00:00.000Z')).toBe(true);
      expect(isNotFutureDate('1999-10-30T00:00:00Z')).toBe(true);
    });

    it('rejects future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isNotFutureDate(futureDate.toISOString())).toBe(false);
    });

    it("accepts today's date", () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon today
      expect(isNotFutureDate(today.toISOString())).toBe(true);
    });

    it('handles invalid input', () => {
      expect(isNotFutureDate('')).toBe(false);
      expect(isNotFutureDate('invalid')).toBe(false);
    });
  });

  describe('normalizeToIso8601', () => {
    it('passes through valid ISO 8601 dates', () => {
      const iso8601 = '2023-12-25T00:00:00.000Z';
      expect(normalizeToIso8601(iso8601)).toBe(iso8601);
    });

    it('converts year-only format', () => {
      expect(normalizeToIso8601('1980')).toBe('1980-01-01T00:00:00.000Z');
      expect(normalizeToIso8601('2023')).toBe('2023-01-01T00:00:00.000Z');
    });

    it('converts month-year format', () => {
      const result = normalizeToIso8601('March 1980');
      expect(result).toContain('1980');
      expect(result).toMatch(/T\d{2}:\d{2}:\d{2}/); // Has time component
    });

    it('converts year-month format', () => {
      const result = normalizeToIso8601('1980 May');
      expect(result).toContain('1980');
      expect(result).toMatch(/T\d{2}:\d{2}:\d{2}/); // Has time component
    });

    it('converts YYYY-MM format', () => {
      expect(normalizeToIso8601('2020-05')).toBe('2020-05-01T00:00:00.000Z');
    });

    it('handles null/undefined input', () => {
      expect(normalizeToIso8601(null)).toBe('');
      expect(normalizeToIso8601(undefined)).toBe('');
      expect(normalizeToIso8601('')).toBe('');
    });

    it('returns empty string for invalid dates', () => {
      expect(normalizeToIso8601('invalid-date')).toBe('');
      expect(normalizeToIso8601('2023-25-01')).toBe('');
    });
  });
});
