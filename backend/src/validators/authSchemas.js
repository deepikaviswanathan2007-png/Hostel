const { z } = require('zod');

const emailSchema = z.string().trim().toLowerCase().email('A valid email is required.');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(72, 'Password must be 72 characters or less.')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must include at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character.');

const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

const googleLoginSchema = z.object({
  credential: z.string().min(10, 'Google credential is required.'),
});

const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
});

module.exports = {
  signupSchema,
  loginSchema,
  googleLoginSchema,
  refreshSchema,
  changePasswordSchema,
};
