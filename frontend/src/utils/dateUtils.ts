/**
 * Utility functions for handling ISO 8601 date format as specified in original challenge.
 * All dates should use the format: "1999-10-30T00:00:00Z"
 */

/**
 * Converts an HTML date input value (YYYY-MM-DD) to ISO 8601 format.
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns ISO 8601 formatted string with Z suffix, or empty string if invalid
 */
export const convertHtmlDateToIso8601 = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // HTML date input always gives us YYYY-MM-DD format
    const date = new Date(`${dateString}T00:00:00Z`);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Return in ISO 8601 format with Z suffix as per original spec
    return date.toISOString();
  } catch {
    return '';
  }
};

/**
 * Converts an ISO 8601 date string to HTML date input format (YYYY-MM-DD).
 * @param iso8601String - ISO 8601 formatted date string
 * @returns Date string in YYYY-MM-DD format for HTML date input
 */
export const convertIso8601ToHtmlDate = (iso8601String: string | undefined | null): string => {
  if (!iso8601String) return '';
  
  try {
    const date = new Date(iso8601String);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Return in YYYY-MM-DD format for HTML date input
    return date.toISOString().split('T')[0] ?? '';
  } catch {
    return '';
  }
};

/**
 * Formats an ISO 8601 date string for display to users.
 * @param iso8601String - ISO 8601 formatted date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string for display
 */
export const formatIso8601ForDisplay = (
  iso8601String: string | undefined | null,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string => {
  if (!iso8601String) return 'Unknown';
  
  try {
    const date = new Date(iso8601String);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString(undefined, options);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Validates that a date string is in valid ISO 8601 format.
 * @param dateString - Date string to validate
 * @returns True if valid ISO 8601 format
 */
export const isValidIso8601 = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    // Check if date is valid and format matches ISO 8601 pattern
    return !isNaN(date.getTime()) && 
           /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(dateString);
  } catch {
    return false;
  }
};

/**
 * Validates that a date is not in the future.
 * @param iso8601String - ISO 8601 formatted date string
 * @returns True if date is not in the future
 */
export const isNotFutureDate = (iso8601String: string): boolean => {
  if (!iso8601String) return false;
  
  try {
    const date = new Date(iso8601String);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return date <= today;
  } catch {
    return false;
  }
};

/**
 * Handles various date formats from external APIs (like OpenLibrary) and converts to ISO 8601.
 * @param dateString - Date string in various formats
 * @returns ISO 8601 formatted string or original string if already valid
 */
export const normalizeToIso8601 = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  
  try {
    // If it's already ISO 8601, return as-is
    if (isValidIso8601(dateString)) {
      return dateString;
    }
    
    let date: Date;
    
    // Handle different date formats from external sources
    if (/^\d{4}$/.test(dateString.trim())) {
      // Just a year (e.g., "1980")
      date = new Date(`${dateString}-01-01T00:00:00Z`);
    } else if (/^\w+\s+\d{4}$/.test(dateString.trim())) {
      // Month year (e.g., "March 1980")
      date = new Date(`${dateString} 1`);
    } else if (/^\d{4}\s+\w+$/.test(dateString.trim())) {
      // Year month (e.g., "1980 May")
      const [year, month] = dateString.trim().split(' ');
      date = new Date(`${month} 1, ${year}`);
    } else if (/^\d{4}-\d{2}$/.test(dateString.trim())) {
      // Year-month (e.g., "2020-05")
      date = new Date(`${dateString}-01T00:00:00Z`);
    } else {
      // Try parsing as-is
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toISOString();
  } catch {
    return '';
  }
};