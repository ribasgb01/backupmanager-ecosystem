import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Copy, Download, Eye, EyeOff, FileArchive, KeyRound, RefreshCw, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/ui/primitives'
import { api, getApiErrorMessage } from '../lib/api'
import type { BackupHistory, Market, PageResponse } from '../lib/types'
import { copyToClipboard, formatBytes, formatCnpj, formatDateTime, formatTime } from '../lib/utils'

async function getMarket(id: string) {
  const response = await api.get<Market>(`/markets/${id}`)
  return response.data
}

async function getHistory(id: string, page: number, startDate: string, endDate: string) {
  const params: Record<string, string | number> = { page, size: 10, sort: 'createdAt,desc' }
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  const response = await api.get<PageResponse<BackupHistory>>(`/backups/market/${id}`, { params })
  return response.data
}

async function getDownloadUrl(backupId: string) {
  const response = await api.get<{ url: string }>(`/backups/${backupId}/download-url`)
  return response.data.url
}

export function MarketDetailPage() {
  const { marketId = '' } = useParams()
  const [page, setPage] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const marketQuery = useQuery({ queryKey: ['markets', marketId], queryFn: () => getMarket(marketId), enabled: Boolean(marketId) })
  const historyQuery = useQuery({ queryKey: ['backup-history', marketId, page, appliedStartDate, appliedEndDate], queryFn: () => getHistory(marketId, page, appliedStartDate, appliedEndDate), enabled: Boolean(marketId) })
  const downloadMutation = useMutation({
    mutationFn: getDownloadUrl,
    onError: (error) => toast.error(getApiErrorMessage(error, 'Não foi possível gerar o link de download.')),
  })

  const market = marketQuery.data
  const history = historyQuery.data

  async function copyKey() {
    if (!market?.apiKey) return
    try { await copyToClipboard(market.apiKey); toast.success('API Key copiada.') }
    catch { toast.error('Não foi possível copiar a API Key.') }
  }

  function applyFilter() {
    setPage(0)
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  function handleDownload(backupId: string) {
    // Abre a aba de forma síncrona no clique para evitar bloqueio de popup do navegador.
    const downloadTab = window.open('about:blank', '_blank')
    downloadMutation.mutate(backupId, {
      onSuccess: (url) => {
        if (downloadTab) downloadTab.location.href = url
        else window.location.assign(url)
      },
      onError: () => downloadTab?.close(),
    })
  }

  return (
    <div className="page-stack">
      <div className="back-link-row"><Link to="/markets" className="back-link"><ArrowLeft size={16} /> Voltar para mercados</Link></div>
      {marketQuery.isLoading ? <LoadingState label="Carregando dados do mercado..." /> : marketQuery.isError ? <ErrorState message={getApiErrorMessage(marketQuery.error)} onRetry={() => void marketQuery.refetch()} /> : market ? <>
        <PageHeader eyebrow="DETALHES DO ESTABELECIMENTO" title={market.name} description="Informações cadastrais, configuração de integração e histórico de execuções." action={<span className={`active-pill ${market.active ? 'active-pill-on' : 'active-pill-off'}`}><span />{market.active ? 'Ativo' : 'Inativo'}</span>} />
        <div className="market-detail-grid">
          <Card className="detail-info-card">
            <div className="detail-card-title"><div className="detail-avatar"><Store size={20} /></div><div><p className="eyebrow">CADASTRO</p><h2>Informações do mercado</h2></div></div>
            <div className="detail-field-grid">
              <DetailField label="Nome" value={market.name} />
              <DetailField label="CNPJ" value={formatCnpj(market.cnpj)} />
              <DetailField label="Horário esperado" value={formatTime(market.expectedBackupTime)} />
              <DetailField label="Identificador" value={market.id} mono />
            </div>
          </Card>
          <Card className="api-key-card">
            <div className="detail-card-title"><div className="api-key-icon"><KeyRound size={19} /></div><div><p className="eyebrow">INTEGRAÇÃO</p><h2>Chave de API</h2></div></div>
            <p className="api-key-description">Utilizada pelo agente deste mercado para autenticar as solicitações de backup.</p>
            <div className="api-key-reveal"><code>{showApiKey ? market.apiKey : '••••••••••••••••••••••••••••••••'}</code><button className="icon-button" onClick={() => setShowApiKey((value) => !value)} title={showApiKey ? 'Ocultar chave' : 'Exibir chave'}>{showApiKey ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            <Button variant="outline" className="copy-key-button" onClick={() => void copyKey()}><Copy size={15} /> Copiar API Key</Button>
          </Card>
        </div>

        <Card className="table-card history-card">
          <div className="table-card-header history-header">
            <div><p className="eyebrow">EXECUÇÕES</p><h2>Histórico de backups</h2><p>Registros de execução e disponibilidade dos arquivos deste mercado.</p></div>
            <div className="history-filters">
              <label className="date-control"><span>De</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
              <label className="date-control"><span>Até</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
              <Button size="sm" onClick={applyFilter}><CalendarDays size={15} /> Filtrar</Button>
              {(startDate || endDate) ? <Button size="icon" variant="ghost" title="Limpar filtros" onClick={() => { setStartDate(''); setEndDate(''); setAppliedStartDate(''); setAppliedEndDate(''); setPage(0) }}><RefreshCw size={15} /></Button> : null}
            </div>
          </div>
          {historyQuery.isLoading ? <LoadingState label="Carregando histórico..." /> : historyQuery.isError ? <ErrorState message={getApiErrorMessage(historyQuery.error)} onRetry={() => void historyQuery.refetch()} /> : !history?.content?.length ? <EmptyState title="Nenhum backup encontrado" description="Não há execuções registradas para o filtro selecionado." /> : (
            <div className="table-scroll"><table className="data-table history-data-table"><thead><tr><th>Execução</th><th>Conclusão</th><th>Arquivo</th><th>Tamanho</th><th>Status</th><th>Detalhes</th><th /></tr></thead><tbody>
              {history.content.map((backup) => <tr key={backup.id}>
                <td><div className="date-cell"><strong>{formatDateTime(backup.createdAt)}</strong><small className="id-truncate">{backup.id}</small></div></td>
                <td className="muted-cell">{formatDateTime(backup.completedAt)}</td>
                <td><span className="file-cell"><FileArchive size={15} /> Backup compactado</span></td>
                <td className="muted-cell">{formatBytes(backup.fileSizeBytes)}</td>
                <td><StatusBadge status={backup.status} /></td>
                <td>{backup.errorMessage ? <span className="error-message-cell" title={backup.errorMessage}>{backup.errorMessage}</span> : <span className="muted-cell">—</span>}</td>
                <td>{backup.status === 'SUCCESS' ? <Button variant="outline" size="icon" title="Baixar backup" loading={downloadMutation.isPending && downloadMutation.variables === backup.id} onClick={() => handleDownload(backup.id)}><Download size={16} /></Button> : null}</td>
              </tr>)}
            </tbody></table></div>
          )}
          {history && history.totalPages > 0 ? <div className="pagination-bar"><span>Mostrando página {history.number + 1} de {history.totalPages} · {history.totalElements} registros</span><div><Button size="sm" variant="outline" disabled={history.first || page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Anterior</Button><Button size="sm" variant="outline" disabled={history.last} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div></div> : null}
        </Card>
      </> : null}
    </div>
  )
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="detail-field"><span>{label}</span><strong className={mono ? 'mono-text' : ''}>{value}</strong></div>
}
