import { X, LoaderCircle, Search, Inbox } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

export function Button({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn('button', `button-${variant}`, `button-${size}`, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('card', className)}>{children}</section>
}

export function PageHeader({
  eyebrow, title, description, action,
}: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </div>
  )
}

export function Field({
  label, hint, error, children, className,
}: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('field', className)}>
      <label className="field-label">{label}</label>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('input', props.className)} />
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="search-wrap">
      <Search className="search-icon" size={17} />
      <input {...props} className={cn('input search-input', props.className)} />
    </div>
  )
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status ?? 'NONE').toUpperCase()
  const styles: Record<string, string> = {
    SUCCESS: 'status-success', FAILED: 'status-failed', PENDING: 'status-pending', NONE: 'status-neutral',
  }
  const labels: Record<string, string> = {
    SUCCESS: 'Sucesso', FAILED: 'Falhou', PENDING: 'Pendente', NONE: 'Sem backup',
  }
  return <span className={cn('status-badge', styles[key] ?? 'status-neutral')}><span className="status-dot" />{labels[key] ?? status}</span>
}

export function Modal({
  open, onClose, title, description, children, size = 'md',
}: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: 'md' | 'lg' }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className={cn('modal-panel', size === 'lg' && 'modal-panel-lg')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {description ? <p className="modal-description">{description}</p> : null}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="size-5 animate-spin" /><span>{label}</span></div>
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="empty-state"><div className="empty-icon"><Inbox size={22} /></div><strong>{title}</strong>{description ? <span>{description}</span> : null}</div>
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          {Array.from({ length: columns }, (_, column) => <span className="skeleton-line" key={column} />)}
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state"><strong>Não foi possível carregar os dados</strong><span>{message}</span>{onRetry ? <Button variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button> : null}</div>
}
