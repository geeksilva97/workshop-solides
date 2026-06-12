/**
 * Auth service: scrypt-hashed passwords and opaque session tokens, backed by
 * injected repositories. Production wires the Postgres repos (sessions survive
 * restarts and are validated on every protected request); tests fall back to
 * in-memory repos seeded with the demo accounts.
 */
import { randomUUID } from "node:crypto";
import type {
  AuthUser,
  ResetPasswordInput,
  ResetPasswordResponse,
  Session,
  SignInInput,
  SignUpInput,
} from "@workshop/shared";
import { hashPassword, newSalt, passwordMatches } from "./password.ts";
import { createMemoryRepositories } from "./repositories/memory.ts";
import type { SessionRepository, UserRecord, UserRepository } from "./repositories/types.ts";

export class InvalidCredentialsError extends Error {}
export class EmailTakenError extends Error {}

export interface SeedAccount {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly company: string;
}

export interface AuthServiceDeps {
  /** Provide repos (production); omit to get in-memory repos seeded with accounts. */
  readonly users?: UserRepository;
  readonly sessions?: SessionRepository;
  readonly seedAccounts?: readonly SeedAccount[];
  readonly idFactory?: () => string;
  readonly tokenFactory?: () => string;
  readonly sessionTtlMs?: number;
}

export const DEFAULT_ACCOUNTS: readonly SeedAccount[] = [
  { name: "Ana Souza", email: "ana@solides.com", password: "solides123", company: "Solídes" },
  { name: "Bruno Lima", email: "bruno@acme.com", password: "benchmark2026", company: "Acme" },
];

const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const companyFromEmail = (email: string): string => {
  const domain = email.split("@")[1] ?? "";
  const name = domain.split(".")[0] ?? "";
  return name.length > 0 ? name.charAt(0).toUpperCase() + name.slice(1) : "Sua empresa";
};

const accountToUserRecord = (
  account: SeedAccount,
  idFactory: () => string,
): UserRecord => {
  const salt = newSalt();
  return {
    id: idFactory(),
    name: account.name,
    email: account.email.toLowerCase(),
    company: account.company,
    salt,
    hash: hashPassword(account.password, salt),
  };
};

export interface AuthService {
  login(input: SignInInput): Promise<Session>;
  signup(input: SignUpInput): Promise<Session>;
  reset(input: ResetPasswordInput): Promise<ResetPasswordResponse>;
  /** Resolve the user behind a session token (used by the route auth hook). */
  authenticate(token: string): Promise<AuthUser | undefined>;
}

export const createAuthService = (deps: AuthServiceDeps = {}): AuthService => {
  const idFactory = deps.idFactory ?? (() => randomUUID());
  const tokenFactory = deps.tokenFactory ?? (() => randomUUID());
  const ttlMs = deps.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;

  let users = deps.users;
  let sessions = deps.sessions;
  if (users === undefined || sessions === undefined) {
    const seedUsers = (deps.seedAccounts ?? DEFAULT_ACCOUNTS).map((a) =>
      accountToUserRecord(a, idFactory),
    );
    const repos = createMemoryRepositories({ seedUsers });
    users ??= repos.users;
    sessions ??= repos.sessions;
  }
  const userRepo = users;
  const sessionRepo = sessions;

  const startSession = async (user: AuthUser): Promise<Session> => {
    const token = tokenFactory();
    await sessionRepo.create(token, user.id, new Date(Date.now() + ttlMs));
    return { token, user };
  };

  return {
    login: async (input) => {
      const account = await userRepo.findByEmail(input.email);
      if (account === undefined || !passwordMatches(input.password, account.salt, account.hash)) {
        throw new InvalidCredentialsError("E-mail ou senha inválidos");
      }
      return startSession({
        id: account.id,
        name: account.name,
        email: account.email,
        company: account.company,
      });
    },
    signup: async (input) => {
      const email = input.email.toLowerCase();
      if ((await userRepo.findByEmail(email)) !== undefined) {
        throw new EmailTakenError("E-mail já cadastrado");
      }
      const record = accountToUserRecord(
        { name: input.name, email, password: input.password, company: companyFromEmail(email) },
        idFactory,
      );
      await userRepo.insert(record);
      return startSession({
        id: record.id,
        name: record.name,
        email: record.email,
        company: record.company,
      });
    },
    reset: async () => ({
      message: "Se o e-mail existir, enviaremos as instruções de redefinição.",
    }),
    authenticate: (token) => sessionRepo.findValidUser(token),
  };
};
