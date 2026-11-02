import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

export function formatTime(value?: string | null) {
  if (!value) return '—'
  return value.slice(0, 5)
}

export function formatBytes(bytes?: number | null) {
  if (bytes == null || !Number.isFinite(bytes)) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${units[index]}`
}

export function formatCnpj(value?: string | null) {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14) return value
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function toLocalDateTimeParam(date: Date, endOfDay = false) {
  const day = new Date(date)
  day.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${pad(day.getHours())}:${pad(day.getMinutes())}:${pad(day.getSeconds())}`
}

export function dateInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getInitials(name?: string) {
  if (!name) return 'BM'
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value)
}
