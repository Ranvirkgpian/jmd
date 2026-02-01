import { RateLimiter, timingSafeCompare } from '../src/lib/security';
import assert from 'node:assert';

async function runTests() {
  console.log('🛡️ Running Security Lib Verification...');

  // Test 1: Timing Safe Compare
  console.log('Test 1: timingSafeCompare');
  try {
    assert.strictEqual(timingSafeCompare('password123', 'password123'), true, 'Should return true for matching strings');
    assert.strictEqual(timingSafeCompare('password123', 'password124'), false, 'Should return false for non-matching strings');
    assert.strictEqual(timingSafeCompare('password123', undefined), false, 'Should return false for undefined secret');
    assert.strictEqual(timingSafeCompare('short', 'longpassword'), false, 'Should return false for different lengths');
    console.log('✅ timingSafeCompare passed');
  } catch (e) {
    console.error('❌ timingSafeCompare failed:', e);
    process.exit(1);
  }

  // Test 2: Rate Limiter
  console.log('Test 2: RateLimiter');
  const limiter = new RateLimiter(1000, 3); // 1 second window, 3 attempts
  const ip = '127.0.0.1';

  try {
    assert.strictEqual(limiter.check(ip), true, 'Attempt 1 should be allowed');
    assert.strictEqual(limiter.check(ip), true, 'Attempt 2 should be allowed');
    assert.strictEqual(limiter.check(ip), true, 'Attempt 3 should be allowed');
    assert.strictEqual(limiter.check(ip), false, 'Attempt 4 should be blocked');

    console.log('Waiting for window expiry (1.1s)...');
    await new Promise(resolve => setTimeout(resolve, 1100));

    assert.strictEqual(limiter.check(ip), true, 'Attempt after window expiry should be allowed');
    console.log('✅ RateLimiter passed');
  } catch (e) {
    console.error('❌ RateLimiter failed:', e);
    process.exit(1);
  }
}

runTests();
