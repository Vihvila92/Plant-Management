import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_MS = 1000 * 60 * 15;

export interface AuthSession {
  token: string;
  username: string;
  issuedAt: string;
  expiresAt: string;
}

interface StoredSession extends AuthSession {
  expiresAtMs: number;
}

interface LoginAttemptBucket {
  failures: number;
  lockedUntilMs: number;
}

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function verifyScryptHash(password: string, encodedHash: string): boolean {
  const [algorithm, salt, expectedHex] = encodedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !expectedHex) {
    return false;
  }

  const derived = scryptSync(password, salt, 64).toString("hex");
  return secureCompare(derived, expectedHex);
}

export class AuthService {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly attemptBuckets = new Map<string, LoginAttemptBucket>();
  private readonly sessionTtlMs: number;
  private readonly maxAttempts: number;
  private readonly lockoutMs: number;
  private readonly username: string | undefined;
  private readonly password: string | undefined;
  private readonly passwordHash: string | undefined;

  constructor() {
    this.sessionTtlMs = parsePositiveInteger(process.env.PM_SESSION_TTL_MS, DEFAULT_SESSION_TTL_MS);
    this.maxAttempts = parsePositiveInteger(process.env.PM_AUTH_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
    this.lockoutMs = parsePositiveInteger(process.env.PM_AUTH_LOCKOUT_MS, DEFAULT_LOCKOUT_MS);
    this.username = process.env.PM_ADMIN_USERNAME;
    this.password = process.env.PM_ADMIN_PASSWORD;
    this.passwordHash = process.env.PM_ADMIN_PASSWORD_HASH;
  }

  getConfigStatus() {
    return {
      username: this.username ?? null,
      authenticationConfigured: Boolean(this.username && (this.password || this.passwordHash)),
      sessionTtlMs: this.sessionTtlMs
    };
  }

  private getBucket(identifier: string): LoginAttemptBucket {
    const bucket = this.attemptBuckets.get(identifier);

    if (bucket) {
      return bucket;
    }

    const freshBucket: LoginAttemptBucket = {
      failures: 0,
      lockedUntilMs: 0
    };
    this.attemptBuckets.set(identifier, freshBucket);
    return freshBucket;
  }

  private verifyPassword(password: string): boolean {
    if (this.passwordHash) {
      return verifyScryptHash(password, this.passwordHash);
    }

    if (!this.password) {
      return false;
    }

    return secureCompare(password, this.password);
  }

  login(username: string, password: string, identifier: string): AuthSession | { error: "invalid_credentials" | "rate_limited" | "auth_not_configured"; retryAfterSeconds?: number } {
    if (!this.username || (!this.password && !this.passwordHash)) {
      return { error: "auth_not_configured" };
    }

    const now = Date.now();
    const bucket = this.getBucket(identifier);

    if (bucket.lockedUntilMs > now) {
      return {
        error: "rate_limited",
        retryAfterSeconds: Math.ceil((bucket.lockedUntilMs - now) / 1000)
      };
    }

    const validUsername = secureCompare(username, this.username);
    const validPassword = this.verifyPassword(password);

    if (!validUsername || !validPassword) {
      bucket.failures += 1;
      if (bucket.failures >= this.maxAttempts) {
        bucket.failures = 0;
        bucket.lockedUntilMs = now + this.lockoutMs;
        return {
          error: "rate_limited",
          retryAfterSeconds: Math.ceil(this.lockoutMs / 1000)
        };
      }

      return { error: "invalid_credentials" };
    }

    bucket.failures = 0;
    bucket.lockedUntilMs = 0;

    const token = randomBytes(32).toString("hex");
    const issuedAtMs = now;
    const expiresAtMs = issuedAtMs + this.sessionTtlMs;
    const session: StoredSession = {
      token,
      username: this.username,
      issuedAt: new Date(issuedAtMs).toISOString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
      expiresAtMs
    };

    this.sessions.set(token, session);

    return {
      token: session.token,
      username: session.username,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt
    };
  }

  validate(token: string | undefined): AuthSession | undefined {
    if (!token) {
      return undefined;
    }

    const session = this.sessions.get(token);
    if (!session) {
      return undefined;
    }

    if (session.expiresAtMs <= Date.now()) {
      this.sessions.delete(token);
      return undefined;
    }

    return {
      token: session.token,
      username: session.username,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt
    };
  }

  logout(token: string | undefined): void {
    if (token) {
      this.sessions.delete(token);
    }
  }
}
