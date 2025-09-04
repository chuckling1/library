import { Book } from '../generated/api';
import { openLibraryService } from '../services/openLibraryService';

/**
 * Generate a fallback book cover with title and author
 */
export function generateFallbackCover(book: Book): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Set canvas size
  canvas.width = 200;
  canvas.height = 300;
  
  // Generate color based on title hash
  const hash = book.title.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = [
    ['#667eea', '#764ba2'], // Purple gradient
    ['#f093fb', '#f5576c'], // Pink gradient
    ['#4facfe', '#00f2fe'], // Blue gradient
    ['#43e97b', '#38f9d7'], // Green gradient
    ['#fa709a', '#fee140'], // Orange gradient
    ['#a8edea', '#fed6e3'], // Mint gradient
  ];
  
  const colorIndex = Math.abs(hash) % colors.length;
  const colorPair = colors[colorIndex]!; // Non-null assertion - colors array has fixed length
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colorPair[0]!);
  gradient.addColorStop(1, colorPair[1]!);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  
  // Setup text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Title
  ctx.font = 'bold 18px Arial';
  const titleLines = wrapText(ctx, book.title || 'Untitled', canvas.width - 20);
  const titleStartY = canvas.height * 0.3;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, titleStartY + (index * 25));
  });
  
  // Author
  ctx.font = '14px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const authorLines = wrapText(ctx, `by ${book.author || 'Unknown Author'}`, canvas.width - 20);
  const authorStartY = canvas.height * 0.7;
  authorLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, authorStartY + (index * 18));
  });
  
  return canvas.toDataURL();
}

/**
 * Wrap text to fit within specified width
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] ?? '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word ?? '';
    }
  }
  lines.push(currentLine);
  
  // Limit to 3 lines for title, 2 for author
  return lines.slice(0, 3);
}

/**
 * Get the best available cover URL for a book
 */
export async function getBookCoverUrl(book: Book): Promise<string> {
  try {
    // Try to get cover from OpenLibrary
    const coverUrl = await openLibraryService.getBestCover({
      isbn: book.isbn ?? undefined,
      coverId: undefined, // We don't store OpenLibrary cover IDs yet
      openLibraryKey: undefined, // We don't store OpenLibrary keys yet
    });
    
    if (coverUrl) {
      return coverUrl;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to fetch cover from OpenLibrary:', error);
  }
  
  // Fallback to generated cover
  return generateFallbackCover(book);
}

/**
 * Create a book cover component that handles loading states
 */
export class BookCoverManager {
  private static cache = new Map<string, string>();
  
  static async getCover(book: Book): Promise<string> {
    const cacheKey = `${book.id}-${book.isbn ?? 'no-isbn'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const coverUrl = await getBookCoverUrl(book);
    this.cache.set(cacheKey, coverUrl);
    return coverUrl;
  }
  
  static clearCache(): void {
    this.cache.clear();
  }
}