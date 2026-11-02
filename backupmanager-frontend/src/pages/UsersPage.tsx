import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Trash2, UserPlus, Users, UserRound, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Card, EmptyState, ErrorState, Field, Modal, PageHeader, TableSkeleton, TextInput } from '../components/ui/primitives'
import { api, getApiErrorMessage } from '../lib/api'
import type { UserRecord } from '../lib/types'
import { formatDateTime, getInitials } from '../lib/utils'

const userSchema = z.object({
  username: z.string().trim().min(1, 'Informe um nome de usuário.'),
  password: z.string().min(1, 'Informe uma senha.'),
})
type UserFormValues = z.infer<typeof userSchema>

async function getUsers() {
  const response = await api.get<UserRecord[]>('/users')
  return response.data
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)
  const query = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => api.post('/users/create', values),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso.')
      setCreateOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Não foi possível criar o usuário.')),
  })
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.post('/users/delete', { userId }),
    onSuccess: () => {
      toast.success('Usuário removido.')
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Não foi possível remover o usuário.')),
  })

  return (
    <div className="page-stack">
      <PageHeader eyebrow="CONTROLE DE ACESSO" title="Usuários" description="Gerencie as contas que podem acessar o painel de operação." action={<Button onClick={() => setCreateOpen(true)}><UserPlus size={17} /> Novo usuário</Button>} />
      <div className="users-info-banner"><div className="users-info-icon"><ShieldCheck size={20} /></div><div><strong>Gestão restrita a administradores</strong><span>Novos usuários são cadastrados automaticamente com o perfil de Suporte. Apenas administradores podem gerenciar contas.</span></div></div>
      <Card className="table-card">
        <div className="table-card-header"><div><h2>Contas ativas</h2><p>Usuários que possuem acesso ao Backup Manager.</p></div><div className="users-count"><Users size={16} /> {query.data?.length ?? '—'} contas</div></div>
        {query.isLoading ? <TableSkeleton rows={5} columns={4} /> : query.isError ? <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : !query.data?.length ? <EmptyState title="Nenhum usuário cadastrado" description="Crie uma conta para permitir que a equipe acesse o painel." /> : (
          <div className="table-scroll"><table className="data-table users-data-table"><thead><tr><th>Usuário</th><th>Perfil</th><th>Criado em</th><th>Status</th><th /></tr></thead><tbody>
            {query.data.map((record) => <tr key={record.id}>
              <td><div className="user-name-cell"><span className="avatar user-row-avatar">{getInitials(record.username)}</span><span><strong>{record.username}</strong><small>{record.id}</small></span></div></td>
              <td><span className={`role-badge role-${record.role.toLowerCase()}`}><ShieldCheck size={13} />{record.role === 'ADMIN' ? 'Administrador' : 'Suporte'}</span></td>
              <td className="muted-cell">{formatDateTime(record.createdAt)}</td>
              <td><span className="active-pill active-pill-on"><span />Ativo</span></td>
              <td><Button variant="ghost" size="icon" className="delete-icon-button" title={`Remover ${record.username}`} onClick={() => setDeleteTarget(record)}><Trash2 size={16} /></Button></td>
            </tr>)}
          </tbody></table></div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Criar usuário" description="A nova conta será criada com o perfil de Suporte.">
        <CreateUserForm onSubmit={(values) => createMutation.mutate(values)} submitting={createMutation.isPending} />
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Remover usuário" description="Esta ação remove permanentemente o acesso desta conta.">
        <div className="delete-confirm-body"><div className="delete-confirm-icon"><Trash2 size={21} /></div><p>Tem certeza de que deseja remover o usuário <strong>{deleteTarget?.username}</strong>?</p><span>O usuário deixará de conseguir acessar o painel.</span><div className="form-actions"><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="danger" loading={deleteMutation.isPending} onClick={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id) }}>Remover usuário</Button></div></div>
      </Modal>
    </div>
  )
}

function CreateUserForm({ onSubmit, submitting }: { onSubmit: (values: UserFormValues) => void; submitting: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { username: '', password: '' } })
  return <form className="form-stack" onSubmit={handleSubmit(onSubmit)}>
    <Field label="Nome de usuário" error={errors.username?.message}><div className="input-with-icon"><UserRound size={16} /><TextInput placeholder="Ex.: joao.silva" autoComplete="off" {...register('username')} /></div></Field>
    <Field label="Senha inicial" hint="A senha será armazenada com hash no servidor." error={errors.password?.message}><div className="input-with-icon"><LockKeyhole size={16} /><TextInput type="password" autoComplete="new-password" placeholder="Defina uma senha" {...register('password')} /></div></Field>
    <div className="role-preview"><ShieldCheck size={16} /><span>Perfil atribuído automaticamente:</span><strong>Suporte</strong></div>
    <div className="form-actions"><Button type="submit" loading={submitting}><UserPlus size={16} /> Criar usuário</Button></div>
  </form>
}
