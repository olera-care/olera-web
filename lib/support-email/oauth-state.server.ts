import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

interface GmailOAuthState { userId: string; expiresAt: number; nonce: string }

function secret(): string {
  const value = process.env.GMAIL_OAUTH_STATE_SECRET;
  if (!value) throw new Error("GMAIL_OAUTH_STATE_SECRET is not configured");
  return value;
}
export function createGmailOAuthState(userId: string): string {
  const payload: GmailOAuthState = {
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomUUID(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyGmailOAuthState(value: string, userId: string): boolean {
  const [encoded, received] = value.split(".");
  if (!encoded || !received) return false;
  const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as GmailOAuthState;
    return payload.userId === userId && payload.expiresAt >= Date.now();
  } catch {
    return false;
  }
}
