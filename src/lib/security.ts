import crypto from 'node:crypto';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxAttempts: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxAttempts: number = 5) {
    this.limits = new Map();
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  /**
   * Checks if the action is allowed for the given key.
   * Increments the counter if within the window.
   * Returns true if allowed, false if limit exceeded.
   */
  check(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      this.limits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (now > entry.resetAt) {
      // Window expired, reset
      this.limits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxAttempts) {
      return false;
    }

    entry.count += 1;
    return true;
  }

  getRemainingTime(key: string): number {
      const entry = this.limits.get(key);
      if (!entry || Date.now() > entry.resetAt) return 0;
      return Math.ceil((entry.resetAt - Date.now()) / 1000);
  }

  reset(key: string) {
      this.limits.delete(key);
  }
}

// Global instance for login attempts
export const globalLoginRateLimiter = new RateLimiter();

/**
 * Compares two strings using a timing-safe mechanism.
 * Hashes both inputs to SHA-256 before comparing to ensure equal length.
 */
export function timingSafeCompare(candidate: string, actual: string | undefined): boolean {
  if (!actual) return false;

  try {
    const hash1 = crypto.createHash('sha256').update(candidate).digest();
    const hash2 = crypto.createHash('sha256').update(actual).digest();
    return crypto.timingSafeEqual(hash1, hash2);
  } catch (error) {
    // Fail securely on any crypto error
    console.error('Crypto error in timingSafeCompare', error);
    return false;
  }
}
