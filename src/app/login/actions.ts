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

  if (!envUsername || !envPassword) {
     console.error("CRITICAL: Admin credentials not set in environment variables.");
     // Fallback to "secure fail" - do not allow login if config is missing
     return { success: false, message: 'System configuration error. Please contact support.' };
  }

  // Secure comparison (ideally constant time, but simple equality for now is better than client-side)
  if (result.data.username === envUsername && result.data.password === envPassword) {
    return { success: true };
  } else {
    return { success: false, message: 'Invalid credentials' };
  }
}
