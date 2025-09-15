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

  // Estados para filtros temporales - CONFIGURADOS CON VALORES GRANULARES
  const [timeFilters, setTimeFilters] = useState({
    trendsRange: 7, // 7 días (más granular)
    topWorkersRange: 'month', // mes (más granular que 'all')
    financialRange: 'month' // mes (más granular que 'all')
  })

  const supabase = getSupabaseClient()

  /* 
   * 📊 QUERY 1: TRABAJADORES (CORREGIDA - FUNCIONA PERFECTAMENTE)
   */
  const loadWorkersData = async () => {
    console.log('👥 Cargando estadísticas de trabajadores...')
    
    try {
      // ✅ SUPABASE: Contar trabajadores con count exacto
      const { count: totalCount, error: totalError } = await supabase
        .from('trabajadores')
        .select('*', { count: 'exact', head: true })
      
      if (totalError) throw totalError

      const { count: activeCount, error: activeError } = await supabase
        .from('trabajadores')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo')
      
      if (activeError) throw activeError

      console.log('👥 ✅ TRABAJADORES:', { total: totalCount, active: activeCount })

      return { 
        total: totalCount || 0, 
        active: activeCount || 0 
      }

    } catch (error) {
      console.error('❌ Error en trabajadores:', error)
      return { total: 0, active: 0 }
    }
  }

  /* 
   * 📊 QUERY 2: TURNOS (CORREGIDA - PROMISE.ALL OPTIMIZADO)
   */
  const loadShiftsData = async () => {
    console.log('📊 Cargando estadísticas de turnos...')
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // ✅ SUPABASE: Ejecutar todas las queries en paralelo
      const [
        totalResult,
        completedResult, 
        programmedResult,
        cancelledResult,
        todayResult
      ] = await Promise.all([
        // Query 1: Total general de turnos
        supabase.from('turnos').select('*', { count: 'exact', head: true }),
        
        // Query 2: Turnos completados
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('estado', 'completado'),
        
        // Query 3: Turnos programados
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('estado', 'programado'),
        
        // Query 4: Turnos cancelados  
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('estado', 'cancelado'),
        
        // Query 5: Turnos de hoy
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('fecha', today)
      ])

      // ✅ VERIFICAR ERRORES
      if (totalResult.error) throw totalResult.error
      if (completedResult.error) throw completedResult.error  
      if (programmedResult.error) throw programmedResult.error
      if (cancelledResult.error) throw cancelledResult.error
      if (todayResult.error) throw todayResult.error

      // ✅ EXTRAER COUNTS DIRECTAMENTE
      const total = totalResult.count || 0
      const completed = completedResult.count || 0
      const programmed = programmedResult.count || 0  
      const cancelled = cancelledResult.count || 0
      const todayShifts = todayResult.count || 0

      console.log('📊 ✅ TURNOS:', {
        total,
        completed,
        programmed,
        cancelled,
        today: todayShifts,
        fecha_hoy: today
      })

      return {
        total,
        completed, 
        programmed,
        cancelled,
        today: todayShifts
      }

    } catch (error) {
      console.error('❌ Error en turnos:', error)
      return { total: 0, completed: 0, programmed: 0, cancelled: 0, today: 0 }
    }
  }

  /* 
   * 📊 QUERY 3: DATOS FINANCIEROS (YA FUNCIONA PERFECTAMENTE - CONSERVADO EXACTO)
   * Esta función YA está funcionando correctamente según usuario
   */
  const loadFinancialData = async (financialRange) => {
    console.log('💰 Cargando datos financieros SIN LÍMITES, filtro:', financialRange)
    
    let filterDateStart = null
    let filterDateEnd = null
    
    if (financialRange === 'month') {
      filterDateStart = '2025-09-01'
      filterDateEnd = '2025-09-30'
      console.log('💰 Filtro MES aplicado (SEPTIEMBRE 2025):', { filterDateStart, filterDateEnd })
    } else if (financialRange === 'year') {
      filterDateStart = '2025-01-01'
      filterDateEnd = '2025-12-31'
      console.log('💰 Filtro AÑO aplicado (2025):', { filterDateStart, filterDateEnd })
    }
    
    try {
      console.log('💰 🚀 Ejecutando query SIN LÍMITES para agregación completa...')
      
      let baseQuery = supabase
        .from('turnos')
        .select('pago, cobro, estado, fecha')
      
      if (filterDateStart && filterDateEnd) {
        baseQuery = baseQuery
          .gte('fecha', filterDateStart)
          .lte('fecha', filterDateEnd)
      }
      
      const { data: allData, error } = await baseQuery
      
      if (error) {
        console.error('💰 ❌ Error en query completa:', error)
        throw error
      }

      console.log('💰 ✅ TODOS los datos recibidos:', {
        totalRegistros: allData?.length || 0,
        periodo: `${filterDateStart} hasta ${filterDateEnd}`,
        metodo: 'Query completa SIN límites'
      })
      
      let totalCosts = 0
      let totalIncome = 0
      let registrosCompletados = 0
      
      allData?.forEach(record => {
        if (record.pago && record.pago > 0) {
          totalCosts += record.pago
        }
        
        if (record.cobro && record.cobro > 0) {
          totalIncome += record.cobro
        }
        
        if (record.estado === 'completado') {
          registrosCompletados++
        }
      })
      
      const margin = totalIncome - totalCosts
      const marginPercent = totalIncome > 0 ? (margin / totalIncome) : 0

      console.log('💰 ✅ RESULTADO FINANCIERO FINAL:', {
        totalIncome: `$${totalIncome.toLocaleString('es-CL')}`,
        totalCosts: `$${totalCosts.toLocaleString('es-CL')}`, 
        margin: `$${margin.toLocaleString('es-CL')}`,
        marginPercent: `${Math.round(marginPercent * 100)}%`,
        registrosCompletados,
        registrosProcesados: allData?.length || 0
      })

      return {
        totalIncome,
        totalCosts,
        margin,
        marginPercent: Math.round(marginPercent * 100) / 100
      }

    } catch (error) {
      console.error('💰 ❌ Error crítico en datos financieros:', error)
      throw error
    }
  }

  // ✅ EFECTOS SEPARADOS PARA CARGAS ESPECÍFICAS (CORREGIDOS)
  
  // 1. Carga inicial (UNA VEZ)
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🚀 Carga inicial dashboard...')
      setDashboardData(prev => ({ ...prev, loading: true }))
      
      try {
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
        
        console.log('🚀 ✅ Carga inicial completada')
        
      } catch (error) {
        console.error('❌ Error carga inicial:', error)
        setDashboardData(prev => ({ ...prev, loading: false }))
      }
    }
    
    loadInitialData()
  }, [])
  
  // 2. Carga datos financieros (cuando cambia filtro)
  useEffect(() => {
    const loadFinancials = async () => {
      if (dashboardData.loading) return
      
      try {
        console.log('💰 Recargando datos financieros...')
        const financialData = await loadFinancialData(timeFilters.financialRange)
        
        setDashboardData(prev => ({
          ...prev,
          financial: financialData
        }))
        
      } catch (error) {
        console.error('❌ Error carga financiera:', error)
      }
    }
    
    loadFinancials()
  }, [timeFilters.financialRange, dashboardData.loading])

  // ✅ FUNCIONES AUXILIARES ORIGINALES (RECUPERADAS DEL DASHBOARD ESPECTACULAR)
  
  const calculateShiftDistribution = (shiftsData) => {
    const { total, completed, programmed, cancelled } = shiftsData
    return [
      { name: 'Completados', value: completed, color: '#10b981' },
      { name: 'Programados', value: programmed, color: '#f59e0b' },
      { name: 'Cancelados', value: cancelled, color: '#ef4444' }
    ]
  }

  const generateAlerts = (workersData, shiftsData, financialData) => {
    const alerts = []
    
    if (shiftsData.today === 0) {
      alerts.push({
        type: 'warning',
        message: 'No hay turnos programados para hoy'
      })
    }
    
    if (workersData.active < 5) {
      alerts.push({
        type: 'info',
        message: `Solo ${workersData.active} trabajadores activos disponibles`
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

  // Handlers para filtros (CORREGIDOS)
  const handleFinancialFilter = useCallback((newFilter) => {
    setTimeFilters(prev => ({ ...prev, financialRange: newFilter }))
  }, [])

  const handleTrendsFilter = useCallback((newFilter) => {
    setTimeFilters(prev => ({ ...prev, trendsRange: newFilter }))
  }, [])

  const handleTopWorkersFilter = useCallback((newFilter) => {
    setTimeFilters(prev => ({ ...prev, topWorkersRange: newFilter }))
  }, [])

  // ✅ OPCIÓN DE GRÁFICO DE DISTRIBUCIÓN DE TURNOS MEMOIZADA
  const getShiftDistributionOption = useMemo(() => {
    if (!dashboardData.shiftDistribution.length) return null
    
    return {
      title: {
        text: 'Distribución de Turnos',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1e40af'
        }
      },
      tooltip: {
        trigger: 'item'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: dashboardData.shiftDistribution.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color
          }
        }))
      }]
    }
  }, [dashboardData.shiftDistribution])

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-600 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-xl font-medium bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Cargando Dashboard Inteligente...
          </p>
          <p className="mt-2 text-gray-500">Procesando métricas avanzadas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* 🎨 HEADER ESPECTACULAR CON GRADIENTES */}
      <div className="mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-orange-600/10 rounded-2xl transform -skew-y-1"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-3">
                Dashboard TransApp ⚡
              </h1>
              <p className="text-gray-600 text-lg">Panel de Control Inteligente • Datos en Tiempo Real</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-400 to-green-600 p-3 rounded-full animate-pulse">
                <Activity className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 ALERTAS DINÁMICAS */}
      {dashboardData.alerts?.length > 0 && (
        <div className="mb-6 space-y-3">
          {dashboardData.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-l-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] ${
                alert.type === 'warning' ? 
                  'bg-orange-50/80 border-orange-500 text-orange-800' :
                  'bg-blue-50/80 border-blue-500 text-blue-800'
              }`}
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <p className="font-medium">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎯 KPI CARDS ESPECTACULARES - DISEÑO ORIGINAL RECUPERADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 👥 Trabajadores Activos - CARD ORIGINAL CON ANIMACIONES */}
        <div className="group cursor-pointer">
          <div className="bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:rotate-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="bg-blue-100 px-3 py-1 rounded-full">
                <span className="text-xs font-semibold text-blue-600">ACTIVOS</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">Trabajadores Activos</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {dashboardData.workers.active}
                </span>
                <span className="text-sm text-gray-500">de {dashboardData.workers.total}</span>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${dashboardData.workers.total > 0 ? (dashboardData.workers.active / dashboardData.workers.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-blue-600 font-medium">
                  {dashboardData.workers.total > 0 ? Math.round((dashboardData.workers.active / dashboardData.workers.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Total Turnos - CARD ESPECTACULAR CON ANIMACIONES */}
        <div className="group cursor-pointer">
          <div className="bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-rotate-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-xs font-semibold text-green-600">TOTAL</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">Total de Turnos</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {dashboardData.shifts.total}
                </span>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{dashboardData.shifts.completed}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Completados</div>
                  <div className="text-sm font-bold text-green-600">{dashboardData.shifts.completed}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Programados</div>
                  <div className="text-sm font-bold text-orange-600">{dashboardData.shifts.programmed}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Cancelados</div>
                  <div className="text-sm font-bold text-red-600">{dashboardData.shifts.cancelled}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 💰 Ingresos - CARD FINANCIERA ESPECTACULAR */}
        <div className="group cursor-pointer">
          <div className="bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:rotate-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                <Flame className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 uppercase">Financiero</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">Ingresos Totales</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                  {formatCurrency(dashboardData.financial.totalIncome)}
                </span>
              </div>
              
              {/* Filtros Financieros Integrados */}
              <div className="flex space-x-1 pt-2">
                <button
                  onClick={() => handleFinancialFilter('month')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    timeFilters.financialRange === 'month'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => handleFinancialFilter('year')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    timeFilters.financialRange === 'year'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  }`}
                >
                  Año
                </button>
                <button
                  onClick={() => handleFinancialFilter('all')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    timeFilters.financialRange === 'all'
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  }`}
                >
                  Todo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ⏰ Turnos Hoy - CARD TIEMPO REAL */}
        <div className="group cursor-pointer">
          <div className="bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-rotate-1">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="bg-orange-100 px-3 py-1 rounded-full animate-pulse">
                <span className="text-xs font-semibold text-orange-600">HOY</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">Turnos de Hoy</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {dashboardData.shifts.today}
                </span>
                <div className="flex items-center">
                  {dashboardData.shifts.today > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('es-CL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                {dashboardData.shifts.today === 0 && (
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping mr-2"></div>
                    <span className="text-xs text-orange-600 font-medium">Sin turnos programados</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 SECCIÓN ANÁLISIS AVANZADO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Panel Financiero Detallado */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/60">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                Análisis Financiero
              </h2>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Período: {timeFilters.financialRange}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Costos */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">Costos Operativos</span>
                  <Target className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboardData.financial.totalCosts)}
                </div>
              </div>

              {/* Margen */}
              <div className={`bg-gradient-to-br p-4 rounded-xl ${
                dashboardData.financial.margin >= 0 
                  ? 'from-green-50 to-green-100' 
                  : 'from-red-50 to-red-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Margen de Ganancia</span>
                  <TrendingUp className={`h-4 w-4 ${
                    dashboardData.financial.margin >= 0 ? 'text-green-500' : 'text-red-500'
                  }`} />
                </div>
                <div className={`text-2xl font-bold ${
                  dashboardData.financial.margin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(dashboardData.financial.margin)}
                </div>
                <div className="text-xs text-gray-600">
                  {formatPercent(Math.round(dashboardData.financial.marginPercent * 100))} del total
                </div>
              </div>

              {/* ROI */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Retorno de Inversión</span>
                  <Trophy className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercent(Math.round(dashboardData.financial.marginPercent * 100))}
                </div>
                <div className="text-xs text-blue-600">
                  {dashboardData.financial.margin >= 0 ? 'Rentable' : 'Pérdida'}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Gráfico Distribución */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Distribución de Turnos</h3>
            <PieChart className="h-5 w-5 text-gray-600" />
          </div>
          
          {getShiftDistributionOption ? (
            <ReactECharts 
              option={getShiftDistributionOption}
              style={{ height: '300px' }}
              className="w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay datos disponibles</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 🔥 FOOTER CON ESTADÍSTICAS RÁPIDAS */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-6 text-white shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-400">{dashboardData.shifts.completed}</div>
            <div className="text-sm text-gray-300">Turnos Completados</div>
          </div>

          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400">{dashboardData.workers.active}</div>
            <div className="text-sm text-gray-300">Personal Activo</div>
          </div>

          <div className="text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-blue-400">
              {dashboardData.shifts.total > 0 ? Math.round((dashboardData.shifts.completed / dashboardData.shifts.total) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-300">Eficiencia</div>
          </div>

          <div className="text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold text-orange-400">
              {formatPercent(Math.round(dashboardData.financial.marginPercent * 100))}
            </div>
            <div className="text-sm text-gray-300">Rentabilidad</div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard