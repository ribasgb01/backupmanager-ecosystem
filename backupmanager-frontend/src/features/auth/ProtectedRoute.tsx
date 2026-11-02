import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LoadingState } from '../../components/ui/primitives'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="auth-loading"><LoadingState label="Verificando sua sessão..." /></div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function AdminRoute() {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}
