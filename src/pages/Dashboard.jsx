
// File: dashboard_transapp_unificado.jsx
// Merged visuals (from dashboard_antiguo_visual) + functional queries (from dashboard_nuevo_funcional)
// - Workers & Shifts: counts via HEAD (exact) in parallel
// - Financial: single-pass aggregation with dynamic date windows (month/year/all)
// - Trends & Top Workers: deterministic pagination driven by HEAD counts (robust), filtered by range
// - Visuals: preserved from the original visual dashboard (cards, ECharts options, layout)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  CheckCircle2,
  Activity,
  Target,
  Zap,
  Trophy,
  AlertCircle,
  Clock,
  BarChart3,
  PieChart,
  Flame,
  Filter,
  Bug
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { getSupabaseClient } from '@/services/supabaseClient'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'

const PAGE_SIZE = 1000

// ======== DEBUG TOGGLE ========
const DEBUG_DEFAULT = false

// ======== Date helpers (todas retornan YYYY-MM-DD en HORA LOCAL) ========
const toISODate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const startOfMonth = (year, month /* 0-based */) => toISODate(new Date(year, month, 1))
const endOfMonth   = (year, month /* 0-based */) => toISODate(new Date(year, month + 1, 0))

// Mes calendario actual (ej: si hoy es 2025-09-15 => 2025-09-01 a 2025-09-30)
const getCurrentMonthRange = () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  return {
    start: startOfMonth(y, m),
    end: endOfMonth(y, m)
  }
}

// Mes calendario anterior (ej: si hoy es 2025-09-15 => 2025-08-01 a 2025-08-31)
const getPreviousMonthRange = () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() - 1 // mes anterior
  // Si es enero (month 0), ir a diciembre del año anterior
  if (m < 0) {
    return {
      start: startOfMonth(y - 1, 11), // diciembre del año anterior
      end: endOfMonth(y - 1, 11)
    }
  }
  return {
    start: startOfMonth(y, m),
    end: endOfMonth(y, m)
  }
}

// Año calendario completo actual (enero a diciembre)
const getCurrentYearRange = () => {
  const today = new Date()
  const year = today.getFullYear()
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  }
}

// Para tendencias (7/30/90d) => rolling
const getRollingDaysRange = (days) => {
  const end = toISODate(new Date())
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { start: toISODate(from), end }
}

// Formateos
const fmtCL = (v) => `$${(v || 0).toLocaleString('es-CL')}`
const fmtPct = (v) => `${(v ?? 0) > 0 ? '+' : ''}${v}%`
const fmtDate = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(n => parseInt(n, 10))
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ======== Component ========
const Dashboard = () => {
  const supabase = getSupabaseClient()
  const [debug, setDebug] = useState(DEBUG_DEFAULT)

  const [dashboardData, setDashboardData] = useState({
    workers: { total: 0, active: 0, _debug: {} },
    shifts: { total: 0, completed: 0, programmed: 0, cancelled: 0, today: 0, _debug: {} },
    financial: { totalIncome: 0, totalCosts: 0, margin: 0, marginPercent: 0, _range: {start:null,end:null}, _debug: {} },
    trends: { daily: [], weekly: [], _range: {start:null,end:null}, _debug: {} },
    topWorkers: [],
    topWorkersRangeMeta: { start: null, end: null, _debug: {} },
    monthlyIncome: [], // Últimos 6 meses de ingresos (cobros)
    monthlyCosts: [],  // Últimos 6 meses de costos (pagos)
    shiftDistribution: [],
    alerts: [],
    loading: true
  })

  const [timeFilters, setTimeFilters] = useState({
    trendsRange: 7,           // 7 / 30 / 90 días (rolling)
    topWorkersRange: 'month', // 'month' => mes calendario actual
    financialRange: 'month'   // 'month' => mes calendario actual
  })

  // ---------- QUERIES ----------

  // Workers via HEAD counts
  const loadWorkersData = async () => {
    try {
      const [totalRes, activeRes] = await Promise.all([
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }),
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }).eq('estado', 'activo')
      ])
      ;[totalRes, activeRes].forEach(r => { if (r.error) throw r.error })
      const out = { 
        total: totalRes.count || 0, 
        active: activeRes.count || 0, 
        _debug: { provider: 'HEAD/exact' } 
      }
      if (debug) console.log('👥 Workers:', out)
      return out
    } catch (err) {
      console.error('Workers error:', err)
      return { total: 0, active: 0, _debug: { error: String(err) } }
    }
  }

  // Shifts via HEAD counts
  const loadShiftsData = async () => {
    try {
      const today = toISODate(new Date())
      const [totalRes, completedRes, programmedRes, cancelledRes, todayRes] = await Promise.all([
        supabase.from('turnos').select('*', { count: 'exact', head: true }),
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('estado', 'completado'),
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('estado', 'programado'),
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('estado', 'cancelado'),
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('fecha', today)
      ])
      ;[totalRes, completedRes, programmedRes, cancelledRes, todayRes].forEach(r => { if (r.error) throw r.error })
      const out = {
        total: totalRes.count || 0,
        completed: completedRes.count || 0,
        programmed: programmedRes.count || 0,
        cancelled: cancelledRes.count || 0,
        today: todayRes.count || 0,
        _debug: { provider: 'HEAD/exact', today }
      }
      if (debug) console.log('📊 Shifts:', out)
      return out
    } catch (err) {
      console.error('Shifts error:', err)
      return { total: 0, completed: 0, programmed: 0, cancelled: 0, today: 0, _debug: { error: String(err) } }
    }
  }

  // Financial (single-pass agg) con rango explícito (mes actual / mes anterior / año completo / todo)
  const loadFinancialData = async (key) => {
    let range = { start: null, end: null }
    if (key === 'month') range = getCurrentMonthRange()
    else if (key === 'previous-month') range = getPreviousMonthRange()
    else if (key === 'year') range = getCurrentYearRange()

    try {
      // Usar fetchPaged para obtener TODOS los registros sin límite de 1000
      const buildFilter = (q) => {
        let filteredQ = q
        if (range.start) filteredQ = filteredQ.gte('fecha', range.start)
        if (range.end)   filteredQ = filteredQ.lte('fecha', range.end)
        return filteredQ
      }

      const { rows: data, _debug } = await fetchPaged({
        table: 'turnos',
        select: 'pago,cobro,estado,fecha',
        buildFilter
      })

      let totalCosts = 0, totalIncome = 0, processed = 0, completed = 0
      data?.forEach(r => {
        processed++
        if (r?.pago  && r.pago  > 0) totalCosts  += r.pago
        if (r?.cobro && r.cobro > 0) totalIncome += r.cobro
        if (r?.estado === 'completado') completed++
      })
      const margin = totalIncome - totalCosts
      const marginPercent = totalIncome > 0 ? Math.round(((margin / totalIncome) * 100) * 100) / 100 : 0

      const out = {
        totalIncome, totalCosts, margin, marginPercent,
        _range: { ...range },
        _debug: { 
          rows: processed, 
          completed, 
          totalRows: processed, 
          incomeRows: data?.filter(r => r?.cobro && r.cobro > 0).length || 0, 
          costRows: data?.filter(r => r?.pago && r.pago > 0).length || 0,
          pages: _debug?.pages || 0,
          paginationTotal: _debug?.total || 0
        }
      }
      if (debug) console.log('💰 Financial:', out)
      return out
    } catch (err) {
      console.error('Financial error:', err)
      return { totalIncome: 0, totalCosts: 0, margin: 0, marginPercent: 0, _range: { start:null,end:null }, _debug: { error: String(err) } }
    }
  }

  // Deterministic pagination helper
  const fetchPaged = async ({ table, select, buildFilter, orderBy = null, pageSize = PAGE_SIZE }) => {
    try {
      let head = supabase.from(table).select('*', { count: 'exact', head: true })
      if (buildFilter) head = buildFilter(head)
      const { count, error: headErr } = await head
      if (headErr) throw headErr
      const total = count || 0
      if (total === 0) return { rows: [], _debug: { total, pages: 0 } }

      const pages = Math.ceil(total / pageSize)
      const out = []
      for (let p = 0; p < pages; p++) {
        const from = p * pageSize
        const to = Math.min(from + pageSize - 1, total - 1)
        let q = supabase.from(table).select(select).range(from, to)
        if (buildFilter) q = buildFilter(q)
        if (orderBy) q = q.order(orderBy.key, { ascending: orderBy.asc })
        const { data, error } = await q
        if (error) throw error
        if (data && data.length) out.push(...data)
      }
      return { rows: out, _debug: { total, pages } }
    } catch (err) {
      console.error('fetchPaged error:', err)
      return { rows: [], _debug: { error: String(err) } }
    }
  }

  // Trends (rolling N días) con rango mostrado
  const loadTrendsData = async (days) => {
    const range = getRollingDaysRange(days)
    const buildFilter = (q) => q.gte('fecha', range.start).lte('fecha', range.end).eq('estado', 'completado')
    const { rows, _debug } = await fetchPaged({
      table: 'turnos',
      select: 'fecha,estado,pago,cobro',
      buildFilter,
      orderBy: { key: 'fecha', asc: true }
    })

    const dailyMap = {}
    rows.forEach(r => {
      const key = r.fecha
      if (!dailyMap[key]) dailyMap[key] = { date: key, shifts: 0, income: 0, costs: 0 }
      dailyMap[key].shifts += 1
      dailyMap[key].income += r?.cobro ? r.cobro : 0
      dailyMap[key].costs  += r?.pago  ? r.pago  : 0
    })
    const daily = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date))
    const out = { daily, weekly: [], _range: range, _debug: { ..._debug, rowsFetched: rows.length, days: daily.length } }
    if (debug) console.log('📈 Trends:', out)
    return out
  }

  // Top workers (month => mes actual, prev_month => mes anterior, year => año completo, all => sin filtro)
  const loadTopWorkersData = async (key) => {
    let range = { start: null, end: null }
    if (key === 'month') range = getCurrentMonthRange()
    else if (key === 'prev_month') range = getPreviousMonthRange()
    else if (key === 'year') range = getCurrentYearRange()

    const buildFilter = (q) => {
      let x = q.eq('estado', 'completado')
      if (range.start) x = x.gte('fecha', range.start)
      if (range.end)   x = x.lte('fecha', range.end)
      return x
    }

    const { rows, _debug } = await fetchPaged({
      table: 'turnos',
      select: `trabajador_id,estado,pago,fecha,trabajador:trabajador_id(nombre)`,
      buildFilter
    })

    const stats = {}
    rows.forEach(r => {
      const id = r.trabajador_id
      if (!stats[id]) {
        stats[id] = {
          id,
          name: r?.trabajador?.nombre || 'Trabajador Desconocido',
          shifts: 0,
          totalPay: 0
        }
      }
      stats[id].shifts += 1
      stats[id].totalPay += r?.pago ? r.pago : 0
    })

    const top = Object.values(stats).sort((a, b) => b.shifts - a.shifts).slice(0, 5)
    const meta = { start: range.start, end: range.end, _debug: { ..._debug, rowsFetched: rows.length, workers: Object.keys(stats).length } }
    if (debug) console.log('👥 TopWorkers:', { top, meta })
    return { top, meta }
  }

  // Datos mensuales últimos 6 meses (ingresos y costos)
  const loadLast6MonthsData = async () => {
    const months = []
    const today = new Date()
    
    // Generar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      months.push({
        year,
        month,
        monthName: date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
        start: startOfMonth(year, month),
        end: endOfMonth(year, month)
      })
    }

    const monthlyData = []
    
    for (const monthInfo of months) {
      const buildFilter = (q) => {
        return q
          .eq('estado', 'completado')
          .gte('fecha', monthInfo.start)
          .lte('fecha', monthInfo.end)
      }

      try {
        const { rows, _debug } = await fetchPaged({
          table: 'turnos',
          select: 'pago,cobro,fecha',
          buildFilter
        })

        const totalIncome = rows.reduce((sum, r) => sum + (r?.cobro || 0), 0)
        const totalCosts = rows.reduce((sum, r) => sum + (r?.pago || 0), 0)

        monthlyData.push({
          month: monthInfo.monthName,
          income: totalIncome,
          costs: totalCosts,
          margin: totalIncome - totalCosts,
          shifts: rows.length,
          _debug: { ..._debug, monthInfo }
        })

        if (debug) console.log(`📊 Mes ${monthInfo.monthName}:`, {
          income: fmtCL(totalIncome),
          costs: fmtCL(totalCosts),
          shifts: rows.length
        })
      } catch (error) {
        console.error(`Error cargando datos del mes ${monthInfo.monthName}:`, error)
        monthlyData.push({
          month: monthInfo.monthName,
          income: 0,
          costs: 0,
          margin: 0,
          shifts: 0,
          error: error.message
        })
      }
    }

    if (debug) console.log('📊 Últimos 6 meses:', monthlyData)
    return monthlyData
  }

  // ---------- Effects ----------

  useEffect(() => {
    const init = async () => {
      setDashboardData(prev => ({ ...prev, loading: true }))
      const [workers, shifts, monthlyData] = await Promise.all([
        loadWorkersData(), 
        loadShiftsData(), 
        loadLast6MonthsData()
      ])
      setDashboardData(prev => ({
        ...prev,
        workers,
        shifts,
        monthlyIncome: monthlyData,
        monthlyCosts: monthlyData, // Same data, different visualization
        shiftDistribution: calculateShiftDistribution(shifts),
        alerts: generateAlerts(workers, shifts, prev.financial),
        loading: false
      }))
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const run = async () => {
      if (dashboardData.loading) return
      const financial = await loadFinancialData(timeFilters.financialRange)
      setDashboardData(prev => ({
        ...prev,
        financial,
        alerts: generateAlerts(prev.workers, prev.shifts, financial)
      }))
    }
    run()
  }, [timeFilters.financialRange, dashboardData.loading])

  useEffect(() => {
    const run = async () => {
      if (dashboardData.loading) return
      const trends = await loadTrendsData(timeFilters.trendsRange)
      setDashboardData(prev => ({ ...prev, trends }))
    }
    run()
  }, [timeFilters.trendsRange, dashboardData.loading])

  useEffect(() => {
    const run = async () => {
      if (dashboardData.loading) return
      const { top, meta } = await loadTopWorkersData(timeFilters.topWorkersRange)
      setDashboardData(prev => ({ ...prev, topWorkers: top, topWorkersRangeMeta: meta }))
    }
    run()
  }, [timeFilters.topWorkersRange, dashboardData.loading])

  // ---------- Helpers visuales ----------

  const calculateShiftDistribution = (s) => ([
    { name: 'Completados', value: s.completed, color: '#10b981' },
    { name: 'Programados', value: s.programmed, color: '#3b82f6' },
    { name: 'Cancelados', value: s.cancelled, color: '#ef4444' }
  ])

  const generateAlerts = (workers, shifts, financial) => {
    const alerts = []
    if ((workers.active || 0) < Math.max(1, Math.ceil((workers.total || 0) * 0.8))) {
      alerts.push({ type: 'warning', message: `Solo ${workers.active} de ${workers.total} trabajadores activos`, priority: 'high' })
    }
    if ((shifts.today || 0) === 0) {
      alerts.push({ type: 'info', message: 'No hay turnos programados para hoy', priority: 'medium' })
    }
    if ((financial.totalIncome || 0) > 0 && (financial.marginPercent || 0) < 20) {
      alerts.push({ type: 'error', message: `Margen bajo: ${financial.marginPercent}%`, priority: 'critical' })
    }
    return alerts
  }

  // --- Chart options ---
  const trendsOption = useMemo(() => {
    if (!dashboardData.trends.daily?.length) return null
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].name}</div>`
          params.forEach(param => {
            if (param.seriesName === 'Turnos') {
              result += `<div style="color: ${param.color};">• ${param.seriesName}: ${param.value}</div>`
            } else {
              result += `<div style="color: ${param.color};">• ${param.seriesName}: $${(param.value / 1000000).toFixed(2)}M</div>`
            }
          })
          return result
        }
      },
      legend: { data: ['Ingresos', 'Costos', 'Turnos'], textStyle: { color: '#64748b' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category', boundaryGap: false,
        data: dashboardData.trends.daily.map(d => {
          const [y,m,dd] = d.date.split('-').map(n => parseInt(n,10))
          const date = new Date(y, m - 1, dd)
          return `${date.getDate()}/${date.getMonth() + 1}`
        }),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: [
        { type: 'value', name: 'Millones (CLP)', position: 'left',
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: { color: '#64748b', formatter: (value) => `$${(value/1000000).toFixed(1)}M` } },
        { type: 'value', name: 'Turnos', position: 'right',
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: { color: '#64748b' } }
      ],
      series: [
        { name: 'Ingresos', type: 'line', data: dashboardData.trends.daily.map(d => d.income), smooth: true,
          lineStyle: { color: '#10b981', width: 3 }, areaStyle: { color: 'rgba(16, 185, 129, 0.1)' } },
        { name: 'Costos', type: 'line', data: dashboardData.trends.daily.map(d => d.costs), smooth: true,
          lineStyle: { color: '#ef4444', width: 3 }, areaStyle: { color: 'rgba(239, 68, 68, 0.1)' } },
        { name: 'Turnos', type: 'line', yAxisIndex: 1, data: dashboardData.trends.daily.map(d => d.shifts), smooth: true,
          lineStyle: { color: '#3b82f6', width: 3 } }
      ]
    }
  }, [dashboardData.trends.daily])

  const shiftDistOption = useMemo(() => {
    if (!dashboardData.shiftDistribution?.length) return null
    return {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', textStyle: { color: '#64748b' } },
      series: [{
        name: 'Turnos', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: dashboardData.shiftDistribution.map(it => ({ value: it.value, name: it.name, itemStyle: { color: it.color } }))
      }]
    }
  }, [dashboardData.shiftDistribution])

  // Gráfico de barras - Ingresos últimos 6 meses
  const monthlyIncomeOption = useMemo(() => {
    if (!dashboardData.monthlyIncome?.length) return null
    return {
      title: {
        text: 'Ingresos Últimos 6 Meses',
        textStyle: { color: '#374151', fontSize: 16, fontWeight: 'bold' },
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          const data = params[0]
          return `<div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
                  <div style="color: #10b981;">• Ingresos: ${fmtCL(data.value)}</div>
                  <div style="color: #64748b;">• Turnos: ${dashboardData.monthlyIncome[data.dataIndex]?.shifts || 0}</div>`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dashboardData.monthlyIncome.map(d => d.month),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', formatter: (value) => `$${(value/1000000).toFixed(1)}M` },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
      },
      series: [{
        type: 'bar',
        data: dashboardData.monthlyIncome.map(d => d.income),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#10b981' },
            { offset: 1, color: '#059669' }
          ])
        },
        emphasis: {
          itemStyle: { color: '#047857' }
        }
      }]
    }
  }, [dashboardData.monthlyIncome])

  // Gráfico de barras - Costos últimos 6 meses  
  const monthlyCostsOption = useMemo(() => {
    if (!dashboardData.monthlyCosts?.length) return null
    return {
      title: {
        text: 'Costos Últimos 6 Meses',
        textStyle: { color: '#374151', fontSize: 16, fontWeight: 'bold' },
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          const data = params[0]
          return `<div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
                  <div style="color: #ef4444;">• Costos: ${fmtCL(data.value)}</div>
                  <div style="color: #64748b;">• Turnos: ${dashboardData.monthlyCosts[data.dataIndex]?.shifts || 0}</div>`
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dashboardData.monthlyCosts.map(d => d.month),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', formatter: (value) => `$${(value/1000000).toFixed(1)}M` },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
      },
      series: [{
        type: 'bar',
        data: dashboardData.monthlyCosts.map(d => d.costs),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ef4444' },
            { offset: 1, color: '#dc2626' }
          ])
        },
        emphasis: {
          itemStyle: { color: '#b91c1c' }
        }
      }]
    }
  }, [dashboardData.monthlyCosts])

  // ---------- UI ----------

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  Control Central TransApp
                </h1>
                <p className="text-gray-600 mt-1">Dashboard Inteligente - Gestión de Flota en Tiempo Real</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Actualizado ahora</p>
                <p className="text-lg font-semibold text-gray-700">
                  {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Financiero + Filtros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Filtros Financieros:</span>
            <span className="text-xs text-gray-500">
              Rango activo: {fmtDate(dashboardData.financial._range.start)} — {fmtDate(dashboardData.financial._range.end)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, financialRange: 'all' }))}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${timeFilters.financialRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Todo
            </button>
            <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, financialRange: 'year' }))}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${timeFilters.financialRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Año
            </button>
            <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, financialRange: 'previous-month' }))}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${timeFilters.financialRange === 'previous-month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Mes anterior
            </button>
            <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, financialRange: 'month' }))}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${timeFilters.financialRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              Mes actual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ingresos Totales */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-emerald-600 text-xs font-semibold">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    INGRESOS
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{fmtCL(dashboardData.financial.totalIncome)}</p>
                <p className="text-xs text-gray-500">
                  {timeFilters.financialRange === 'all' ? 'Total histórico (todos los registros)' : 
                   timeFilters.financialRange === 'year' ? 
                    `Año completo 2025 (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})` :
                   timeFilters.financialRange === 'previous-month' ?
                    `Mes anterior (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})` : 
                    `Mes actual (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Costos */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-red-600 text-xs font-semibold">
                    <Target className="h-3 w-3 mr-1" />
                    COSTOS
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{fmtCL(dashboardData.financial.totalCosts)}</p>
                <p className="text-xs text-gray-500">
                  {timeFilters.financialRange === 'all' ? 'Todos los pagos históricos' : 
                   timeFilters.financialRange === 'year' ? 
                    `Pagos año completo 2025 (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})` :
                   timeFilters.financialRange === 'previous-month' ?
                    `Pagos mes anterior (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})` : 
                    `Pagos mes actual (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Margen */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-blue-600 text-xs font-semibold">
                    <Flame className="h-3 w-3 mr-1" />
                    MARGEN
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{fmtCL(dashboardData.financial.margin)}</p>
                <p className="text-xs text-gray-500">
                  {`Rentabilidad: ${fmtPct(dashboardData.financial.marginPercent)} • `}
                  {timeFilters.financialRange === 'all' ? 'Histórico completo' : 
                   timeFilters.financialRange === 'year' ? 
                    `Año 2025 (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})` :
                   timeFilters.financialRange === 'previous-month' ?
                    `Mes ant. (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})` : 
                    `Mes act. (${fmtDate(dashboardData.financial._range.start)} – ${fmtDate(dashboardData.financial._range.end)})`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Eficiencia */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-5"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="flex items-center text-purple-600 text-xs font-semibold">
                    <Trophy className="h-3 w-3 mr-1" />
                    EFICIENCIA
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((dashboardData.shifts.completed / (dashboardData.shifts.total || 1)) * 100)}%
                </p>
                <p className="text-xs text-gray-500">
                  {`Tasa completitud • ${dashboardData.shifts.completed} de ${dashboardData.shifts.total} turnos totales`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Trabajadores */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Trabajadores</p>
                  <p className="text-xl font-bold text-gray-900">{dashboardData.workers.active}/{dashboardData.workers.total}</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">{dashboardData.workers.active} activos</div>
            </div>
            {debug && (
              <pre className="mt-3 text-[10px] text-gray-500 bg-gray-50 p-2 rounded border">
                {JSON.stringify(dashboardData.workers._debug, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Turnos Hoy */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-50 rounded-lg"><Calendar className="h-5 w-5 text-orange-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Turnos Hoy</p>
                  <p className="text-xl font-bold text-gray-900">{dashboardData.shifts.today}</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">Programados</div>
            </div>
            {debug && (
              <pre className="mt-3 text-[10px] text-gray-500 bg-gray-50 p-2 rounded border">
                {JSON.stringify(dashboardData.shifts._debug, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Total Turnos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                  <p className="text-xl font-bold text-gray-900">{dashboardData.shifts.total}</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">{dashboardData.shifts.completed} completados</div>
            </div>
          </CardContent>
        </Card>

        {/* Estado Sistema */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg"><Activity className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Sistema</p>
                  <p className="text-xl font-bold text-green-600">ACTIVO</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">En línea</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias */}
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Evolución Temporal ({timeFilters.trendsRange} días)
                </CardTitle>
                <CardDescription>
                  {`Rango: ${fmtDate(dashboardData.trends._range.start)} — ${fmtDate(dashboardData.trends._range.end)}`}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, trendsRange: 7 }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeFilters.trendsRange === 7 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>7d</button>
                <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, trendsRange: 30 }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeFilters.trendsRange === 30 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>30d</button>
                <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, trendsRange: 90 }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeFilters.trendsRange === 90 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>90d</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dashboardData.trends.daily.length > 0 && trendsOption ? (
                <ReactECharts option={trendsOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sin datos históricos disponibles</p>
                  </div>
                </div>
              )}
            </div>
            {debug && (
              <pre className="mt-3 text-[10px] text-gray-500 bg-gray-50 p-2 rounded border">
                {JSON.stringify(dashboardData.trends._debug, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Trabajadores */}
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-orange-600" />
                  Top 5 Trabajadores
                </CardTitle>
                <CardDescription>
                  {timeFilters.topWorkersRange === 'all' ? 'Histórico' : 
                   timeFilters.topWorkersRange === 'year' ? 'Año completo 2025' : 
                   timeFilters.topWorkersRange === 'prev_month' ? 'Mes anterior' : 'Mes actual'} — {
                    `${fmtDate(dashboardData.topWorkersRangeMeta.start)} — ${fmtDate(dashboardData.topWorkersRangeMeta.end)}`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, topWorkersRange: 'all' }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeFilters.topWorkersRange === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todo</button>
                <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, topWorkersRange: 'year' }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeFilters.topWorkersRange === 'year' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Año</button>
                <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, topWorkersRange: 'prev_month' }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeFilters.topWorkersRange === 'prev_month' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Mes anterior</button>
                <button type="button" onClick={() => setTimeFilters(prev => ({ ...prev, topWorkersRange: 'month' }))}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeFilters.topWorkersRange === 'month' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Mes actual</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topWorkers.length > 0 ? dashboardData.topWorkers.map((worker, index) => (
                <div key={worker.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                      'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{worker.name}</p>
                      <p className="text-xs text-gray-500">{fmtCL(worker.totalPay)} pagado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{worker.shifts}</p>
                    <p className="text-xs text-gray-500">turnos</p>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sin datos de trabajadores</p>
                </div>
              )}
            </div>
            {debug && (
              <pre className="mt-3 text-[10px] text-gray-500 bg-gray-50 p-2 rounded border">
                {JSON.stringify(dashboardData.topWorkersRangeMeta._debug, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Estado de Turnos
            </CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dashboardData.shiftDistribution.some(d => d.value > 0) && shiftDistOption ? (
                <ReactECharts option={shiftDistOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sin turnos registrados</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen Operativo */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Resumen Operativo
            </CardTitle>
            <CardDescription>Métricas de estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Completados</span>
                </div>
                <span className="text-lg font-bold text-green-900">{dashboardData.shifts.completed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Programados</span>
                </div>
                <span className="text-lg font-bold text-blue-900">{dashboardData.shifts.programmed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Cancelados</span>
                </div>
                <span className="text-lg font-bold text-red-900">{dashboardData.shifts.cancelled}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Eficiencia</span>
                </div>
                <span className="text-lg font-bold text-orange-900">
                  {Math.round((dashboardData.shifts.completed / (dashboardData.shifts.total || 1)) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Alertas del Sistema
            </CardTitle>
            <CardDescription>Notificaciones importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.alerts.length > 0 ? dashboardData.alerts.map((alert, idx) => (
                <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      alert.type === 'error' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        alert.type === 'error' ? 'text-red-900' :
                        alert.type === 'warning' ? 'text-orange-900' : 'text-blue-900'
                      }`}>{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">Prioridad: {alert.priority}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-6">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Todo en orden</p>
                  <p className="text-xs">No hay alertas críticas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Barras - Últimos 6 Meses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos Mensuales */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Ingresos por Mes
            </CardTitle>
            <CardDescription>Evolución de ingresos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dashboardData.monthlyIncome?.length > 0 && monthlyIncomeOption ? (
                <ReactECharts option={monthlyIncomeOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cargando datos de ingresos...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Costos Mensuales */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-red-600" />
              Costos por Mes
            </CardTitle>
            <CardDescription>Evolución de costos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dashboardData.monthlyCosts?.length > 0 && monthlyCostsOption ? (
                <ReactECharts option={monthlyCostsOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cargando datos de costos...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-gray-50 via-blue-50 to-orange-50 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">TransApp Dashboard</h3>
                <p className="text-gray-600 text-sm">Control Central de Gestión de Flota - Datos en tiempo real desde Supabase PostgreSQL</p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-500">Actualizado al cargar página</p>
              <p className="text-xs text-gray-400">Se actualiza al cambiar filtros</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón Debug - Posición discreta al final */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setDebug(v => !v)}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors opacity-50 hover:opacity-100 ${
            debug ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}
          title="Toggle Debug Info"
        >
          <Bug className="h-3 w-3" />
          {debug ? 'Ocultar' : 'Debug'}
        </button>
      </div>



      {/* Debug panel global (fácil de quitar) */}
      {debug && (
        <Card className="border border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Bug className="h-5 w-5" />
              Debug Panel
            </CardTitle>
            <CardDescription className="text-red-500">Datos auxiliares para trazabilidad (quitar cambiando DEBUG_DEFAULT=false)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-gray-700">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-800 border-b pb-1">RANGOS Y FECHAS</h4>
                <pre className="bg-gray-50 p-2 rounded border"><strong>financial._range</strong><br/>{JSON.stringify(dashboardData.financial._range, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 rounded border"><strong>trends._range</strong><br/>{JSON.stringify(dashboardData.trends._range, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 rounded border"><strong>topWorkers.range</strong><br/>{JSON.stringify({start: dashboardData.topWorkersRangeMeta.start, end: dashboardData.topWorkersRangeMeta.end}, null, 2)}</pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-800 border-b pb-1">CONTADORES Y ESTADÍSTICAS</h4>
                <pre className="bg-gray-50 p-2 rounded border"><strong>workers._debug</strong><br/>{JSON.stringify(dashboardData.workers._debug, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 rounded border"><strong>shifts._debug</strong><br/>{JSON.stringify(dashboardData.shifts._debug, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 rounded border"><strong>financial._debug</strong><br/>{JSON.stringify(dashboardData.financial._debug, null, 2)}</pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-800 border-b pb-1">DATOS DETALLADOS</h4>
                <pre className="bg-gray-50 p-2 rounded border"><strong>trends._debug</strong><br/>{JSON.stringify(dashboardData.trends._debug, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 rounded border"><strong>topWorkers._debug</strong><br/>{JSON.stringify(dashboardData.topWorkersRangeMeta._debug, null, 2)}</pre>
                <pre className="bg-gray-50 p-2 rounded border"><strong>filters_active</strong><br/>{JSON.stringify({financialRange: timeFilters.financialRange, trendsRange: timeFilters.trendsRange + 'd', topWorkersRange: timeFilters.topWorkersRange}, null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Dashboard