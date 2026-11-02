import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Check, Clock3, Copy, Plus, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Card, EmptyState, ErrorState, Field, Modal, PageHeader, SearchInput, StatusBadge, TableSkeleton, TextInput } from '../components/ui/primitives'
import { api, getApiErrorMessage } from '../lib/api'
import type { Market, MarketOverview } from '../lib/types'
import { copyToClipboard, formatCnpj, formatDateTime, formatTime } from '../lib/utils'

const marketSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do mercado.'),
  cnpj: z.string().refine((value) => value.replace(/\D/g, '').length === 14, 'Informe um CNPJ com 14 dígitos.'),
  expectedBackupTime: z.string().min(1, 'Informe o horário esperado.'),
})
type MarketFormValues = z.infer<typeof marketSchema>

async function getMarkets() {
  const response = await api.get<MarketOverview[]>('/markets/overview')
  return response.data
}

async function createMarket(payload: MarketFormValues) {
  const response = await api.post<Market>('/markets/create', {
    name: payload.name,
    cnpj: payload.cnpj.replace(/\D/g, ''),
    expectedBackupTime: payload.expectedBackupTime,
  })
  return response.data
}

export function MarketsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [createdMarket, setCreatedMarket] = useState<Market | null>(null)
  const query = useQuery({ queryKey: ['market-overview'], queryFn: getMarkets })
  const mutation = useMutation({
    mutationFn: createMarket,
    onSuccess: (market) => {
      setCreatedMarket(market)
      void queryClient.invalidateQueries({ queryKey: ['market-overview'] })
      void queryClient.invalidateQueries({ queryKey: ['markets'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      toast.success('Mercado cadastrado com sucesso.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Não foi possível cadastrar o mercado.')),
  })

  const filteredMarkets = useMemo(() => (query.data ?? []).filter((market) => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    const digits = term.replace(/\D/g, '')
    const nameMatches = market.marketName.toLocaleLowerCase('pt-BR').includes(term)
    const cnpjMatches = digits.length > 0 && market.cnpj.replace(/\D/g, '').includes(digits)
    return !term || nameMatches || cnpjMatches
  }), [query.data, search])

  function openCreateModal() {
    setCreatedMarket(null)
    setModalOpen(true)
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="CADASTRO E ACOMPANHAMENTO" title="Mercados" description="Gerencie os estabelecimentos conectados e acompanhe a última execução de backup." action={<Button onClick={openCreateModal}><Plus size={17} /> Novo mercado</Button>} />

      <div className="market-overview-strip">
        <div className="overview-strip-icon"><Store size={20} /></div>
        <div><strong>{query.data?.length ?? '—'} mercados ativos</strong><span>Visão consolidada dos estabelecimentos com monitoramento habilitado.</span></div>
        <div className="overview-strip-note"><span className="status-live-dot" /> Atualizado ao consultar</div>
      </div>

      <Card className="table-card">
        <div className="table-card-header market-table-header">
          <div><h2>Mercados ativos</h2><p>Selecione um mercado para consultar os detalhes e o histórico de backups.</p></div>
          <div className="market-table-tools"><SearchInput placeholder="Buscar por nome ou CNPJ..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        </div>
        {query.isLoading ? <TableSkeleton rows={6} columns={5} /> : query.isError ? <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : filteredMarkets.length === 0 ? <EmptyState title={search ? 'Nenhum resultado encontrado' : 'Nenhum mercado cadastrado'} description={search ? 'Tente buscar com outro nome ou CNPJ.' : 'Cadastre seu primeiro mercado para começar a acompanhar os backups.'} /> : (
          <div className="table-scroll"><table className="data-table markets-data-table"><thead><tr><th>Mercado</th><th>CNPJ</th><th>Backup esperado</th><th>Última execução</th><th>Status</th><th /></tr></thead><tbody>
            {filteredMarkets.map((market) => <tr key={market.marketId}>
              <td><Link className="market-name-cell" to={`/markets/${market.marketId}`}><span className="market-row-avatar">{market.marketName.trim().charAt(0).toUpperCase()}</span><span><strong>{market.marketName}</strong><small>Detalhes do estabelecimento</small></span></Link></td>
              <td className="muted-cell">{formatCnpj(market.cnpj)}</td>
              <td><span className="time-cell"><Clock3 size={14} /> {formatTime(market.expectedBackupTime)}</span></td>
              <td><div className="date-cell"><strong>{market.lastBackup ? formatDateTime(market.lastBackup.createdAt) : 'Ainda não executado'}</strong>{market.lastBackup?.fileSizeBytes != null ? <small>{(market.lastBackup.fileSizeBytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB</small> : null}</div></td>
              <td><StatusBadge status={market.lastBackup?.status} /></td>
              <td><Link to={`/markets/${market.marketId}`} className="table-arrow-link" aria-label={`Ver ${market.marketName}`}><ArrowUpRight size={16} /></Link></td>
            </tr>)}
          </tbody></table></div>
        )}
        {!query.isLoading && !query.isError && filteredMarkets.length > 0 ? <div className="table-card-footer">{filteredMarkets.length} {filteredMarkets.length === 1 ? 'mercado encontrado' : 'mercados encontrados'}</div> : null}
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setCreatedMarket(null) }} title={createdMarket ? 'Mercado cadastrado' : 'Cadastrar novo mercado'} description={createdMarket ? 'O estabelecimento já está disponível no monitoramento.' : 'Informe os dados básicos do estabelecimento e o horário previsto do backup.'}>
        {createdMarket ? <div className="created-market-success">
          <div className="success-check"><Check size={24} /></div>
          <h3>{createdMarket.name}</h3>
          <p>Cadastro concluído. Guarde a API Key abaixo e configure o agente de backup deste mercado.</p>
          <div className="api-key-box"><div><span>API KEY DO MERCADO</span><code>{createdMarket.apiKey}</code></div><Button size="icon" variant="outline" onClick={() => void copyToClipboard(createdMarket.apiKey).then(() => toast.success('API Key copiada.')).catch(() => toast.error('Não foi possível copiar a chave.'))} title="Copiar API Key"><Copy size={16} /></Button></div>
          <div className="form-actions"><Button variant="outline" onClick={() => { setModalOpen(false); setCreatedMarket(null) }}>Fechar</Button><Button onClick={() => { setModalOpen(false); setCreatedMarket(null); navigate(`/markets/${createdMarket.id}`) }}>Ver mercado <ArrowUpRight size={16} /></Button></div>
        </div> : <CreateMarketForm onSubmit={(values) => mutation.mutate(values)} submitting={mutation.isPending} />}
      </Modal>
    </div>
  )
}

function CreateMarketForm({ onSubmit, submitting }: { onSubmit: (values: MarketFormValues) => void; submitting: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<MarketFormValues>({
    resolver: zodResolver(marketSchema),
    defaultValues: { name: '', cnpj: '', expectedBackupTime: '23:00' },
  })
  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Nome do mercado" error={errors.name?.message}><TextInput placeholder="Ex.: Mercado Central" {...register('name')} /></Field>
      <Field label="CNPJ" hint="Digite os 14 números do documento." error={errors.cnpj?.message}><TextInput placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} {...register('cnpj')} /></Field>
      <Field label="Horário esperado do backup" hint="Horário local do estabelecimento." error={errors.expectedBackupTime?.message}><TextInput type="time" {...register('expectedBackupTime')} /></Field>
      <div className="form-actions"><Button type="submit" loading={submitting}><Plus size={16} /> Cadastrar mercado</Button></div>
    </form>
  )
}
