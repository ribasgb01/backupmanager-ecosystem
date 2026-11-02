import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity, ArrowUpRight, Building2, ChevronDown, CircleHelp, LayoutDashboard,
  LogOut, ShieldCheck, Users, DatabaseBackup, PanelLeftClose,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'
import { getInitials } from '../../lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' nav-link-active' : ''}`

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    try { await logout() } catch { /* A API também limpa os cookies quando o logout falha. */ }
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <>
      <div className="brand-lockup">
        <div className="brand-mark"><DatabaseBackup size={21} strokeWidth={2.2} /></div>
        <div><span className="brand-name">backup<span>manager</span></span><span className="brand-subtitle">CONTROL CENTER</span></div>
      </div>
      <div className="workspace-chip"><span className="workspace-dot" /><span>Ambiente de produção</span><ChevronDown size={14} /></div>
      <div className="nav-group-label">WORKSPACE</div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}><LayoutDashboard size={18} /> Visão geral</NavLink>
        <NavLink to="/markets" className={navLinkClass} onClick={() => setMobileOpen(false)}><Building2 size={18} /> Mercados</NavLink>
        {user?.role === 'ADMIN' ? <NavLink to="/users" className={navLinkClass} onClick={() => setMobileOpen(false)}><Users size={18} /> Usuários</NavLink> : null}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-status"><span className="status-live-dot" /><div><strong>Sessão autenticada</strong><span>Controle de acesso ativo</span></div><Activity size={16} /></div>
        <div className="sidebar-help"><div className="help-icon"><CircleHelp size={17} /></div><div><strong>Precisa de ajuda?</strong><span>Consulte o suporte técnico</span></div><ArrowUpRight size={14} /></div>
        <div className="sidebar-footer">BACKUP MANAGER <span>v1.0</span></div>
      </div>
    </>
  )

  return (
    <div className="app-layout">
      <aside className="desktop-sidebar">{sidebar}</aside>
      {mobileOpen ? <div className="mobile-sidebar-backdrop" onClick={() => setMobileOpen(false)}><aside className="mobile-sidebar" onClick={(event) => event.stopPropagation()}>{sidebar}</aside></div> : null}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><PanelLeftClose size={19} /></button>
            <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>Backup Manager</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-date"><span className="topbar-date-dot" /> Operação monitorada</div>
            <div className="profile-wrap">
              <button className="profile-trigger" onClick={() => setProfileOpen((value) => !value)}>
                <span className="avatar">{getInitials(user?.username)}</span>
                <span className="profile-info"><strong>{user?.username ?? 'Usuário'}</strong><small>{user?.role === 'ADMIN' ? 'Administrador' : 'Suporte'}</small></span>
                <ChevronDown size={15} />
              </button>
              {profileOpen ? <>
                <button className="profile-dismiss" aria-label="Fechar menu do usuário" onClick={() => setProfileOpen(false)} />
                <div className="profile-menu">
                  <div className="profile-menu-user"><span className="avatar avatar-large">{getInitials(user?.username)}</span><div><strong>{user?.username}</strong><small>{user?.role === 'ADMIN' ? 'Administrador' : 'Suporte técnico'}</small></div></div>
                  <div className="profile-menu-divider" />
                  <div className="profile-menu-role"><ShieldCheck size={15} /> Acesso {user?.role === 'ADMIN' ? 'administrativo' : 'de suporte'}</div>
                  <button className="profile-menu-logout" onClick={() => { setProfileOpen(false); void handleLogout() }}><LogOut size={16} /> Sair da conta</button>
                </div>
              </> : null}
            </div>
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
        <footer className="app-footer"><span>© {new Date().getFullYear()} Backup Manager</span><span>Protegendo a continuidade da operação.</span></footer>
      </div>
    </div>
  )
}
