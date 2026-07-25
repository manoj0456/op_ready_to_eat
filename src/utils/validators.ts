import { z } from 'zod'

export const emailSchema = z.string().trim().min(1, 'Email is required').email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignupFormValues = z.infer<typeof signupSchema>

export const signupFormSchema = signupSchema.and(
  z.object({
    role: z.enum(['CUSTOMER', 'RESTAURANT']),
  }),
)

export type SignupFormFullValues = z.infer<typeof signupFormSchema>

export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone number must be 10 digits')
  .optional()

export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success
}
