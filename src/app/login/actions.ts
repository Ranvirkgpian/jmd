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

  if (result.data.username === "JMD" && result.data.password === "311976") {
    return { success: true };
  } else {
    return { success: false, message: 'Invalid credentials' };
  }
}
