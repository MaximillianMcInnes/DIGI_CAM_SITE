import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function hashSharePassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${digest}`;
}

export function verifySharePassword(password: string, storedHash?: string) {
  if (!storedHash) return true;
  const [salt, digest] = storedHash.split(":");
  if (!salt || !digest) return false;
  const candidate = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  if (candidate.length !== digest.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(digest));
}
