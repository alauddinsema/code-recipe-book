/**
 * Utility functions for highlighting search terms in text
 */

export interface HighlightMatch {
  text: string;
  isMatch: boolean;
}

/**
 * Highlights search terms in text by splitting it into matched and unmatched segments
 * @param text - The text to search in
 * @param searchTerm - The term to highlight
 * @param caseSensitive - Whether the search should be case sensitive
 * @returns Array of text segments with match indicators
 */
export function highlightSearchTerm(
  text: string, 
  searchTerm: string, 
  caseSensitive: boolean = false
): HighlightMatch[] {
  if (!text || !searchTerm.trim()) {
    return [{ text, isMatch: false }];
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, flags);
  
  const parts = text.split(regex);
  
  return parts.map((part, index) => ({
    text: part,
    isMatch: index % 2 === 1 // Every odd index is a match
  }));
}

/**
 * Highlights multiple search terms in text
 * @param text - The text to search in
 * @param searchTerms - Array of terms to highlight
 * @param caseSensitive - Whether the search should be case sensitive
 * @returns Array of text segments with match indicators
 */
export function highlightMultipleTerms(
  text: string,
  searchTerms: string[],
  caseSensitive: boolean = false
): HighlightMatch[] {
  if (!text || !searchTerms.length) {
    return [{ text, isMatch: false }];
  }

  // Filter out empty terms and escape special regex characters
  const validTerms = searchTerms
    .filter(term => term.trim())
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (!validTerms.length) {
    return [{ text, isMatch: false }];
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const pattern = `(${validTerms.join('|')})`;
  const regex = new RegExp(pattern, flags);
  
  const parts = text.split(regex);
  
  return parts.map((part, index) => ({
    text: part,
    isMatch: index % 2 === 1 && validTerms.some(term => 
      caseSensitive ? part === term : part.toLowerCase() === term.toLowerCase()
    )
  }));
}

/**
 * Creates a text excerpt around the first match of a search term
 * @param text - The full text
 * @param searchTerm - The term to find
 * @param maxLength - Maximum length of the excerpt
 * @param caseSensitive - Whether the search should be case sensitive
 * @returns Excerpt with the search term highlighted
 */
export function createSearchExcerpt(
  text: string,
  searchTerm: string,
  maxLength: number = 150,
  caseSensitive: boolean = false
): string {
  if (!text || !searchTerm.trim()) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchFor = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  const matchIndex = searchText.indexOf(searchFor);
  
  if (matchIndex === -1) {
    // No match found, return truncated text
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Calculate excerpt boundaries
  const halfLength = Math.floor(maxLength / 2);
  const start = Math.max(0, matchIndex - halfLength);
  const end = Math.min(text.length, start + maxLength);
  
  let excerpt = text.substring(start, end);
  
  // Add ellipsis if needed
  if (start > 0) excerpt = '...' + excerpt;
  if (end < text.length) excerpt = excerpt + '...';
  
  return excerpt;
}

/**
 * Extracts search terms from a query string
 * @param query - The search query
 * @returns Array of individual search terms
 */
export function extractSearchTerms(query: string): string[] {
  if (!query.trim()) return [];
  
  // Split by spaces and filter out empty strings
  return query
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);
}

/**
 * Checks if text contains any of the search terms
 * @param text - The text to search in
 * @param searchTerms - Array of terms to look for
 * @param caseSensitive - Whether the search should be case sensitive
 * @returns True if any term is found
 */
export function containsSearchTerms(
  text: string,
  searchTerms: string[],
  caseSensitive: boolean = false
): boolean {
  if (!text || !searchTerms.length) return false;
  
  const searchText = caseSensitive ? text : text.toLowerCase();
  
  return searchTerms.some(term => {
    const searchTerm = caseSensitive ? term : term.toLowerCase();
    return searchText.includes(searchTerm);
  });
}

/**
 * React component props for highlighted text
 */
export interface HighlightedTextProps {
  text: string;
  searchTerm: string;
  caseSensitive?: boolean;
  highlightClassName?: string;
  className?: string;
}

/**
 * Default CSS classes for highlighting
 */
export const DEFAULT_HIGHLIGHT_CLASSES = 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded';
