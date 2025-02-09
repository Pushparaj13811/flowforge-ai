/**
 * Helper to get absolute API URL
 * Works both server-side and client-side
 */
export function getApiUrl(path: string): string {
  // In browser, use window.location.origin for absolute URL
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  // Server-side: construct full URL from environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${baseUrl}${path}`;
}
