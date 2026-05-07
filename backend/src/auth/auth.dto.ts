import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain digit'),
  timezone: z.string().default('UTC'),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
});

export type LoginDtoType = z.infer<typeof LoginDto>;

export const AuthResponseDto = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(['STUDENT', 'ADMIN']),
  accessToken: z.string(),
});

export type AuthResponseDtoType = z.infer<typeof AuthResponseDto>;
