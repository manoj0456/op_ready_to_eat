import { apiClient } from './client'
import { API_ENDPOINTS } from '@/constants/api'
import type { User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  role: 'CUSTOMER' | 'RESTAURANT'
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<{ user: User }>(API_ENDPOINTS.AUTH.LOGIN, payload).then((res) => res.data),

  signup: (payload: SignupPayload) =>
    apiClient.post<{ user: User }>(API_ENDPOINTS.AUTH.SIGNUP, payload).then((res) => res.data),

  logout: () => apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT).then((res) => res.data),

  me: () => apiClient.get<User>(API_ENDPOINTS.AUTH.ME).then((res) => res.data),
}
