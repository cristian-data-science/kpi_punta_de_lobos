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
  ChevronDown
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { getSupabaseClient } from '@/services/supabaseClient'
import ReactECharts from 'echarts-for-react'

const Dashboard = () => {
  // Estados para datos de Supabase
  const [dashboardData, setDashboardData] = useState({
    workers: { total: 0, active: 0 },
    shifts: { total: 0, completed: 0, programmed: 0, cancelled: 0, today: 0 },
    financial: { totalIncome: 0, totalCosts: 0, margin: 0, marginPercent: 0 },
    trends: { daily: [], weekly: [] },
    topWorkers: [],
    shiftDistribution: [],
    alerts: [],
    loading: true
  })

  // Estados para filtros temporales - CONFIGURADOS CON VALORES MÁS GRANULARES
  const [timeFilters, setTimeFilters] = useState({
    trendsRange: 7, // CAMBIADO: 7 días (más granular)
    topWorkersRange: 'month', // CAMBIADO: mes (más granular que 'all')
    financialRange: 'month' // CAMBIADO: mes (más granular que 'all')
  })

  const supabase = getSupabaseClient()

  // ✅ SOLUCIÓN: useEffect separados para cargar datos específicos solo cuando es necesario
  
  // 1. Efecto inicial: Cargar datos base (solo una vez)
  useEffect(() => {
    const loadInitialData = async () => {
      setDashboardData(prev => ({ ...prev, loading: true }))
      
      try {
        console.log('� Carga inicial del dashboard')
        
        // Cargar datos que NO cambian con filtros
        const [workersData, shiftsData] = await Promise.all([
          loadWorkersData(),
          loadShiftsData()
        ])
        
        setDashboardData(prev => ({
          ...prev,
          workers: workersData,
          shifts: shiftsData,
          shiftDistribution: calculateShiftDistribution(shiftsData),
          alerts: generateAlerts(workersData, shiftsData, prev.financial),
          loading: false
        }))
        
      } catch (error) {
        console.error('❌ Error carga inicial:', error)
        setDashboardData(prev => ({ ...prev, loading: false }))
      }
    }
    
    loadInitialData()
  }, []) // ✅ Solo se ejecuta UNA VEZ
  
  // 2. Efecto para datos financieros (solo cuando cambia su filtro)
  useEffect(() => {
    const loadFilteredFinancialData = async () => {
      console.log('💰 Actualizando solo datos financieros:', timeFilters.financialRange)
      
      try {
        const financialData = await loadFinancialData(timeFilters.financialRange)
        
        setDashboardData(prev => ({
          ...prev,
          financial: financialData,
          alerts: generateAlerts(prev.workers, prev.shifts, financialData)
        }))
        
      } catch (error) {
        console.error('❌ Error datos financieros:', error)
      }
    }
    
    // Solo ejecutar si ya tenemos datos base cargados
    if (!dashboardData.loading) {
      loadFilteredFinancialData()
    }
  }, [timeFilters.financialRange, dashboardData.loading]) // ✅ Solo cuando cambia filtro financiero
  
  // 3. Efecto para tendencias (solo cuando cambia su filtro)
  useEffect(() => {
    const loadFilteredTrendsData = async () => {
      console.log('📈 Actualizando solo tendencias:', timeFilters.trendsRange)
      
      try {
        const trendsData = await loadTrendsData(timeFilters.trendsRange)
        
        setDashboardData(prev => ({
          ...prev,
          trends: trendsData
        }))
        
      } catch (error) {
        console.error('❌ Error tendencias:', error)
      }
    }
    
    // Solo ejecutar si ya tenemos datos base cargados
    if (!dashboardData.loading) {
      loadFilteredTrendsData()
    }
  }, [timeFilters.trendsRange, dashboardData.loading]) // ✅ Solo cuando cambia filtro tendencias
  
  // 4. Efecto para top trabajadores (solo cuando cambia su filtro)
  useEffect(() => {
    const loadFilteredTopWorkersData = async () => {
      console.log('👥 Actualizando solo top trabajadores:', timeFilters.topWorkersRange)
      
      try {
        const topWorkersData = await loadTopWorkersData(timeFilters.topWorkersRange)
        
        setDashboardData(prev => ({
          ...prev,
          topWorkers: topWorkersData
        }))
        
      } catch (error) {
        console.error('❌ Error top trabajadores:', error)
      }
    }
    
    // Solo ejecutar si ya tenemos datos base cargados
    if (!dashboardData.loading) {
      loadFilteredTopWorkersData()
    }
  }, [timeFilters.topWorkersRange, dashboardData.loading]) // ✅ Solo cuando cambia filtro trabajadores

  // Funciones para cargar datos específicos de Supabase
  
  /* 
   * 📊 QUERY 1: TRABAJADORES
   * SELECT id, nombre, estado FROM trabajadores
   * Propósito: Contar total y trabajadores activos
   */
  const loadWorkersData = async () => {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('id, nombre, estado')
    
    if (error) throw error
    
    const active = data?.filter(w => w.estado === 'activo').length || 0
    return { total: data?.length || 0, active }
  }

  /* 
   * 📊 QUERY 2: TURNOS GENERALES (CON PAGINACIÓN COMPLETA)
   * SELECT id, fecha, estado, turno_tipo, pago, cobro FROM turnos
   * Propósito: Estadísticas generales de turnos y turnos del día
   * SOLUCIÓN: Implementar paginación para obtener TODOS los registros (>1000)
   */
  const loadShiftsData = async () => {
    console.log('📊 Cargando TODOS los turnos con paginación...') // Debug
    
    let allData = []
    let start = 0
    const pageSize = 1000
    let hasMore = true
    
    // Paginación para obtener TODOS los registros
    while (hasMore) {
      console.log(`📄 Cargando página ${Math.floor(start/pageSize) + 1} (desde registro ${start})`) // Debug
      
      const { data, error } = await supabase
        .from('turnos')
        .select('id, fecha, estado, turno_tipo, pago, cobro')
        .range(start, start + pageSize - 1)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        allData = [...allData, ...data]
        start += pageSize
        hasMore = data.length === pageSize // Si no devuelve página completa, no hay más
        
        console.log(`✅ Página cargada: ${data.length} registros, Total acumulado: ${allData.length}`) // Debug
      } else {
        hasMore = false
      }
    }
    
    console.log(`🎯 TOTAL FINAL DE TURNOS CARGADOS: ${allData.length}`) // Debug crítico

    const today = new Date().toISOString().split('T')[0]
    const completed = allData?.filter(s => s.estado === 'completado').length || 0
    const programmed = allData?.filter(s => s.estado === 'programado').length || 0
    const cancelled = allData?.filter(s => s.estado === 'cancelado').length || 0
    const todayShifts = allData?.filter(s => s.fecha === today).length || 0

    console.log(`📈 Estadísticas calculadas: Total=${allData.length}, Completados=${completed}, Programados=${programmed}, Cancelados=${cancelled}`) // Debug

    return {
      total: allData?.length || 0,
      completed,
      programmed,
      cancelled,
      today: todayShifts
    }
  }

  /* 
   * 📊 QUERY 3: DATOS FINANCIEROS (CON FILTROS)
   * SELECT pago, cobro FROM turnos WHERE estado = 'completado' [+ filtros temporales]
   * Propósito: Calcular ingresos, costos y margen operativo
   */
  const loadFinancialData = async (financialRange) => {
    console.log('💰 Cargando datos financieros con filtro:', financialRange) // Debug
    
    let query = supabase
      .from('turnos')
      .select('pago, cobro, fecha')
      .eq('estado', 'completado')

    // LÓGICA CORREGIDA: Aplicar filtros basados en datos disponibles
    let filterDate = null
    
    if (financialRange === 'month') {
      // Mostrar solo los últimos 30 días de datos disponibles
      const { data: allData } = await supabase
        .from('turnos')
        .select('fecha')
        .eq('estado', 'completado')
        .order('fecha', { ascending: false })
        .limit(1)
      
      if (allData?.length > 0) {
        const fechaMasReciente = new Date(allData[0].fecha)
        fechaMasReciente.setDate(fechaMasReciente.getDate() - 30)
        filterDate = fechaMasReciente.toISOString().split('T')[0]
        query = query.gte('fecha', filterDate)
      }
    } else if (financialRange === 'year') {
      // Mostrar solo los últimos 365 días de datos disponibles
      const { data: allData } = await supabase
        .from('turnos')
        .select('fecha')
        .eq('estado', 'completado')
        .order('fecha', { ascending: false })
        .limit(1)
      
      if (allData?.length > 0) {
        const fechaMasReciente = new Date(allData[0].fecha)
        fechaMasReciente.setDate(fechaMasReciente.getDate() - 365)
        filterDate = fechaMasReciente.toISOString().split('T')[0]
        query = query.gte('fecha', filterDate)
      }
    }
    // Para 'all', no aplicar filtros
    
    console.log('💰 Filtro fecha aplicado:', { financialRange, filterDate }) // Debug crítico
    
    // ✅ SOLUCIÓN: Implementar paginación para datos financieros
    let allFinancialData = []
    let start = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      console.log(`💰 Cargando página financiera ${Math.floor(start/pageSize) + 1} (desde ${start})`) // Debug
      
      let pageQuery = supabase
        .from('turnos')
        .select('pago, cobro, fecha')
        .eq('estado', 'completado')
        .range(start, start + pageSize - 1)
      
      // Aplicar filtros de fecha si existen
      if (filterDate) {
        pageQuery = pageQuery.gte('fecha', filterDate)
      }
      
      const { data: pageData, error } = await pageQuery
      
      if (error) throw error
      
      if (pageData && pageData.length > 0) {
        allFinancialData = [...allFinancialData, ...pageData]
        start += pageSize
        hasMore = pageData.length === pageSize
        
        console.log(`💰 Página financiera cargada: ${pageData.length} registros, Total: ${allFinancialData.length}`) // Debug
      } else {
        hasMore = false
      }
    }

    console.log('💰 TOTAL REGISTROS FINANCIEROS CARGADOS:', allFinancialData.length) // Debug crítico

    const totalCosts = allFinancialData?.reduce((sum, s) => sum + (s.pago || 0), 0) || 0
    const totalIncome = allFinancialData?.reduce((sum, s) => sum + (s.cobro || 0), 0) || 0
    const margin = totalIncome - totalCosts
    const marginPercent = totalIncome > 0 ? ((margin / totalIncome) * 100) : 0

    console.log('💰 Datos financieros calculados:', { totalIncome, totalCosts, margin, registros: allFinancialData?.length }) // Debug

    return {
      totalIncome,
      totalCosts,
      margin,
      marginPercent: Math.round(marginPercent * 100) / 100
    }
  }

  /* 
   * 📊 QUERY 4: TENDENCIAS TEMPORALES (CON FILTROS)
   * SELECT fecha, estado, pago, cobro FROM turnos 
   * WHERE estado = 'completado' AND fecha >= [fecha_inicio]
   * ORDER BY fecha ASC
   * Propósito: Gráfico de evolución temporal de ingresos/costos/turnos
   */
  const loadTrendsData = async (trendsRange) => {
    console.log('📈 Cargando tendencias con filtro:', trendsRange, 'días') // Debug
    
    // LÓGICA CORREGIDA: Obtener los últimos N días de datos disponibles
    let filterDate = null
    
    // Obtener la fecha más reciente de los datos
    const { data: recentData } = await supabase
      .from('turnos')
      .select('fecha')
      .eq('estado', 'completado')
      .order('fecha', { ascending: false })
      .limit(1)
    
    if (recentData?.length > 0) {
      const fechaMasReciente = new Date(recentData[0].fecha)
      fechaMasReciente.setDate(fechaMasReciente.getDate() - trendsRange)
      filterDate = fechaMasReciente.toISOString().split('T')[0]
    } else {
      // Fallback: usar fecha actual
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - trendsRange)
      filterDate = startDate.toISOString().split('T')[0]
    }
    
    console.log('📈 Filtro fecha aplicado:', { trendsRange, filterDate }) // Debug crítico
    
    // ✅ SOLUCIÓN: Implementar paginación para datos de tendencias
    let allTrendsData = []
    let start = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      console.log(`📈 Cargando página tendencias ${Math.floor(start/pageSize) + 1} (desde ${start})`) // Debug
      
      const { data: pageData, error } = await supabase
        .from('turnos')
        .select('fecha, estado, pago, cobro')
        .gte('fecha', filterDate)
        .eq('estado', 'completado')
        .range(start, start + pageSize - 1)
        .order('fecha', { ascending: true })
      
      if (error) throw error
      
      if (pageData && pageData.length > 0) {
        allTrendsData = [...allTrendsData, ...pageData]
        start += pageSize
        hasMore = pageData.length === pageSize
        
        console.log(`📈 Página tendencias cargada: ${pageData.length} registros, Total: ${allTrendsData.length}`) // Debug
      } else {
        hasMore = false
      }
    }

    console.log('📈 TOTAL REGISTROS TENDENCIAS CARGADOS:', allTrendsData.length) // Debug crítico

    // Agrupar por fecha
    const dailyData = {}
    allTrendsData?.forEach(shift => {
      if (!dailyData[shift.fecha]) {
        dailyData[shift.fecha] = { date: shift.fecha, shifts: 0, income: 0, costs: 0 }
      }
      dailyData[shift.fecha].shifts++
      dailyData[shift.fecha].income += shift.cobro || 0
      dailyData[shift.fecha].costs += shift.pago || 0
    })

    const daily = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date))

    console.log('📈 Tendencias calculadas:', { registros: allTrendsData?.length, días: daily.length }) // Debug

    return { daily, weekly: [] }
  }

  /* 
   * 📊 QUERY 5: TOP TRABAJADORES (CON FILTROS)
   * SELECT trabajador_id, estado, pago, trabajador.nombre 
   * FROM turnos 
   * LEFT JOIN trabajadores ON turnos.trabajador_id = trabajadores.id
   * WHERE estado = 'completado' [+ filtros temporales]
   * Propósito: Ranking de trabajadores por número de turnos
   */
  const loadTopWorkersData = async (topWorkersRange) => {
    console.log('👥 Cargando top workers con filtro:', topWorkersRange) // Debug
    
    let query = supabase
      .from('turnos')
      .select(`
        trabajador_id,
        estado,
        pago,
        fecha,
        trabajador:trabajador_id (
          nombre
        )
      `)
      .eq('estado', 'completado')

    // Aplicar filtros temporales CORREGIDOS con datos disponibles
    let filterDate = null
    if (topWorkersRange === 'month' || topWorkersRange === 'year') {
      // LÓGICA CORREGIDA: Obtener fechas de los datos disponibles
      const { data: recentData } = await supabase
        .from('turnos')
        .select('fecha')
        .eq('estado', 'completado')
        .order('fecha', { ascending: false })
        .limit(1)
      
      if (recentData?.length > 0) {
        const fechaMasReciente = new Date(recentData[0].fecha)
        if (topWorkersRange === 'month') {
          fechaMasReciente.setDate(fechaMasReciente.getDate() - 30) // Últimos 30 días de datos
        } else if (topWorkersRange === 'year') {
          fechaMasReciente.setDate(fechaMasReciente.getDate() - 365) // Últimos 365 días de datos
        }
        filterDate = fechaMasReciente.toISOString().split('T')[0]
        query = query.gte('fecha', filterDate)
      } else if (topWorkersRange === 'month') {
        // Fallback: usar fecha actual
        filterDate = new Date()
        filterDate.setMonth(filterDate.getMonth() - 1)
        filterDate = filterDate.toISOString().split('T')[0]
        query = query.gte('fecha', filterDate)
      } else if (topWorkersRange === 'year') {
        // Fallback: usar fecha actual
        filterDate = new Date()
        filterDate.setFullYear(filterDate.getFullYear() - 1)
        filterDate = filterDate.toISOString().split('T')[0] 
        query = query.gte('fecha', filterDate)
      }
    }
    
    console.log('👥 Filtro fecha aplicado:', { topWorkersRange, filterDate }) // Debug crítico
    
    // ✅ SOLUCIÓN: Implementar paginación para datos de trabajadores
    let allWorkersData = []
    let start = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      console.log(`👥 Cargando página trabajadores ${Math.floor(start/pageSize) + 1} (desde ${start})`) // Debug
      
      let pageQuery = supabase
        .from('turnos')
        .select(`
          trabajador_id,
          estado,
          pago,
          fecha,
          trabajador:trabajador_id (
            nombre
          )
        `)
        .eq('estado', 'completado')
        .range(start, start + pageSize - 1)
      
      // Aplicar filtro de fecha si existe
      if (filterDate) {
        pageQuery = pageQuery.gte('fecha', filterDate)
      }
      
      const { data: pageData, error } = await pageQuery
      
      if (error) throw error
      
      if (pageData && pageData.length > 0) {
        allWorkersData = [...allWorkersData, ...pageData]
        start += pageSize
        hasMore = pageData.length === pageSize
        
        console.log(`👥 Página trabajadores cargada: ${pageData.length} registros, Total: ${allWorkersData.length}`) // Debug
      } else {
        hasMore = false
      }
    }

    console.log('👥 TOTAL REGISTROS TRABAJADORES CARGADOS:', allWorkersData.length) // Debug crítico

    // Agrupar por trabajador
    const workerStats = {}
    allWorkersData?.forEach(shift => {
      const workerId = shift.trabajador_id
      if (!workerStats[workerId]) {
        workerStats[workerId] = {
          id: workerId,
          name: shift.trabajador?.nombre || 'Trabajador Desconocido',
          shifts: 0,
          totalPay: 0
        }
      }
      workerStats[workerId].shifts++
      workerStats[workerId].totalPay += shift.pago || 0
    })

    const topWorkers = Object.values(workerStats)
      .sort((a, b) => b.shifts - a.shifts)
      .slice(0, 5)

    console.log('👥 Top workers calculados:', { registros: allWorkersData?.length, trabajadores: topWorkers.length }) // Debug

    return topWorkers
  }

  const calculateShiftDistribution = (shiftsData) => {
    const { total, completed, programmed, cancelled } = shiftsData
    return [
      { name: 'Completados', value: completed, color: '#10b981' },
      { name: 'Programados', value: programmed, color: '#3b82f6' },
      { name: 'Cancelados', value: cancelled, color: '#ef4444' }
    ]
  }

  const generateAlerts = (workers, shifts, financial) => {
    const alerts = []
    
    if (workers.active < workers.total * 0.8) {
      alerts.push({
        type: 'warning',
        message: `Solo ${workers.active} de ${workers.total} trabajadores activos`,
        priority: 'high'
      })
    }

    if (shifts.today === 0) {
      alerts.push({
        type: 'info',
        message: 'No hay turnos programados para hoy',
        priority: 'medium'
      })
    }

    if (financial.marginPercent < 20 && financial.totalIncome > 0) {
      alerts.push({
        type: 'error',
        message: `Margen bajo: ${financial.marginPercent}%`,
        priority: 'critical'
      })
    }

    return alerts
  }

  // Formatear números para mostrar
  const formatCurrency = (value) => {
    return `$${value.toLocaleString('es-CL')}`
  }

  const formatPercent = (value) => {
    return `${value > 0 ? '+' : ''}${value}%`
  }

  // ✅ OPTIMIZACIÓN: Memoizar opciones de gráficos para evitar re-renders innecesarios
  const getTrendsChartOption = useMemo(() => {
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
      legend: {
        data: ['Ingresos', 'Costos', 'Turnos'],
        textStyle: { color: '#64748b' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dashboardData.trends.daily.map(d => {
          const date = new Date(d.date)
          return `${date.getDate()}/${date.getMonth() + 1}`
        }),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Millones (CLP)',
          position: 'left',
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: { 
            color: '#64748b',
            formatter: (value) => `$${(value/1000000).toFixed(1)}M`
          }
        },
        {
          type: 'value',
          name: 'Turnos',
          position: 'right',
          axisLine: { lineStyle: { color: '#e2e8f0' } },
          axisLabel: { color: '#64748b' }
        }
      ],
      series: [
        {
          name: 'Ingresos',
          type: 'line',
          data: dashboardData.trends.daily.map(d => d.income),
          smooth: true,
          lineStyle: { color: '#10b981', width: 3 },
          areaStyle: { color: 'rgba(16, 185, 129, 0.1)' }
        },
        {
          name: 'Costos',
          type: 'line',
          data: dashboardData.trends.daily.map(d => d.costs),
          smooth: true,
          lineStyle: { color: '#ef4444', width: 3 },
          areaStyle: { color: 'rgba(239, 68, 68, 0.1)' }
        },
        {
          name: 'Turnos',
          type: 'line',
          yAxisIndex: 1,
          data: dashboardData.trends.daily.map(d => d.shifts),
          smooth: true,
          lineStyle: { color: '#3b82f6', width: 3 }
        }
      ]
    }
  }, [dashboardData.trends.daily]); // ✅ Solo se recalcula cuando cambian las tendencias

  const getShiftDistributionChartOption = useMemo(() => {
    if (!dashboardData.shiftDistribution?.length) return null
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: '#64748b' }
      },
      series: [
        {
          name: 'Turnos',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: dashboardData.shiftDistribution.map(item => ({
            value: item.value,
            name: item.name,
            itemStyle: { color: item.color }
          }))
        }
      ]
    }
  }, [dashboardData.shiftDistribution]); // ✅ Solo se recalcula cuando cambia distribución

  // ✅ OPTIMIZACIÓN: Memoizar handlers de filtros para prevenir re-renders
  const handleFinancialFilter = useCallback((newFilter) => {
    console.log('💰 Cambiando filtro financiero:', newFilter)
    setTimeFilters(prev => ({ ...prev, financialRange: newFilter }))
  }, [])
  
  const handleTrendsFilter = useCallback((newFilter) => {
    console.log('📈 Cambiando filtro tendencias:', newFilter)
    setTimeFilters(prev => ({ ...prev, trendsRange: newFilter }))
  }, [])
  
  const handleTopWorkersFilter = useCallback((newFilter) => {
    console.log('👥 Cambiando filtro trabajadores:', newFilter)
    setTimeFilters(prev => ({ ...prev, topWorkersRange: newFilter }))
  }, [])

  // Renderizado condicional para carga
  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header con personalidad */}
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
            <div className="text-right">
              <p className="text-sm text-gray-500">Actualizado ahora</p>
              <p className="text-lg font-semibold text-gray-700">
                {new Date().toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Financiero Central - PRIORIDAD CRÍTICA */}
      <div className="space-y-4">
        {/* Filtros Financieros */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Filtros Financieros:</span>
            {dashboardData.loading && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                <span>Actualizando...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleFinancialFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeFilters.financialRange === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todo
            </button>
            <button
              type="button"
              onClick={() => handleFinancialFilter('year')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeFilters.financialRange === 'year' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Año
            </button>
            <button
              type="button"
              onClick={() => handleFinancialFilter('month')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeFilters.financialRange === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mes
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
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.financial.totalIncome)}
              </p>
              <p className="text-xs text-gray-500">
                {timeFilters.financialRange === 'all' ? 'Total histórico' : 
                 timeFilters.financialRange === 'year' ? 'Último año' : 'Último mes'} cobrado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Costos Operativos */}
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
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.financial.totalCosts)}
              </p>
              <p className="text-xs text-gray-500">Total pagado trabajadores</p>
            </div>
          </CardContent>
        </Card>

        {/* Margen Operativo */}
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
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.financial.margin)}
              </p>
              <p className="text-xs text-gray-500">
                Rentabilidad: {formatPercent(dashboardData.financial.marginPercent)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI Crítico */}
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
              <p className="text-xs text-gray-500">Tasa completitud turnos</p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* KPIs Operacionales - PRIORIDAD CRÍTICA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Trabajadores */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Trabajadores</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dashboardData.workers.active}/{dashboardData.workers.total}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                {dashboardData.workers.active} activos
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Turnos Hoy */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Turnos Hoy</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dashboardData.shifts.today}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                Programados
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Turnos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                  <p className="text-xl font-bold text-gray-900">
                    {dashboardData.shifts.total}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                {dashboardData.shifts.completed} completados
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado Sistema */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Sistema</p>
                  <p className="text-xl font-bold text-green-600">
                    ACTIVO
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                En línea
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principales - PRIORIDAD ALTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencias de Ingresos y Turnos */}
        <Card className="hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Evolución Temporal ({timeFilters.trendsRange} días)
                </CardTitle>
                <CardDescription>
                  Análisis de ingresos, costos y turnos completados
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleTrendsFilter(7)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    timeFilters.trendsRange === 7 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  7d
                </button>
                <button
                  type="button"
                  onClick={() => handleTrendsFilter(30)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    timeFilters.trendsRange === 30 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  30d
                </button>
                <button
                  type="button"
                  onClick={() => handleTrendsFilter(90)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    timeFilters.trendsRange === 90 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  90d
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dashboardData.trends.daily.length > 0 && getTrendsChartOption ? (
                <ReactECharts 
                  option={getTrendsChartOption} 
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sin datos históricos disponibles</p>
                  </div>
                </div>
              )}
            </div>
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
                  Ranking por número de turnos completados - 
                  {timeFilters.topWorkersRange === 'all' ? 'Histórico' : 
                   timeFilters.topWorkersRange === 'year' ? 'Último año' : 'Último mes'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleTopWorkersFilter('all')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    timeFilters.topWorkersRange === 'all' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todo
                </button>
                <button
                  type="button"
                  onClick={() => handleTopWorkersFilter('year')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    timeFilters.topWorkersRange === 'year' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Año
                </button>
                <button
                  type="button"
                  onClick={() => handleTopWorkersFilter('month')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    timeFilters.topWorkersRange === 'month' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Mes
                </button>
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
                      <p className="text-xs text-gray-500">{formatCurrency(worker.totalPay)} pagado</p>
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
          </CardContent>
        </Card>
      </div>

      {/* Análisis Operativo - PRIORIDAD MEDIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución de Turnos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Estado de Turnos
            </CardTitle>
            <CardDescription>
              Distribución por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dashboardData.shiftDistribution.some(d => d.value > 0) && getShiftDistributionChartOption ? (
                <ReactECharts 
                  option={getShiftDistributionChartOption} 
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
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

        {/* Resumen de Estados */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Resumen Operativo
            </CardTitle>
            <CardDescription>
              Métricas de estado actual
            </CardDescription>
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

        {/* Alertas Críticas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Alertas del Sistema
            </CardTitle>
            <CardDescription>
              Notificaciones importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.alerts.length > 0 ? dashboardData.alerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-start gap-2">
                    {alert.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />}
                    {alert.type === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />}
                    {alert.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        alert.type === 'error' ? 'text-red-900' :
                        alert.type === 'warning' ? 'text-orange-900' :
                        'text-blue-900'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Prioridad: {alert.priority}
                      </p>
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

      {/* Footer con información adicional */}
      <Card className="bg-gradient-to-r from-gray-50 via-blue-50 to-orange-50 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">TransApp Dashboard</h3>
                <p className="text-gray-600 text-sm">
                  Control Central de Gestión de Flota - Datos en tiempo real desde Supabase PostgreSQL
                </p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-500">Próxima actualización automática</p>
              <p className="text-xs text-gray-400">en 30 segundos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
