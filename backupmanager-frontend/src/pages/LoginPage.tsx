import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, ArrowRight, DatabaseBackup, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../features/auth/AuthContext'
import { getApiErrorMessage } from '../lib/api'
import { Button, Field, TextInput } from '../components/ui/primitives'

const loginSchema = z.object({
  username: z.string().min(1, 'Informe seu usuário.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  if (isLoading) return <div className="auth-loading"><span className="loading-state">Verificando sua sessão...</span></div>
  if (user) return <Navigate to="/" replace />

  async function onSubmit(values: LoginValues) {
    setServerError('')
    try {
      await login(values.username, values.password)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Usuário ou senha incorretos.'))
    }
  }

  return (
    <div className="login-layout">
      <div className="login-visual">
        <div className="login-visual-grid" />
        <div className="login-visual-content">
          <div className="login-brand"><div className="brand-mark brand-mark-large"><DatabaseBackup size={25} /></div><span>backup<span>manager</span></span></div>
          <div className="login-hero-copy">
            <div className="login-kicker"><Sparkles size={14} /> CONTROLE INTELIGENTE DE BACKUPS</div>
            <h1>Seus dados.<br /><span>Sempre protegidos.</span></h1>
            <p>Visibilidade e controle sobre a rotina de backup de todos os seus mercados, em um único lugar.</p>
          </div>
          <div className="login-visual-bottom">
            <div className="login-metric"><div className="login-metric-icon"><ShieldCheck size={17} /></div><div><strong>Proteção contínua</strong><span>Integridade e disponibilidade</span></div></div>
            <div className="login-metric"><div className="login-metric-icon"><Activity size={17} /></div><div><strong>Monitoramento centralizado</strong><span>Um panorama da operação</span></div></div>
          </div>
          <div className="login-orbit login-orbit-one" /><div className="login-orbit login-orbit-two" />
        </div>
        <div className="login-visual-footer"><span>BACKUP MANAGER</span><span>PLATAFORMA DE GESTÃO</span></div>
      </div>
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-mobile-brand"><div className="brand-mark"><DatabaseBackup size={21} /></div><span>backup<span>manager</span></span></div>
          <div className="login-form-heading"><span className="form-overline">BEM-VINDO DE VOLTA</span><h2>Acesse sua conta</h2><p>Entre com suas credenciais para continuar.</p></div>
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <Field label="Usuário" error={errors.username?.message}>
              <div className="input-with-icon"><UserRound size={17} /><TextInput autoComplete="username" placeholder="Seu usuário" {...register('username')} /></div>
            </Field>
            <Field label="Senha" error={errors.password?.message}>
              <div className="input-with-icon"><LockKeyhole size={17} /><TextInput type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" {...register('password')} /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </Field>
            {serverError ? <div className="form-alert"><span>{serverError}</span></div> : null}
            <Button type="submit" size="lg" className="login-submit" loading={isSubmitting}>Entrar na plataforma <ArrowRight size={17} /></Button>
          </form>
          <div className="login-security-note"><ShieldCheck size={16} /><span>Sessão protegida por autenticação e cookies HttpOnly.</span></div>
          <div className="login-form-footer">Acesso restrito a usuários autorizados.</div>
        </div>
      </div>
    </div>
  )
}
