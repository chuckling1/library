// OpenLibrary API service for book search and covers
// Documentation: https://openlibrary.org/dev/docs/api

import { logger } from '../utils/logger';

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  publish_date?: string[];
  publisher?: string[];
  cover_i?: number;
  edition_count?: number;
  first_publish_year?: number;
  language?: string[];
  subject?: string[];
}

export interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[];
  numFound: number;
  start: number;
}

export interface BookCoverUrls {
  small: string;
  medium: string;
  large: string;
}

class OpenLibraryService {
  private readonly baseUrl = 'https://openlibrary.org';
  private readonly coversUrl = 'https://covers.openlibrary.org/b';

  /**
   * Search for books using the OpenLibrary Search API
   */
  async searchBooks(
    query: string,
    limit = 10
  ): Promise<OpenLibrarySearchResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      fields: '*,availability',
    });

    try {
      const response = await fetch(`${this.baseUrl}/search.json?${params}`);
      if (!response.ok) {
        throw new Error(`OpenLibrary search failed: ${response.statusText}`);
      }
      return (await response.json()) as OpenLibrarySearchResponse;
    } catch (error) {
      logger.error('OpenLibrary search error:', error);
      return { docs: [], numFound: 0, start: 0 };
    }
  }

  /**
   * Get book cover URLs by ISBN
   */
  getCoverUrlsByIsbn(isbn: string): BookCoverUrls {
    return {
      small: `${this.coversUrl}/isbn/${isbn}-S.jpg`,
      medium: `${this.coversUrl}/isbn/${isbn}-M.jpg`,
      large: `${this.coversUrl}/isbn/${isbn}-L.jpg`,
    };
  }

  /**
   * Get book cover URLs by OpenLibrary cover ID
   */
  getCoverUrlsByCoverId(coverId: number): BookCoverUrls {
    return {
      small: `${this.coversUrl}/id/${coverId}-S.jpg`,
      medium: `${this.coversUrl}/id/${coverId}-M.jpg`,
      large: `${this.coversUrl}/id/${coverId}-L.jpg`,
    };
  }

  /**
   * Get book cover URLs by OpenLibrary key
   */
  getCoverUrlsByKey(key: string): BookCoverUrls {
    // Remove '/works/' prefix if present
    const cleanKey = key.replace('/works/', '').replace('/books/', '');
    return {
      small: `${this.coversUrl}/olid/${cleanKey}-S.jpg`,
      medium: `${this.coversUrl}/olid/${cleanKey}-M.jpg`,
      large: `${this.coversUrl}/olid/${cleanKey}-L.jpg`,
    };
  }

  /**
   * Check if a cover image exists by attempting to fetch it
   */
  async checkCoverExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return (
        response.ok &&
        response.headers.get('content-type')?.startsWith('image/') === true
      );
    } catch {
      return false;
    }
  }

  /**
   * Get the best available cover for a book
   */
  async getBestCover(book: {
    isbn?: string;
    openLibraryKey?: string;
    coverId?: number;
  }): Promise<string | null> {
    const sources = [];

    // Try ISBN first (usually most reliable)
    if (book.isbn) {
      const isbnCovers = this.getCoverUrlsByIsbn(book.isbn);
      sources.push(isbnCovers.medium, isbnCovers.small);
    }

    // Try cover ID
    if (book.coverId) {
      const coverIdUrls = this.getCoverUrlsByCoverId(book.coverId);
      sources.push(coverIdUrls.medium, coverIdUrls.small);
    }

    // Try OpenLibrary key
    if (book.openLibraryKey) {
      const keyUrls = this.getCoverUrlsByKey(book.openLibraryKey);
      sources.push(keyUrls.medium, keyUrls.small);
    }

    // Check each source until we find one that works
    for (const url of sources) {
      if (await this.checkCoverExists(url)) {
        return url;
      }
    }

    return null;
  }

  /**
   * Step 2: Filter publish_date array to only entries containing the target year
   * Simple and efficient substring matching (as suggested)
   */
  private filterDatesByYear(
    publishDates: string[],
    targetYear: string
  ): string[] {
    return publishDates.filter(date => date.includes(targetYear));
  }

  /**
   * Step 3: Find the longest (most detailed) date string from filtered array
   */
  private findLongestDate(dateStrings: string[]): string {
    if (dateStrings.length === 0) return '';

    return dateStrings.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
  }

  /**
   * Step 4: Parse and validate the date string, keeping original format if valid
   */
  private parseDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '') return null;

    const trimmed = dateStr.trim();

    // Try to parse with JavaScript Date to validate
    let testDate: Date;

    try {
      // Handle various formats
      if (/^\d{4}$/.test(trimmed)) {
        // Year only: "1980"
        testDate = new Date(`${trimmed}-01-01`);
      } else if (/^\w+\s+\d{4}$/.test(trimmed)) {
        // Month Year: "March 1980"
        testDate = new Date(`${trimmed} 1`);
      } else if (/^\d{4}\s+\w+$/.test(trimmed)) {
        // Year Month: "1980 May"
        const [year, month] = trimmed.split(' ');
        testDate = new Date(`${month} 1, ${year}`);
      } else {
        // Try to parse as-is: "Apr 07, 1981", "May 20, 2015"
        testDate = new Date(trimmed);
      }

      // Validate the parsed date
      if (isNaN(testDate.getTime())) {
        return null;
      }

      // Validate year is reasonable
      const year = testDate.getFullYear();
      const currentYear = new Date().getFullYear();
      if (year < 1400 || year > currentYear + 5) {
        return null;
      }

      // Return original format if valid (this is the key difference!)
      return trimmed;
    } catch {
      return null;
    }
  }

  /**
   * Smart date extraction following the 4-step algorithm:
   * 1. Get first_publish_year
   * 2. Filter publish_date array by year
   * 3. Find longest/most detailed date
   * 4. Parse and validate
   */
  private extractBestPublishDate(olBook: {
    first_publish_year?: number;
    publish_date?: string[];
  }): string | undefined {
    // Step 1: Get first_publish_year
    if (!olBook.first_publish_year) {
      // Fallback: try first date in array if no first_publish_year
      if (olBook.publish_date?.[0]) {
        const parsed = this.parseDate(olBook.publish_date[0]);
        return parsed ?? undefined;
      }
      return undefined;
    }

    const targetYear = olBook.first_publish_year.toString();

    // Step 2: Filter publish_date array by year
    if (!olBook.publish_date || olBook.publish_date.length === 0) {
      // No publish_date array, just return the year
      return targetYear;
    }

    const filteredDates = this.filterDatesByYear(
      olBook.publish_date,
      targetYear
    );

    if (filteredDates.length === 0) {
      // No dates match the target year, fallback to first_publish_year
      return targetYear;
    }

    // Step 3: Find longest/most detailed date
    const longestDate = this.findLongestDate(filteredDates);

    // Step 4: Parse and validate
    const parsedDate = this.parseDate(longestDate);

    // Return parsed date if valid, otherwise fallback to year
    return parsedDate ?? targetYear;
  }

  /**
   * Convert OpenLibrary book to our book format suggestions
   */
  convertToBookSuggestion(olBook: OpenLibraryBook): {
    title: string;
    author: string;
    isbn?: string;
    publishedDate?: string;
    coverUrl?: string;
    subjects?: string[];
  } {
    const isbn = olBook.isbn?.[0];

    // Use the smart 4-step algorithm to extract the best publish date
    const publishDate = this.extractBestPublishDate(olBook);

    return {
      title: olBook.title,
      author: olBook.author_name?.[0] ?? 'Unknown Author',
      isbn,
      publishedDate: publishDate,
      coverUrl: olBook.cover_i
        ? this.getCoverUrlsByCoverId(olBook.cover_i).medium
        : undefined,
      subjects: olBook.subject?.slice(0, 5), // Limit to first 5 subjects as genres
    };
  }

  /**
   * Search for book suggestions based on title and author
   */
  async getBookSuggestions(
    title: string,
    author?: string
  ): Promise<
    Array<{
      title: string;
      author: string;
      isbn?: string;
      publishedDate?: string;
      coverUrl?: string;
      subjects?: string[];
    }>
  > {
    let query = title;
    if (author) {
      query += ` author:${author}`;
    }

    const response = await this.searchBooks(query, 5);
    return response.docs.map(book => this.convertToBookSuggestion(book));
  }
}

export const openLibraryService = new OpenLibraryService();
