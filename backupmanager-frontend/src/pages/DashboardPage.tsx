import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowUpRight, Building2, CalendarDays, CheckCircle2, CircleAlert, Clock3, DatabaseBackup, RefreshCw, ShieldCheck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/ui/primitives'
import { api, getApiErrorMessage } from '../lib/api'
import type { DashboardSummary, MarketOverview } from '../lib/types'
import { dateInputValue, formatBytes, formatCnpj, formatDateTime, formatTime, toLocalDateTimeParam } from '../lib/utils'

function getMonthStart() {
  const date = new Date()
  return dateInputValue(new Date(date.getFullYear(), date.getMonth(), 1))
}

function getToday() {
  return dateInputValue(new Date())
}

async function fetchSummary(startDate: string, endDate: string) {
  const start = toLocalDateTimeParam(new Date(`${startDate}T00:00:00`))
  const end = toLocalDateTimeParam(new Date(`${endDate}T23:59:59`), true)
  const response = await api.get<DashboardSummary>('/dashboard', { params: { startDate: start, endDate: end } })
  return response.data
}

async function fetchMarketOverview() {
  const response = await api.get<MarketOverview[]>('/markets/overview')
  return response.data
}

const chartColors = ['#16a36a', '#e05252', '#e6a23c']

export function DashboardPage() {
  const [startDate, setStartDate] = useState(getMonthStart)
  const [endDate, setEndDate] = useState(getToday)
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', startDate, endDate],
    queryFn: () => fetchSummary(startDate, endDate),
    enabled: Boolean(startDate && endDate && startDate <= endDate),
  })
  const marketQuery = useQuery({ queryKey: ['market-overview'], queryFn: fetchMarketOverview })

  const summary = summaryQuery.data
  const distribution = useMemo(() => [
    { name: 'Sucesso', value: summary?.successfulBackups ?? 0 },
    { name: 'Falhou', value: summary?.failedBackups ?? 0 },
    { name: 'Pendente', value: summary?.pendingBackups ?? 0 },
  ].filter((item) => item.value > 0), [summary])

  const dateInvalid = Boolean(startDate && endDate && startDate > endDate)

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="CENTRAL DE OPERAÇÕES"
        title="Visão geral"
        description="Acompanhe os indicadores de execução e o último backup registrado de cada mercado."
        action={<div className="dashboard-refresh"><span className="refresh-indicator" /> Dados atualizados sob demanda <Button size="icon" variant="outline" title="Atualizar dados" onClick={() => { void summaryQuery.refetch(); void marketQuery.refetch() }}><RefreshCw size={16} /></Button></div>}
      />

      <Card className="filter-card">
        <div className="filter-label"><CalendarDays size={17} /><div><strong>Período de análise</strong><span>Indicadores de backup conforme a data de criação</span></div></div>
        <div className="filter-controls">
          <label className="date-control"><span>De</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
          <span className="date-range-separator">até</span>
          <label className="date-control"><span>Até</span><input type="date" value={endDate} min={startDate || undefined} max={getToday()} onChange={(event) => setEndDate(event.target.value)} /></label>
          <Button variant="ghost" size="sm" onClick={() => { setStartDate(getMonthStart()); setEndDate(getToday()) }}>Este mês</Button>
        </div>
      </Card>
      {dateInvalid ? <div className="inline-alert">A data inicial não pode ser posterior à data final.</div> : null}

      {summaryQuery.isLoading ? <div className="stats-grid"><div className="stat-card stat-skeleton" /><div className="stat-card stat-skeleton" /><div className="stat-card stat-skeleton" /><div className="stat-card stat-skeleton" /><div className="stat-card stat-skeleton" /></div> : summaryQuery.isError ? <ErrorState message={getApiErrorMessage(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} /> : summary ? (
        <div className="stats-grid">
          <StatCard label="Mercados ativos" value={summary.activeMarkets} helper="Mercados cadastrados e ativos" icon={<Building2 size={19} />} tone="blue" />
          <StatCard label="Backups no período" value={summary.totalBackups} helper="Todas as execuções" icon={<DatabaseBackup size={19} />} tone="violet" />
          <StatCard label="Concluídos" value={summary.successfulBackups} helper={summary.totalBackups ? `${Math.round(summary.successfulBackups / summary.totalBackups * 100)}% do total` : 'Sem execuções no período'} icon={<CheckCircle2 size={19} />} tone="green" />
          <StatCard label="Com falha" value={summary.failedBackups} helper={summary.failedBackups ? 'Requerem atenção' : 'Nenhuma falha no período'} icon={<CircleAlert size={19} />} tone="red" />
          <StatCard label="Pendentes" value={summary.pendingBackups} helper="Aguardando conclusão" icon={<Clock3 size={19} />} tone="amber" />
        </div>
      ) : null}

      <div className="dashboard-content-grid">
        <Card className="distribution-card">
          <div className="section-heading">
            <div><p className="eyebrow">DESEMPENHO</p><h2>Resultado dos backups</h2><p>Distribuição por status no período selecionado.</p></div>
            <div className="heading-icon"><Activity size={18} /></div>
          </div>
          {summaryQuery.isLoading ? <LoadingState label="Carregando indicadores..." /> : summaryQuery.isError ? <ErrorState message={getApiErrorMessage(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} /> : summary && summary.totalBackups > 0 ? (
            <div className="distribution-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="value" nameKey="name" innerRadius="67%" outerRadius="92%" paddingAngle={3} stroke="none">
                      {distribution.map((item) => <Cell key={item.name} fill={chartColors[['Sucesso', 'Falhou', 'Pendente'].indexOf(item.name)]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value).toLocaleString('pt-BR'), 'Backups']} contentStyle={{ borderRadius: 12, border: '1px solid #e8ebf1', boxShadow: '0 8px 24px rgba(20,30,50,.08)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center"><strong>{summary.totalBackups.toLocaleString('pt-BR')}</strong><span>execuções</span></div>
              </div>
              <div className="chart-legend">
                <LegendItem color="green" label="Concluídos" value={summary.successfulBackups} total={summary.totalBackups} />
                <LegendItem color="red" label="Com falha" value={summary.failedBackups} total={summary.totalBackups} />
                <LegendItem color="amber" label="Pendentes" value={summary.pendingBackups} total={summary.totalBackups} />
              </div>
            </div>
          ) : <EmptyState title="Sem backups no período" description="Altere o intervalo de datas para consultar outras execuções." />}
        </Card>

        <Card className="health-card">
          <div className="section-heading">
            <div><p className="eyebrow">MONITORAMENTO</p><h2>Mercados cadastrados</h2><p>Resumo da última execução conhecida de cada mercado.</p></div>
            <div className="heading-icon heading-icon-green"><ShieldCheck size={18} /></div>
          </div>
          {marketQuery.isLoading ? <LoadingState label="Carregando mercados..." /> : marketQuery.isError ? <ErrorState message={getApiErrorMessage(marketQuery.error)} onRetry={() => void marketQuery.refetch()} /> : (
            <>
              <div className="health-summary"><strong>{marketQuery.data?.length ?? 0}</strong><span>mercados ativos</span><Link to="/markets">Ver todos <ArrowUpRight size={14} /></Link></div>
              <div className="market-quick-list">
                {(marketQuery.data ?? []).slice(0, 5).map((market) => <Link className="market-quick-row" to={`/markets/${market.marketId}`} key={market.marketId}>
                  <span className="market-mini-avatar">{market.marketName.trim().charAt(0).toUpperCase()}</span>
                  <span className="market-quick-info"><strong>{market.marketName}</strong><small>{market.lastBackup ? formatDateTime(market.lastBackup.createdAt) : 'Nenhum backup registrado'}</small></span>
                  <StatusBadge status={market.lastBackup?.status} />
                </Link>)}
                {(marketQuery.data ?? []).length === 0 ? <EmptyState title="Nenhum mercado ativo" description="Cadastre um mercado para começar." /> : null}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="table-card">
        <div className="table-card-header">
          <div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Últimos status por mercado</h2><p>Uma visão rápida da execução mais recente de cada mercado.</p></div>
          <Link to="/markets" className="text-link">Abrir mercados <ArrowUpRight size={15} /></Link>
        </div>
        {marketQuery.isLoading ? <LoadingState /> : marketQuery.isError ? <ErrorState message={getApiErrorMessage(marketQuery.error)} onRetry={() => void marketQuery.refetch()} /> : (marketQuery.data?.length ?? 0) === 0 ? <EmptyState title="Nenhum mercado para exibir" description="Os mercados ativos aparecerão aqui." /> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Mercado</th><th>CNPJ</th><th>Horário esperado</th><th>Último backup</th><th>Tamanho</th><th>Status</th><th /></tr></thead><tbody>
            {(marketQuery.data ?? []).slice(0, 8).map((market) => <tr key={market.marketId}>
              <td><Link to={`/markets/${market.marketId}`} className="table-primary-link">{market.marketName}</Link></td>
              <td className="muted-cell">{formatCnpj(market.cnpj)}</td>
              <td className="muted-cell">{formatTime(market.expectedBackupTime)}</td>
              <td className="muted-cell">{market.lastBackup ? formatDateTime(market.lastBackup.createdAt) : '—'}</td>
              <td className="muted-cell">{formatBytes(market.lastBackup?.fileSizeBytes)}</td>
              <td><StatusBadge status={market.lastBackup?.status} /></td>
              <td><Link to={`/markets/${market.marketId}`} className="table-arrow-link" aria-label={`Abrir ${market.marketName}`}><ArrowUpRight size={16} /></Link></td>
            </tr>)}
          </tbody></table></div>
        )}
        {(marketQuery.data?.length ?? 0) > 8 ? <div className="table-card-footer">Exibindo 8 de {marketQuery.data?.length} mercados ativos.</div> : null}
      </Card>
    </div>
  )
}

function StatCard({ label, value, helper, icon, tone }: { label: string; value: number; helper: string; icon: ReactNode; tone: string }) {
  return <div className={`stat-card stat-${tone}`}><div className="stat-top"><span className="stat-label">{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value.toLocaleString('pt-BR')}</div><div className="stat-helper">{helper}</div></div>
}

function LegendItem({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const percentage = total ? Math.round(value / total * 100) : 0
  return <div className="legend-item"><span className={`legend-dot legend-${color}`} /><div className="legend-copy"><div><strong>{label}</strong><span>{percentage}%</span></div><div className="legend-track"><span className={`legend-fill legend-fill-${color}`} style={{ width: `${percentage}%` }} /></div></div><b>{value}</b></div>
}
