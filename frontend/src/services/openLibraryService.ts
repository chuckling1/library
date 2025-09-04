// OpenLibrary API service for book search and covers
// Documentation: https://openlibrary.org/dev/docs/api

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
  async searchBooks(query: string, limit = 10): Promise<OpenLibrarySearchResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      fields: 'key,title,author_name,isbn,publish_date,publisher,cover_i,edition_count,first_publish_year,language,subject',
    });

    try {
      const response = await fetch(`${this.baseUrl}/search.json?${params}`);
      if (!response.ok) {
        throw new Error(`OpenLibrary search failed: ${response.statusText}`);
      }
      return await response.json() as OpenLibrarySearchResponse;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('OpenLibrary search error:', error);
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
      return response.ok && response.headers.get('content-type')?.startsWith('image/') === true;
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
   * Parse OpenLibrary date string into YYYY-MM-DD format
   */
  private parseOpenLibraryDate(dateStr: string, expectedYear?: string): string | null {
    if (!dateStr) return null;
    
    const trimmed = dateStr.trim();
    
    // If it's already in YYYY-MM-DD format, validate and return
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return trimmed;
      }
    }
    
    // Try to parse various formats using JavaScript Date constructor
    const formats = [
      trimmed, // Original string
      trimmed.replace(/(\d{1,2})(st|nd|rd|th),?\s+(\d{4})/i, '$1, $3'), // "5th, 2020" -> "5, 2020"
      trimmed.replace(/(\w+)\s+(\d{1,2})(st|nd|rd|th),?\s+(\d{4})/i, '$1 $2, $4'), // "Aug 5th, 2020" -> "Aug 5, 2020"
    ];
    
    for (const format of formats) {
      try {
        const date = new Date(format);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear().toString();
          
          // If we have an expected year, make sure it matches
          if (expectedYear && year !== expectedYear) {
            continue;
          }
          
          // Ensure it's a reasonable publication year (1400-current year + 5)
          const currentYear = new Date().getFullYear();
          if (date.getFullYear() < 1400 || date.getFullYear() > currentYear + 5) {
            continue;
          }
          
          // Format as YYYY-MM-DD
          return date.toISOString().split('T')[0] ?? null;
        }
      } catch {
        // Continue to next format
        continue;
      }
    }
    
    // If all parsing failed but we have an expected year, extract month/day if possible
    if (expectedYear) {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december',
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ];
      
      const lowerStr = trimmed.toLowerCase();
      let month = '01';
      let day = '01';
      
      // Find month
      for (let i = 0; i < monthNames.length; i++) {
        if (lowerStr.includes(monthNames[i]!)) {
          month = String((i % 12) + 1).padStart(2, '0');
          break;
        }
      }
      
      // Find day (look for numbers 1-31)
      const dayMatch = trimmed.match(/\b([1-9]|[12]\d|3[01])\b/);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[0]);
        if (dayNum >= 1 && dayNum <= 31) {
          day = String(dayNum).padStart(2, '0');
        }
      }
      
      return `${expectedYear}-${month}-${day}`;
    }
    
    return null;
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
    
    // Parse published date using first_publish_year as anchor
    let publishDate: string | undefined;
    
    if (olBook.first_publish_year) {
      const targetYear = olBook.first_publish_year.toString();
      publishDate = `${targetYear}-01-01`; // Default fallback
      
      // Search through publish_date array for a date matching the first_publish_year
      if (olBook.publish_date && olBook.publish_date.length > 0) {
        for (const dateStr of olBook.publish_date) {
          if (dateStr.includes(targetYear)) {
            // Try to parse this date string more intelligently
            const parsedDate = this.parseOpenLibraryDate(dateStr, targetYear);
            if (parsedDate) {
              publishDate = parsedDate;
              break; // Use first successfully parsed date for the target year
            }
          }
        }
      }
    } else if (olBook.publish_date?.[0]) {
      // Fallback: try to parse the first date if no first_publish_year
      const parsedDate = this.parseOpenLibraryDate(olBook.publish_date[0]);
      if (parsedDate) {
        publishDate = parsedDate;
      }
    }
    
    return {
      title: olBook.title,
      author: olBook.author_name?.[0] ?? 'Unknown Author',
      isbn,
      publishedDate: publishDate,
      coverUrl: olBook.cover_i ? this.getCoverUrlsByCoverId(olBook.cover_i).medium : undefined,
      subjects: olBook.subject?.slice(0, 5), // Limit to first 5 subjects as genres
    };
  }

  /**
   * Search for book suggestions based on title and author
   */
  async getBookSuggestions(title: string, author?: string): Promise<Array<{
    title: string;
    author: string;
    isbn?: string;
    publishedDate?: string;
    coverUrl?: string;
    subjects?: string[];
  }>> {
    let query = title;
    if (author) {
      query += ` author:${author}`;
    }

    const response = await this.searchBooks(query, 5);
    return response.docs.map(book => this.convertToBookSuggestion(book));
  }
}

export const openLibraryService = new OpenLibraryService();