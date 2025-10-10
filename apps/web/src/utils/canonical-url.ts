/**
 * Canonical URL Utility
 * Generates proper canonical URLs for SEO by removing query parameters and hash
 */

const BASE_URL = "https://sounddocs.org";

/**
 * Get the canonical URL for the current page
 * Removes query parameters and hash fragments
 * @returns {string} Canonical URL
 */
export const getCanonicalUrl = (): string => {
  // Get the pathname without query params or hash
  const path = window.location.pathname;

  // Combine base URL with path
  return `${BASE_URL}${path}`;
};

/**
 * Get canonical URL for a specific path
 * @param {string} path - The path (e.g., "/audio" or "/resources/rates")
 * @returns {string} Canonical URL
 */
export const getCanonicalUrlForPath = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${BASE_URL}${normalizedPath}`;
};
