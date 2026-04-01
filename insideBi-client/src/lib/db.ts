// This file is intentionally empty in the browser build.
// All DB access goes through the Spring Boot API (/api/*).
export function getPool(): never {
  throw new Error("Direct DB access is not available in the browser. Use /api/* endpoints.");
}

export async function fetchTableRows(): Promise<Record<string, unknown>[]> {
  return [];
}

export async function fetchTableCount(): Promise<number> {
  return 0;
}
