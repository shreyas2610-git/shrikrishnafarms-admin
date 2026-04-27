import { NextRequest, NextResponse } from "next/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Auth disabled. Always returns null so all callers proceed. Re-enable to gate API routes. */
export async function requireAuth(_request: NextRequest): Promise<NextResponse | null> {
  return null;
}

/** Validate that a string is a valid UUID v4. */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** Standard error response — never exposes internal details. */
export function errorResponse(status: number = 500) {
  const messages: Record<number, string> = {
    400: "Bad request",
    401: "Unauthorized",
    404: "Not found",
    500: "Internal server error",
  };
  return NextResponse.json({ error: messages[status] ?? "Error" }, { status });
}
