/**
 * Minimal in-memory auth: scrypt-hashed passwords, opaque session tokens, two
 * seeded demo accounts. Enough to back the sign-in / sign-up / reset screens;
 * not a production identity system.
 */
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type {
  ResetPasswordInput,
  ResetPasswordResponse,
  Session,
  SignInInput,
  SignUpInput,
} from "@workshop/shared";

export class InvalidCredentialsError extends Error {}
export class EmailTakenError extends Error {}

interface Account {
  id: string;
  name: string;
  email: string;
  company: string;
  salt: string;
  hash: string;
}

export interface SeedAccount {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly company: string;
}

export interface AuthServiceDeps {
  readonly seedAccounts?: readonly SeedAccount[];
  readonly idFactory?: () => string;
  readonly tokenFactory?: () => string;
}

export const DEFAULT_ACCOUNTS: readonly SeedAccount[] = [
  { name: "Ana Souza", email: "ana@solides.com", password: "solides123", company: "Solídes" },
  { name: "Bruno Lima", email: "bruno@acme.com", password: "benchmark2026", company: "Acme" },
];

const hashPassword = (password: string, salt: string): string =>
  scryptSync(password, salt, 64).toString("hex");

const passwordMatches = (account: Account, password: string): boolean => {
  const candidate = Buffer.from(hashPassword(password, account.salt), "hex");
  const stored = Buffer.from(account.hash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
};

const companyFromEmail = (email: string): string => {
  const domain = email.split("@")[1] ?? "";
  const name = domain.split(".")[0] ?? "";
  return name.length > 0 ? name.charAt(0).toUpperCase() + name.slice(1) : "Sua empresa";
};

export interface AuthService {
  login(input: SignInInput): Session;
  signup(input: SignUpInput): Session;
  reset(input: ResetPasswordInput): ResetPasswordResponse;
}

export const createAuthService = (deps: AuthServiceDeps = {}): AuthService => {
  const idFactory = deps.idFactory ?? (() => randomUUID());
  const tokenFactory = deps.tokenFactory ?? (() => randomUUID());
  const accounts = new Map<string, Account>();

  const register = (seed: SeedAccount): Account => {
    const salt = randomBytes(16).toString("hex");
    const account: Account = {
      id: idFactory(),
      name: seed.name,
      email: seed.email.toLowerCase(),
      company: seed.company,
      salt,
      hash: hashPassword(seed.password, salt),
    };
    accounts.set(account.email, account);
    return account;
  };

  for (const seed of deps.seedAccounts ?? DEFAULT_ACCOUNTS) register(seed);

  const sessionFor = (account: Account): Session => ({
    token: tokenFactory(),
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      company: account.company,
    },
  });

  return {
    login: (input) => {
      const account = accounts.get(input.email.toLowerCase());
      if (account === undefined || !passwordMatches(account, input.password)) {
        throw new InvalidCredentialsError("E-mail ou senha inválidos");
      }
      return sessionFor(account);
    },
    signup: (input) => {
      const email = input.email.toLowerCase();
      if (accounts.has(email)) {
        throw new EmailTakenError("E-mail já cadastrado");
      }
      const account = register({
        name: input.name,
        email,
        password: input.password,
        company: companyFromEmail(email),
      });
      return sessionFor(account);
    },
    reset: () => ({
      message: "Se o e-mail existir, enviaremos as instruções de redefinição.",
    }),
  };
};
