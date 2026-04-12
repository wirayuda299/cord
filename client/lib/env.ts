/**
 * Public URLs readable on server and client. Use NEXT_PUBLIC_* in .env.local.
 */
export function getPublicApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}

export function getPublicWsUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
}
