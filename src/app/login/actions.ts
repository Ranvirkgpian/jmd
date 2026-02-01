'use server'

import { z } from 'zod';
import { headers } from 'next/headers';
import { globalLoginRateLimiter, timingSafeCompare } from '@/lib/security';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginAction(formData: FormData) {
  // Sentinel 🛡️: Added artificial delay to mitigate timing attacks
  await new Promise(resolve => setTimeout(resolve, 500));

  const username = formData.get('username');
  const password = formData.get('password');

  // Sentinel 🛡️: Server-side rate limiting
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';

  if (!globalLoginRateLimiter.check(ip)) {
     return { success: false, message: 'Too many login attempts. Please try again later.' };
  }

  const result = loginSchema.safeParse({ username, password });

  if (!result.success) {
    return { success: false, message: 'Invalid input', errors: result.error.flatten() };
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Sentinel 🛡️: Use timing-safe comparison to prevent side-channel attacks
  // timingSafeCompare handles undefined admin credentials safely (returns false)
  const isUsernameValid = timingSafeCompare(result.data.username, adminUsername);
  const isPasswordValid = timingSafeCompare(result.data.password, adminPassword);

  if (isUsernameValid && isPasswordValid) {
    return { success: true };
  } else {
    return { success: false, message: 'Invalid credentials' };
  }
}
