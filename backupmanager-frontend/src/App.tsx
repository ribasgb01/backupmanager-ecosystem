import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AdminRoute, ProtectedRoute } from './features/auth/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MarketDetailPage } from './pages/MarketDetailPage'
import { MarketsPage } from './pages/MarketsPage'
import { UsersPage } from './pages/UsersPage'

export function App() {
  return (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="markets" element={<MarketsPage />} />
            <Route path="markets/:marketId" element={<MarketDetailPage />} />
            <Route element={<AdminRoute />}>
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
