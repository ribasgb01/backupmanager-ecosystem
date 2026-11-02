export type UserRole = 'ADMIN' | 'SUPPORT'
export type BackupStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export interface CurrentUser {
  id: string
  username: string
  role: UserRole
  createdAt: number
}

export interface DashboardSummary {
  activeMarkets: number
  totalBackups: number
  successfulBackups: number
  failedBackups: number
  pendingBackups: number
}

export interface LastBackup {
  id: string
  createdAt: string
  completedAt: string | null
  status: BackupStatus | string
  fileSizeBytes: number | null
}

export interface MarketOverview {
  marketId: string
  marketName: string
  cnpj: string
  expectedBackupTime: string
  lastBackup: LastBackup | null
}

export interface Market {
  id: string
  name: string
  cnpj: string
  apiKey: string
  expectedBackupTime: string
  active: boolean
}

export interface CreateMarketPayload {
  name: string
  cnpj: string
  expectedBackupTime: string
}

export interface BackupHistory {
  id: string
  marketId: string
  marketName: string
  createdAt: string
  completedAt: string | null
  fileSizeBytes: number | null
  status: BackupStatus
  errorMessage: string | null
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export interface UserRecord {
  id: string
  username: string
  role: UserRole
  active: boolean
  createdAt: string
}

export interface ApiErrorBody {
  message?: string
  detail?: string
  error?: string
}
