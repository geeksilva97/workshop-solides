import { z } from "zod";

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  company: z.string(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const sessionSchema = z.object({
  token: z.string(),
  user: authUserSchema,
});
export type Session = z.infer<typeof sessionSchema>;

export const signInSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa de pelo menos 6 caracteres"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo"),
  email: z.email("E-mail corporativo inválido"),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const resetPasswordSchema = z.object({
  email: z.email("E-mail inválido"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const resetPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
