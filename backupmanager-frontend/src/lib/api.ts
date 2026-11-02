import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:8080/api/v1'

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<void> | null = null

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const requestUrl = originalRequest?.url ?? ''
    const isAuthEndpoint = ['/auth/login', '/auth/refresh', '/auth/logout'].some((path) => requestUrl.includes(path))

    if (status !== 401 || !originalRequest || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      window.dispatchEvent(new CustomEvent('backup-manager:session-expired'))
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
          .then(() => undefined)
          .finally(() => { refreshPromise = null })
      }

      await refreshPromise
      return api(originalRequest)
    } catch (refreshError) {
      window.dispatchEvent(new CustomEvent('backup-manager:session-expired'))
      return Promise.reject(refreshError)
    }
  },
)

export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; detail?: string } | undefined
    return data?.message || data?.detail || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}
