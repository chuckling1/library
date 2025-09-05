import { describe, it, expect } from 'vitest';
import { openLibraryService } from './openLibraryService';

// Type-safe access to private methods for testing
interface TestableService {
  convertToBookSuggestion: (book: {
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    publish_date?: string[];
  }) => { publishedDate?: string };
  filterDatesByYear: (dates: string[], year: string) => string[];
  findLongestDate: (dates: string[]) => string;
  parseDate: (dateStr: string) => string | null;
}

const service = openLibraryService as unknown as TestableService;

describe('OpenLibraryService - Smart Date Parsing (TDD)', () => {
  describe('Real A Confederacy of Dunces Data', () => {
    it('should correctly parse the original 1980 publication from real Open Library data', (): void => {
      // Real data from A Confederacy of Dunces Open Library search result
      const realOpenLibraryBook = {
        key: '/works/OL3501723W',
        title: 'A Confederacy of Dunces',
        author_name: ['John Kennedy Toole'],
        first_publish_year: 1980,
        publish_date: [
          'April 2005',
          '1987',
          'May 01, 2013',
          '1998',
          'August 1, 2002',
          '2009',
          '2007',
          '2000',
          '1981',
          '1980',
          'Dec 01, 2015',
          'Oct 29, 2014',
          'Aug 01, 2008',
          '2012',
          '2006 May',
        ],
      };

      const suggestion = service.convertToBookSuggestion(realOpenLibraryBook);

      // Since first_publish_year is 1980, we should get exactly 1980 (the original publication)
      // NOT 1980-01-01 hack, but the actual best date we can find for 1980
      expect(suggestion.publishedDate).toBe('1980'); // We want the actual year, not padded
      expect(suggestion.publishedDate).not.toBe('1980-01-01'); // Reject the hack
    });

    it('should handle messy publish_date array and find the most specific date for target year', (): void => {
      // Simulate a book with better date info for 1980
      const messyDataBook = {
        key: '/works/test',
        title: 'Test Book',
        author_name: ['Test Author'],
        first_publish_year: 1980,
        publish_date: [
          '2015',
          'March 1980',
          '1981',
          'Apr 07, 1981',
          '1980',
          'May 2005',
        ],
      };

      const suggestion = service.convertToBookSuggestion(messyDataBook);

      // Should find "March 1980" as the most specific date matching first_publish_year
      expect(suggestion.publishedDate).toBe('March 1980'); // Keep the original format if it's meaningful
    });

    it('should use the longest/most detailed date string for the target year', (): void => {
      const detailedDataBook = {
        key: '/works/test',
        title: 'Test Book',
        author_name: ['Test Author'],
        first_publish_year: 1981,
        publish_date: ['1980', '1981', 'Apr 07, 1981', '1982', 'April 1981'],
      };

      const suggestion = service.convertToBookSuggestion(detailedDataBook);

      // Should pick "Apr 07, 1981" as it's the longest/most specific for 1981
      expect(suggestion.publishedDate).toBe('Apr 07, 1981');
    });

    it('should fallback gracefully when no year match is found', (): void => {
      const noMatchBook = {
        key: '/works/test',
        title: 'Test Book',
        author_name: ['Test Author'],
        first_publish_year: 1980,
        publish_date: [
          '1975',
          '1985',
          '1990',
          '2000', // No 1980 dates
        ],
      };

      const suggestion = service.convertToBookSuggestion(noMatchBook);

      // Should fallback to first_publish_year when no matching dates found
      expect(suggestion.publishedDate).toBe('1980');
    });
  });

  describe('Smart Date Selection Algorithm', () => {
    it('should filter publish_date array by first_publish_year', (): void => {
      const testDates = ['1979', '1980', 'March 1980', '1981', 'Apr 1980'];
      const filtered = service.filterDatesByYear(testDates, '1980');

      expect(filtered).toEqual(['1980', 'March 1980', 'Apr 1980']);
    });

    it('should find the longest/most detailed date string', (): void => {
      const dates1980 = ['1980', 'March 1980', 'Mar 15, 1980'];
      const longest = service.findLongestDate(dates1980);

      expect(longest).toBe('Mar 15, 1980');
    });

    it('should parse various date formats accurately without conversion', (): void => {
      // Test actual formats found in Open Library - keep original if valid
      expect(service.parseDate('Mar 15, 1980')).toBe('Mar 15, 1980'); // Keep if valid
      expect(service.parseDate('March 1980')).toBe('March 1980'); // Keep month-year
      expect(service.parseDate('1980')).toBe('1980'); // Keep year-only
      expect(service.parseDate('invalid')).toBeNull(); // Reject invalid
    });
  });

  describe('Real World Edge Cases', () => {
    it('should handle the "2006 May" reverse format from real data', (): void => {
      const reverseFormatBook = {
        key: '/works/test',
        title: 'Test Book',
        author_name: ['Test Author'],
        first_publish_year: 2006,
        publish_date: ['2006 May', '2006', '2007'],
      };

      const suggestion = service.convertToBookSuggestion(reverseFormatBook);
      expect(suggestion.publishedDate).toBe('2006 May'); // Should pick the more specific one
    });

    it('should handle multiple detailed dates and pick the first valid one', (): void => {
      const multipleDatesBook = {
        key: '/works/test',
        title: 'Test Book',
        author_name: ['Test Author'],
        first_publish_year: 1981,
        publish_date: ['Apr 07, 1981', 'May 20, 1981', '1981'],
      };

      const suggestion = service.convertToBookSuggestion(multipleDatesBook);
      expect(suggestion.publishedDate).toBe('Apr 07, 1981'); // Should pick first detailed date
    });
  });

  describe('Algorithm Requirements', () => {
    it('should implement the 4-step algorithm correctly', (): void => {
      const testBook = {
        key: '/works/test',
        title: 'Test Book',
        author_name: ['Test Author'],
        first_publish_year: 1980,
        publish_date: [
          'March 2005',
          '1987',
          '1980',
          'March 1980',
          'Apr 15, 1980',
          '1981',
        ],
      };

      // Step 1: Get first_publish_year (1980)
      // Step 2: Filter by year -> ['1980', 'March 1980', 'Apr 15, 1980']
      // Step 3: Find longest -> 'Apr 15, 1980'
      // Step 4: Parse and validate -> 'Apr 15, 1980'

      const suggestion = service.convertToBookSuggestion(testBook);
      expect(suggestion.publishedDate).toBe('Apr 15, 1980');
    });
  });
});
