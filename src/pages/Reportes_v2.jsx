import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, FileSpreadsheet, Users, Clock, Activity, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import ExcelJS from 'exceljs'
import { getPersonas, getTurnos, getResumenFinanciero } from '@/services/supabaseHelpers'

const Reportes = () => {
  const [loading, setLoading] = useState(true)
  const [personas, setPersonas] = useState([])
  const [turnos, setTurnos] = useState([])
  const [resumenFinanciero, setResumenFinanciero] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar todas las personas (sin paginación para análisis completo)
      const { data: personasData, error: personasError } = await getPersonas(1, 1000)
      if (!personasError && personasData) {
        setPersonas(personasData)
      } else {
        setPersonas([])
      }

      // Cargar todos los turnos
      const { data: turnosData, error: turnosError } = await getTurnos({})
      if (!turnosError && turnosData) {
        setTurnos(turnosData)
      } else {
        setTurnos([])
      }

      // Cargar resumen financiero
      const { data: finanzasData, error: finanzasError } = await getResumenFinanciero({})
      if (!finanzasError && finanzasData) {
        setResumenFinanciero(finanzasData)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // ==================== VISUALIZACIONES AVANZADAS ====================

  // 1. HEATMAP DE COBERTURA HORARIA - Qué horas tienen más trabajadores
  const getHeatmapCoberturaHoraria = () => {
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const horas = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    
    // Matriz de cobertura [día][hora] = cantidad de personas
    const matrizCobertura = Array(7).fill(null).map(() => Array(24).fill(0))
    
    turnos.filter(t => t.estado === 'completado' && t.hora_inicio && t.hora_fin && t.fecha).forEach(turno => {
      const fecha = new Date(turno.fecha + 'T00:00:00')
      const diaSemana = (fecha.getDay() + 6) % 7 // Lunes = 0
      
      const horaInicio = parseInt(turno.hora_inicio.split(':')[0])
      const horaFin = parseInt(turno.hora_fin.split(':')[0])
      
      for (let h = horaInicio; h < horaFin && h < 24; h++) {
        matrizCobertura[diaSemana][h]++
      }
    })

    const data = []
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (matrizCobertura[d][h] > 0) {
          data.push([h, d, matrizCobertura[d][h]])
        }
      }
    }

    if (data.length === 0) return null

    const maxValue = Math.max(...data.map(d => d[2]))

    return {
      title: { 
        text: '🔥 Mapa de Calor: Cobertura por Hora y Día', 
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        position: 'top',
        formatter: (params) => {
          return `${dias[params.value[1]]} ${horas[params.value[0]]}<br/><strong>${params.value[2]}</strong> trabajadores`
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: horas,
        splitArea: { show: true },
        axisLabel: { fontSize: 10, rotate: 45 }
      },
      yAxis: {
        type: 'category',
        data: dias,
        splitArea: { show: true },
        axisLabel: { fontSize: 11 }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '2%',
        inRange: {
          color: ['#e0f2fe', '#0ea5e9', '#0369a1', '#1e3a8a']
        },
        textStyle: { fontSize: 10 }
      },
      series: [{
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          formatter: (params) => params.value[2],
          fontSize: 9,
          color: '#fff',
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }

  // 2. GAUGE DE EFICIENCIA - Porcentaje de turnos completados
  const getGaugeEficiencia = () => {
    const totalTurnos = turnos.length
    const turnosCompletados = turnos.filter(t => t.estado === 'completado').length
    const eficiencia = totalTurnos > 0 ? Math.round((turnosCompletados / totalTurnos) * 100) : 0

    return {
      title: { 
        text: '⚡ Eficiencia de Cumplimiento', 
        left: 'center',
        top: '5%',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        center: ['50%', '70%'],
        radius: '120%',
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 25,
            color: [
              [0.4, '#ef4444'],
              [0.7, '#f59e0b'],
              [1, '#10b981']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '70%',
          width: 8,
          offsetCenter: [0, '-55%'],
          itemStyle: {
            color: '#1f2937'
          }
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 1
          }
        },
        splitLine: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        axisLabel: {
          color: '#374151',
          fontSize: 11,
          distance: -45,
          formatter: (value) => {
            if (value === 0 || value === 50 || value === 100) {
              return value + '%'
            }
            return ''
          }
        },
        title: {
          offsetCenter: [0, '-15%'],
          fontSize: 13,
          color: '#6b7280',
          fontWeight: 'normal'
        },
        detail: {
          fontSize: 32,
          offsetCenter: [0, '5%'],
          valueAnimation: true,
          formatter: '{value}%',
          color: 'auto',
          fontWeight: 'bold'
        },
        data: [{
          value: eficiencia,
          name: 'Turnos Completados'
        }]
      }]
    }
  }

  // 3. RADAR CHART - Análisis multidimensional por tipo de persona
  const getRadarTiposPersona = () => {
    const tiposPersona = {}
    
    personas.forEach(p => {
      const tipo = p.tipo || 'Sin especificar'
      if (!tiposPersona[tipo]) {
        tiposPersona[tipo] = {
          totalTurnos: 0,
          turnosCompletados: 0,
          totalHoras: 0,
          tarifaPromedio: 0,
          count: 0
        }
      }
      
      const turnosP = turnos.filter(t => t.persona_id === p.id)
      const completados = turnosP.filter(t => t.estado === 'completado')
      const horas = completados.reduce((sum, t) => {
        if (t.hora_inicio && t.hora_fin) {
          const inicio = new Date(`2000-01-01T${t.hora_inicio}`)
          const fin = new Date(`2000-01-01T${t.hora_fin}`)
          return sum + (fin - inicio) / (1000 * 60 * 60)
        }
        return sum
      }, 0)
      
      tiposPersona[tipo].totalTurnos += turnosP.length
      tiposPersona[tipo].turnosCompletados += completados.length
      tiposPersona[tipo].totalHoras += horas
      tiposPersona[tipo].tarifaPromedio += (p.tarifa_hora || 0)
      tiposPersona[tipo].count++
    })

    const tipos = Object.keys(tiposPersona)
    if (tipos.length === 0) return null

    // Normalizar valores a escala 0-100
    const maxTurnos = Math.max(...Object.values(tiposPersona).map(v => v.totalTurnos))
    const maxHoras = Math.max(...Object.values(tiposPersona).map(v => v.totalHoras))
    const maxTarifa = Math.max(...Object.values(tiposPersona).map(v => v.tarifaPromedio / v.count))

    const seriesData = tipos.map(tipo => {
      const data = tiposPersona[tipo]
      const eficiencia = data.totalTurnos > 0 ? (data.turnosCompletados / data.totalTurnos) * 100 : 0
      
      return {
        value: [
          maxTurnos > 0 ? (data.totalTurnos / maxTurnos) * 100 : 0,
          eficiencia,
          maxHoras > 0 ? (data.totalHoras / maxHoras) * 100 : 0,
          data.count * 10, // Escalar cantidad de personas
          maxTarifa > 0 ? ((data.tarifaPromedio / data.count) / maxTarifa) * 100 : 0
        ],
        name: tipo
      }
    })

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

    return {
      title: { 
        text: '🎯 Análisis Multidimensional por Tipo', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: '2%',
        left: 'center',
        textStyle: { fontSize: 10 }
      },
      radar: {
        indicator: [
          { name: 'Turnos', max: 100 },
          { name: 'Eficiencia', max: 100 },
          { name: 'Horas', max: 100 },
          { name: 'Cantidad', max: 100 },
          { name: 'Tarifa', max: 100 }
        ],
        radius: '60%',
        center: ['50%', '50%'],
        splitNumber: 4,
        shape: 'polygon',
        name: {
          textStyle: {
            color: '#374151',
            fontSize: 11,
            fontWeight: 'bold'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#d1d5db'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)']
          }
        },
        axisLine: {
          lineStyle: {
            color: '#9ca3af'
          }
        }
      },
      series: [{
        type: 'radar',
        data: seriesData.map((item, index) => ({
          ...item,
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: colors[index % colors.length] + '80' },
              { offset: 1, color: colors[index % colors.length] + '20' }
            ])
          },
          lineStyle: {
            width: 2,
            color: colors[index % colors.length]
          },
          itemStyle: {
            color: colors[index % colors.length]
          }
        }))
      }]
    }
  }

  // 4. TREEMAP - Distribución de costos por persona y tipo
  const getTreemapCostos = () => {
    const tiposData = {}
    
    personas.forEach(p => {
      const tipo = p.tipo || 'Sin especificar'
      const turnosP = turnos.filter(t => t.persona_id === p.id && t.estado === 'completado')
      
      const horas = turnosP.reduce((sum, t) => {
        if (t.hora_inicio && t.hora_fin) {
          const inicio = new Date(`2000-01-01T${t.hora_inicio}`)
          const fin = new Date(`2000-01-01T${t.hora_fin}`)
          return sum + (fin - inicio) / (1000 * 60 * 60)
        }
        return sum
      }, 0)
      
      const costo = horas * (p.tarifa_hora || 0)
      
      if (costo > 0) {
        if (!tiposData[tipo]) {
          tiposData[tipo] = { name: tipo, children: [] }
        }
        tiposData[tipo].children.push({
          name: p.nombre.length > 20 ? p.nombre.substring(0, 17) + '...' : p.nombre,
          value: Math.round(costo)
        })
      }
    })

    const data = Object.values(tiposData)
    if (data.length === 0) return null

    return {
      title: { 
        text: '💰 Distribución de Costos por Persona', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        formatter: (info) => {
          const value = info.value
          return `<strong>${info.name}</strong><br/>$${value.toLocaleString('es-CL')}`
        }
      },
      series: [{
        type: 'treemap',
        data: data,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: (params) => {
            if (params.value > 50000) {
              return `{name|${params.name}}\n{value|$${(params.value / 1000).toFixed(0)}k}`
            }
            return params.name
          },
          rich: {
            name: {
              fontSize: 11,
              fontWeight: 'bold',
              color: '#fff'
            },
            value: {
              fontSize: 10,
              color: '#e0f2fe'
            }
          }
        },
        upperLabel: {
          show: true,
          height: 25,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 12
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          gapWidth: 2
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 3,
              gapWidth: 3
            }
          },
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
              borderWidth: 2,
              gapWidth: 2,
              borderColorSaturation: 0.7
            }
          }
        ],
        visualMin: 0,
        visualMax: Math.max(...data.flatMap(d => d.children.map(c => c.value))),
        colorMappingBy: 'value',
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']
      }]
    }
  }

  // 5. CALENDARIO HEATMAP - Actividad diaria
  const getCalendarioActividad = () => {
    const actividadPorFecha = {}
    
    turnos.forEach(t => {
      if (t.fecha) {
        const fecha = t.fecha.split('T')[0]
        actividadPorFecha[fecha] = (actividadPorFecha[fecha] || 0) + 1
      }
    })

    const data = Object.entries(actividadPorFecha).map(([fecha, count]) => [fecha, count])
    
    if (data.length === 0) return null

    const maxValue = Math.max(...data.map(d => d[1]))

    return {
      title: { 
        text: '📅 Calendario de Actividad', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        formatter: (params) => {
          const fecha = new Date(params.value[0] + 'T00:00:00')
          return `${fecha.toLocaleDateString('es-CL', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}<br/><strong>${params.value[1]}</strong> turnos`
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: '2%',
        pieces: [
          { min: maxValue * 0.75, label: 'Alto', color: '#059669' },
          { min: maxValue * 0.5, max: maxValue * 0.75, label: 'Medio-Alto', color: '#10b981' },
          { min: maxValue * 0.25, max: maxValue * 0.5, label: 'Medio', color: '#fbbf24' },
          { min: 1, max: maxValue * 0.25, label: 'Bajo', color: '#fde047' },
          { value: 0, label: 'Sin datos', color: '#f3f4f6' }
        ],
        textStyle: { fontSize: 9 }
      },
      calendar: {
        top: '15%',
        left: '5%',
        right: '5%',
        bottom: '15%',
        range: data.length > 0 ? [data[0][0], data[data.length - 1][0]] : new Date().toISOString().split('T')[0],
        cellSize: ['auto', 18],
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e5e7eb',
            width: 2,
            type: 'solid'
          }
        },
        yearLabel: { show: true, fontSize: 12, fontWeight: 'bold' },
        monthLabel: { fontSize: 11, color: '#374151' },
        dayLabel: { 
          fontSize: 10, 
          color: '#6b7280',
          nameMap: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        },
        itemStyle: {
          borderWidth: 1.5,
          borderColor: '#fff'
        }
      },
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data
      }]
    }
  }

  // 6. LÍNEA TEMPORAL COMPARATIVA - Evolución mensual
  const getLineaTemporalComparativa = () => {
    const metricas = {}
    
    turnos.forEach(t => {
      if (t.fecha) {
        const fecha = new Date(t.fecha + 'T00:00:00')
        const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        
        if (!metricas[mesAnio]) {
          metricas[mesAnio] = {
            totalTurnos: 0,
            completados: 0,
            programados: 0,
            cancelados: 0
          }
        }
        
        metricas[mesAnio].totalTurnos++
        if (t.estado === 'completado') metricas[mesAnio].completados++
        if (t.estado === 'programado') metricas[mesAnio].programados++
        if (t.estado === 'cancelado') metricas[mesAnio].cancelados++
      }
    })

    const meses = Object.keys(metricas).sort()
    if (meses.length === 0) return null

    const labels = meses.map(m => {
      const [anio, mes] = m.split('-')
      const fecha = new Date(anio, parseInt(mes) - 1)
      return fecha.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    })

    return {
      title: { 
        text: '📈 Evolución Temporal de Estados', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        bottom: '2%',
        left: 'center',
        textStyle: { fontSize: 10 }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
        axisLabel: { fontSize: 10, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        name: 'Turnos',
        nameTextStyle: { fontSize: 11 }
      },
      series: [
        {
          name: 'Completados',
          type: 'line',
          smooth: true,
          data: meses.map(m => metricas[m].completados),
          lineStyle: { width: 3, color: '#10b981' },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ])
          }
        },
        {
          name: 'Programados',
          type: 'line',
          smooth: true,
          data: meses.map(m => metricas[m].programados),
          lineStyle: { width: 3, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          }
        },
        {
          name: 'Cancelados',
          type: 'line',
          smooth: true,
          data: meses.map(m => metricas[m].cancelados),
          lineStyle: { width: 3, color: '#ef4444' },
          itemStyle: { color: '#ef4444' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
            ])
          }
        }
      ]
    }
  }

  // ==================== EXPORTACIONES EXCEL (SIN CAMBIOS) ====================

  const exportarPersonas = async () => {
    try {
      if (personas.length === 0) {
        alert('No hay personas para exportar')
        return
      }

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Personas')

      sheet.mergeCells('A1:G1')
      const titleCell = sheet.getCell('A1')
      titleCell.value = '👥 Base de Datos de Personas'
      titleCell.font = { name: 'Arial Black', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4788' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
      sheet.getRow(1).height = 25

      sheet.getRow(3).values = ['Nombre', 'RUT', 'Tipo', 'Tarifa/Hora', 'Estado', 'Teléfono', 'Email']
      sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
      sheet.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' }
      
      personas.forEach((p, index) => {
        const row = sheet.getRow(4 + index)
        row.values = [
          p.nombre || '-',
          p.rut || '-',
          p.tipo || '-',
          p.tarifa_hora ? `$${p.tarifa_hora.toLocaleString('es-CL')}` : '-',
          p.estado || '-',
          p.telefono || '-',
          p.email || '-'
        ]
        if (index % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }
        }
      })

      sheet.getColumn(1).width = 30
      sheet.getColumn(2).width = 15
      sheet.getColumn(3).width = 20
      sheet.getColumn(4).width = 15
      sheet.getColumn(5).width = 12
      sheet.getColumn(6).width = 15
      sheet.getColumn(7).width = 25

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Personas_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('❌ Error exportando personas:', error)
      alert('Error al exportar personas: ' + error.message)
    }
  }

  const exportarTurnos = async () => {
    try {
      if (turnos.length === 0) {
        alert('No hay turnos para exportar')
        return
      }

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Turnos')

      sheet.mergeCells('A1:H1')
      const titleCell = sheet.getCell('A1')
      titleCell.value = '⏰ Registro Completo de Turnos'
      titleCell.font = { name: 'Arial Black', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
      sheet.getRow(1).height = 25

      sheet.getRow(3).values = ['Fecha', 'Persona', 'Tipo Turno', 'Hora Inicio', 'Hora Fin', 'Ubicación', 'Estado', 'Puesto']
      sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14B8A6' } }
      sheet.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' }
      
      turnos.forEach((t, index) => {
        const persona = personas.find(p => p.id === t.persona_id)
        
        const row = sheet.getRow(4 + index)
        row.values = [
          t.fecha ? new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-CL') : '-',
          persona?.nombre || 'Sin asignar',
          t.tipo_turno || '-',
          t.hora_inicio || '-',
          t.hora_fin || '-',
          t.ubicacion || '-',
          t.estado || '-',
          t.puesto || '-'
        ]
        if (index % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }
        }
      })

      sheet.getColumn(1).width = 15
      sheet.getColumn(2).width = 30
      sheet.getColumn(3).width = 15
      sheet.getColumn(4).width = 12
      sheet.getColumn(5).width = 12
      sheet.getColumn(6).width = 20
      sheet.getColumn(7).width = 15
      sheet.getColumn(8).width = 20

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Turnos_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando turnos:', error)
      alert('Error al exportar turnos: ' + error.message)
    }
  }

  const exportarAnalisisCombinado = async () => {
    try {
      if (personas.length === 0 && turnos.length === 0) {
        alert('No hay datos para exportar')
        return
      }

      const workbook = new ExcelJS.Workbook()
      
      const sheet1 = workbook.addWorksheet('Resumen por Persona')
      sheet1.mergeCells('A1:F1')
      const title1 = sheet1.getCell('A1')
      title1.value = '📊 Análisis de Productividad por Persona'
      title1.font = { name: 'Arial Black', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }
      title1.alignment = { vertical: 'middle', horizontal: 'center' }
      sheet1.getRow(1).height = 25

      sheet1.getRow(3).values = ['Persona', 'Tipo', 'Total Turnos', 'Turnos Completados', 'Total Horas', 'Promedio Horas/Turno']
      sheet1.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet1.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } }
      sheet1.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' }

      personas.forEach((p, index) => {
        const turnosPersona = turnos.filter(t => t.persona_id === p.id)
        const turnosCompletados = turnosPersona.filter(t => t.estado === 'completado')
        const totalHoras = turnosCompletados.reduce((sum, t) => {
          if (t.hora_inicio && t.hora_fin) {
            const inicio = new Date(`2000-01-01T${t.hora_inicio}`)
            const fin = new Date(`2000-01-01T${t.hora_fin}`)
            const horas = (fin - inicio) / (1000 * 60 * 60)
            return sum + (horas > 0 ? horas : 0)
          }
          return sum
        }, 0)
        const promedioHoras = turnosCompletados.length > 0 ? (totalHoras / turnosCompletados.length).toFixed(1) : 0

        const row = sheet1.getRow(4 + index)
        row.values = [
          p.nombre,
          p.tipo || '-',
          turnosPersona.length,
          turnosCompletados.length,
          totalHoras.toFixed(1),
          promedioHoras
        ]
        if (index % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF5FF' } }
        }
      })

      sheet1.getColumn(1).width = 30
      sheet1.getColumn(2).width = 20
      sheet1.getColumn(3).width = 15
      sheet1.getColumn(4).width = 20
      sheet1.getColumn(5).width = 15
      sheet1.getColumn(6).width = 20

      const sheet2 = workbook.addWorksheet('Turnos Detallados')
      sheet2.mergeCells('A1:I1')
      const title2 = sheet2.getCell('A1')
      title2.value = '📋 Turnos con Información de Persona'
      title2.font = { name: 'Arial Black', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }
      title2.alignment = { vertical: 'middle', horizontal: 'center' }
      sheet2.getRow(1).height = 25

      sheet2.getRow(3).values = ['Fecha', 'Persona', 'Tipo Persona', 'Tipo Turno', 'Hora Inicio', 'Hora Fin', 'Ubicación', 'Estado', 'Tarifa/Hora']
      sheet2.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet2.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } }
      sheet2.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' }

      turnos.forEach((t, index) => {
        const persona = personas.find(p => p.id === t.persona_id)
        const row = sheet2.getRow(4 + index)
        row.values = [
          t.fecha ? new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-CL') : '-',
          persona?.nombre || 'Sin asignar',
          persona?.tipo || '-',
          t.tipo_turno || '-',
          t.hora_inicio || '-',
          t.hora_fin || '-',
          t.ubicacion || '-',
          t.estado || '-',
          persona?.tarifa_hora ? `$${persona.tarifa_hora.toLocaleString('es-CL')}` : '-'
        ]
        if (index % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } }
        }
      })

      sheet2.getColumn(1).width = 15
      sheet2.getColumn(2).width = 30
      sheet2.getColumn(3).width = 20
      sheet2.getColumn(4).width = 15
      sheet2.getColumn(5).width = 12
      sheet2.getColumn(6).width = 12
      sheet2.getColumn(7).width = 20
      sheet2.getColumn(8).width = 15
      sheet2.getColumn(9).width = 15

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Analisis_Completo_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando análisis combinado:', error)
      alert('Error al exportar análisis combinado: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Reportes y Análisis v2</h1>
          <p className="text-gray-600 mt-2">Visualizaciones avanzadas interactivas y exportaciones</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Personas</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personas.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnos.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turnos Completados</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {turnos.filter(t => t.estado === 'completado').length}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Personas Activas</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {personas.filter(p => p.estado === 'activo').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 1: VISUALIZACIONES AVANZADAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Visualizaciones Avanzadas de Datos
          </CardTitle>
          <CardDescription>
            Análisis gráfico interactivo con métricas clave de operación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Grande: Heatmap de Cobertura */}
          {getHeatmapCoberturaHoraria() && (
            <div className="border-2 border-cyan-200 rounded-lg p-4 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-lg hover:shadow-xl transition-shadow">
              <ReactECharts 
                option={getHeatmapCoberturaHoraria()} 
                style={{ height: '400px' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )}

          {/* Grid 2x3: Visualizaciones Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gauge de Eficiencia */}
            <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <ReactECharts 
                option={getGaugeEficiencia()} 
                style={{ height: '300px' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>

            {/* Radar Chart */}
            {getRadarTiposPersona() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getRadarTiposPersona()} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}

            {/* Treemap Costos */}
            {getTreemapCostos() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getTreemapCostos()} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
          </div>

          {/* Grid 2x1: Calendario y Línea Temporal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calendario Heatmap */}
            {getCalendarioActividad() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getCalendarioActividad()} 
                  style={{ height: '320px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}

            {/* Línea Temporal Comparativa */}
            {getLineaTemporalComparativa() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getLineaTemporalComparativa()} 
                  style={{ height: '320px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
          </div>

          {/* Mensaje si no hay datos */}
          {!getHeatmapCoberturaHoraria() && !getRadarTiposPersona() && !getTreemapCostos() && (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No hay datos suficientes para mostrar visualizaciones</p>
              <p className="text-sm mt-1">Agrega personas y turnos para ver los análisis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: DESCARGAS EXCEL (SIN CAMBIOS) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Exportaciones Excel
          </CardTitle>
          <CardDescription>
            Descarga datos individuales y reportes combinados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Datos Individuales */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">📁 Datos Individuales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={exportarPersonas}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Exportar Personas ({personas.length})
                </Button>
                <Button 
                  onClick={exportarTurnos}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Exportar Turnos ({turnos.length})
                </Button>
              </div>
            </div>

            {/* Reportes Combinados */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">📊 Reporte Combinado</h3>
              <Button 
                onClick={exportarAnalisisCombinado}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Análisis Completo (2 hojas)
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                💡 El reporte combinado incluye múltiples hojas con análisis cruzados de personas y turnos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Footer */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-teal-600 mt-1">💡</div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Información sobre los reportes v2</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Heatmap 24x7</strong>: Mapa de calor mostrando cobertura horaria por día de la semana</li>
                <li>• <strong>Gauge</strong>: Medidor semicircular de eficiencia con colores dinámicos</li>
                <li>• <strong>Radar Chart</strong>: Análisis multidimensional de tipos de personas (5 métricas)</li>
                <li>• <strong>Treemap</strong>: Distribución jerárquica de costos con bloques proporcionales</li>
                <li>• <strong>Calendario</strong>: Heatmap de actividad diaria con escala de intensidad</li>
                <li>• <strong>Línea Temporal</strong>: Evolución mensual comparativa de estados</li>
                <li>• Las exportaciones Excel mantienen el formato profesional existente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Reportes
