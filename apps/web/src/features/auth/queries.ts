import { useMutation } from '@tanstack/react-query'
import {
  resetPasswordResponseSchema,
  sessionSchema,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from '@workshop/shared'
import { api } from '../../lib/apiClient'

export function useLogin() {
  return useMutation({
    mutationFn: (input: SignInInput) =>
      api.post('/api/auth/login', sessionSchema, input),
  })
}

export function useSignup() {
  return useMutation({
    mutationFn: (input: SignUpInput) =>
      api.post('/api/auth/signup', sessionSchema, input),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      api.post('/api/auth/reset', resetPasswordResponseSchema, input),
  })
}
