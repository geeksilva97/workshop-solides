/**
 * Password hashing shared by the auth service and the demo-account seeder:
 * scrypt over a per-user random salt, compared in constant time.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const newSalt = (): string => randomBytes(16).toString("hex");

export const hashPassword = (password: string, salt: string): string =>
  scryptSync(password, salt, 64).toString("hex");

export const passwordMatches = (
  password: string,
  salt: string,
  storedHash: string,
): boolean => {
  const candidate = Buffer.from(hashPassword(password, salt), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
};
