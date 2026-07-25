import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/constants/api'
import { STORAGE_KEYS } from '@/utils/constants'
import type { ApiError } from '@/types'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type ApiErrorListener = (error: ApiError) => void

let errorListener: ApiErrorListener | null = null

export function setApiErrorListener(listener: ApiErrorListener | null): void {
  errorListener = listener
}

let unauthorizedListener: (() => void) | null = null

export function setUnauthorizedListener(listener: (() => void) | null): void {
  unauthorizedListener = listener
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const statusCode = error.response?.status
    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
      code: error.response?.data?.code,
      statusCode,
    }

    if (statusCode === 401) {
      unauthorizedListener?.()
    }

    errorListener?.(apiError)
    return Promise.reject(apiError)
  },
)
