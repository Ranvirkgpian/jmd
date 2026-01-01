'use server'

import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginAction(formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');

  const result = loginSchema.safeParse({ username, password });

  if (!result.success) {
    return { success: false, message: 'Invalid input', errors: result.error.flatten() };
  }

  const envUsername = process.env.ADMIN_USERNAME;
  const envPassword = process.env.ADMIN_PASSWORD;

  // Check against environment variables if they are set
  if (envUsername && envPassword) {
    if (result.data.username === envUsername && result.data.password === envPassword) {
      return { success: true };
    }
  }

  // Fallback to hardcoded credentials as per user request to ensure 'JMD' access
  // This ensures that even if env vars are missing or different, these specific credentials work.
  const validUsername = 'JMD';
  const validPassword = '311976';

  if (result.data.username === validUsername && result.data.password === validPassword) {
    return { success: true };
  }

  return { success: false, message: 'Invalid credentials' };
}
