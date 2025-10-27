import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, FileSpreadsheet, Users, Clock, Activity, Calendar as CalendarIcon } from 'lucide-react'
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
  
  // Filtros de fecha - Mes y Año actual por defecto
  const fechaActual = new Date()
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1)
  const [anioSeleccionado, setAnioSeleccionado] = useState(fechaActual.getFullYear())

  // Turnos filtrados por mes/año seleccionado
  const turnosFiltrados = turnos.filter(t => {
    if (!t.fecha) return false
    const fecha = new Date(t.fecha + 'T00:00:00')
    return fecha.getMonth() + 1 === mesSeleccionado && fecha.getFullYear() === anioSeleccionado
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: personasData, error: personasError } = await getPersonas(1, 1000)
      if (!personasError && personasData) {
        setPersonas(personasData)
      } else {
        setPersonas([])
      }

      const { data: turnosData, error: turnosError } = await getTurnos({})
      if (!turnosError && turnosData) {
        setTurnos(turnosData)
      } else {
        setTurnos([])
      }

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

  // ==================== VISUALIZACIONES INTELIGENTES ====================

  // 1. DISTRIBUCIÓN DE TURNOS POR PERSONA
  const getDistribucionTurnosPorPersona = () => {
    if (personas.length === 0) return null

    const personasConTurnos = personas.map(p => ({
      nombre: p.nombre,
      totalTurnos: turnosFiltrados.filter(t => t.persona_id === p.id).length
    })).filter(p => p.totalTurnos > 0).sort((a, b) => b.totalTurnos - a.totalTurnos)

    if (personasConTurnos.length === 0) return null

    return {
      title: { 
        text: '👥 Distribución de Turnos por Persona', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => `<strong>${params[0].name}</strong><br/>Turnos: <strong>${params[0].value}</strong>`
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '5%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Cantidad de Turnos',
        nameTextStyle: { fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: personasConTurnos.map(p => p.nombre),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        name: 'Turnos',
        type: 'bar',
        data: personasConTurnos.map(p => p.totalTurnos),
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#2563eb' }
          ]),
          borderRadius: [0, 6, 6, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#1f2937'
        }
      }]
    }
  }

  // 2. CALENDARIO HEATMAP
  const getCalendarioActividad = () => {
    const actividadPorFecha = {}
    
    turnosFiltrados.forEach(t => {
      if (t.fecha) {
        const fecha = t.fecha.split('T')[0]
        actividadPorFecha[fecha] = (actividadPorFecha[fecha] || 0) + 1
      }
    })

    const data = Object.entries(actividadPorFecha).map(([fecha, count]) => [fecha, count])
    
    if (data.length === 0) return null

    const maxValue = Math.max(...data.map(d => d[1]))
    const primerDia = `${anioSeleccionado}-${String(mesSeleccionado).padStart(2, '0')}-01`
    const ultimoDia = new Date(anioSeleccionado, mesSeleccionado, 0).getDate()
    const ultimaFecha = `${anioSeleccionado}-${String(mesSeleccionado).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

    return {
      title: { 
        text: '📅 Calendario de Actividad Diaria', 
        left: 'center',
        top: '3%',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        formatter: (params) => {
          const fecha = new Date(params.value[0] + 'T00:00:00')
          return `${fecha.toLocaleDateString('es-CL', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long'
          })}<br/><strong>${params.value[1]} turnos</strong>`
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
          { min: 4, label: '4+ turnos', color: '#059669' },
          { min: 3, max: 3, label: '3 turnos', color: '#10b981' },
          { min: 2, max: 2, label: '2 turnos', color: '#fbbf24' },
          { min: 1, max: 1, label: '1 turno', color: '#fde047' }
        ],
        textStyle: { fontSize: 10 }
      },
      calendar: {
        top: '20%',
        left: '5%',
        right: '5%',
        bottom: '15%',
        range: [primerDia, ultimaFecha],
        cellSize: ['auto', 20],
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e5e7eb',
            width: 2,
            type: 'solid'
          }
        },
        yearLabel: { 
          show: false
        },
        monthLabel: { 
          show: false
        },
        dayLabel: { 
          fontSize: 11, 
          color: '#6b7280',
          nameMap: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          firstDay: 1
        },
        itemStyle: {
          borderWidth: 2,
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

  // 3. DISTRIBUCIÓN POR TIPO
  const getDistribucionPorTipo = () => {
    if (personas.length === 0) return null

    const tipoCount = {}
    personas.forEach(p => {
      const tipo = p.tipo || 'Sin especificar'
      tipoCount[tipo] = (tipoCount[tipo] || 0) + 1
    })

    const data = Object.entries(tipoCount).map(([tipo, count]) => ({
      name: tipo,
      value: count
    }))

    if (data.length === 0) return null

    return {
      title: { 
        text: '🎯 Distribución por Tipo de Persona', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <strong>{c}</strong> ({d}%)'
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { fontSize: 11 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          fontSize: 12,
          fontWeight: 'bold',
          formatter: '{b}\n{c} personas'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: data,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      }]
    }
  }

  // 4. ACTIVIDAD POR DÍA DE LA SEMANA
  const getActividadPorDiaSemana = () => {
    if (turnosFiltrados.length === 0) return null

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const actividadPorDia = [0, 0, 0, 0, 0, 0, 0]

    turnosFiltrados.forEach(t => {
      if (t.fecha) {
        const fecha = new Date(t.fecha + 'T00:00:00')
        const dia = (fecha.getDay() + 6) % 7 // Lunes = 0
        actividadPorDia[dia]++
      }
    })

    return {
      title: { 
        text: '📊 Turnos por Día de la Semana', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => `<strong>${params[0].name}</strong><br/>${params[0].value} turnos`
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: diasSemana,
        axisLabel: { 
          fontSize: 11,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        name: 'Cantidad',
        nameTextStyle: { fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: actividadPorDia,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#14b8a6' },
            { offset: 1, color: '#0891b2' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#1f2937'
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#0891b2' },
              { offset: 1, color: '#0e7490' }
            ])
          }
        }
      }]
    }
  }

  // 5. DISTRIBUCIÓN DE HORARIOS
  const getDistribucionHorarios = () => {
    if (turnosFiltrados.length === 0) return null

    const horariosData = []
    const horariosCount = {}

    turnosFiltrados.forEach(t => {
      if (t.hora_inicio && t.hora_fin) {
        const key = `${t.hora_inicio}-${t.hora_fin}`
        horariosCount[key] = (horariosCount[key] || 0) + 1
      }
    })

    Object.entries(horariosCount).forEach(([horario, count]) => {
      const [inicio, fin] = horario.split('-')
      horariosData.push({
        value: [inicio, fin, count],
        name: `${inicio} - ${fin}`
      })
    })

    if (horariosData.length === 0) return null

    // Calcular tamaño máximo para las burbujas
    const maxCount = Math.max(...horariosData.map(d => d.value[2]))
    const minSize = 20
    const maxSize = 60

    return {
      title: { 
        text: '⏰ Distribución de Horarios de Trabajo', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        formatter: (params) => `<strong>${params.value[0]} - ${params.value[1]}</strong><br/>${params.value[2]} turnos`
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        name: 'Hora Inicio',
        nameTextStyle: { fontSize: 11 },
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'category',
        name: 'Hora Fin',
        nameTextStyle: { fontSize: 11 },
        axisLabel: { fontSize: 10 }
      },
      series: [{
        type: 'scatter',
        symbolSize: (val) => {
          const count = val[2]
          return minSize + ((count / maxCount) * (maxSize - minSize))
        },
        data: horariosData,
        itemStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#6d28d9' }
          ])
        },
        label: {
          show: true,
          formatter: (params) => params.value[2],
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(139, 92, 246, 0.5)'
          }
        }
      }]
    }
  }

  // 6. COMPARACIÓN DE TARIFAS
  const getComparacionTarifas = () => {
    if (personas.length === 0) return null

    const personasConTarifa = personas
      .filter(p => p.tarifa_hora > 0)
      .map(p => ({
        nombre: p.nombre,
        tarifa: p.tarifa_hora,
        tipo: p.tipo
      }))
      .sort((a, b) => b.tarifa - a.tarifa)

    if (personasConTarifa.length === 0) return null

    return {
      title: { 
        text: '💰 Comparación de Tarifas por Hora', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => `<strong>${params[0].name}</strong><br/>Tarifa: <strong>$${params[0].value.toLocaleString('es-CL')}</strong>/hora`
      },
      grid: {
        left: '5%',
        right: '10%',
        bottom: '5%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Tarifa (CLP)',
        nameTextStyle: { fontSize: 11 },
        axisLabel: {
          formatter: (value) => `$${(value / 1000).toFixed(0)}k`
        }
      },
      yAxis: {
        type: 'category',
        data: personasConTarifa.map(p => p.nombre),
        axisLabel: { fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: personasConTarifa.map(p => ({
          value: p.tarifa,
          itemStyle: {
            color: p.tipo === 'guarda_parque' ? '#10b981' : '#f59e0b'
          }
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (params) => `$${params.value.toLocaleString('es-CL')}`,
          fontSize: 10,
          fontWeight: 'bold'
        },
        itemStyle: {
          borderRadius: [0, 6, 6, 0]
        }
      }]
    }
  }

  // ==================== EXPORTACIONES EXCEL ====================

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
      console.error('Error exportando personas:', error)
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

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return (
    <div className="space-y-6">
      {/* Header con Selectores */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Reportes y Análisis</h1>
          <p className="text-gray-600 mt-2">Visualizaciones inteligentes basadas en tus datos reales</p>
        </div>
        
        {/* Selectores de Mes y Año */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-teal-600" />
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {mesesNombres.map((mes, index) => (
                <option key={index + 1} value={index + 1}>{mes}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {[2024, 2025, 2026].map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

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
            <CardTitle className="text-sm font-medium">Turnos del Mes</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnosFiltrados.length}</div>
            <p className="text-xs text-gray-500 mt-1">{mesesNombres[mesSeleccionado - 1]} {anioSeleccionado}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnos.length}</div>
            <p className="text-xs text-gray-500 mt-1">Histórico completo</p>
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

      {/* VISUALIZACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Análisis Visual de Datos
          </CardTitle>
          <CardDescription>
            Mostrando datos de {mesesNombres[mesSeleccionado - 1]} {anioSeleccionado}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grid Superior: 2 Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {getDistribucionTurnosPorPersona() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getDistribucionTurnosPorPersona()} 
                  style={{ height: '350px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}

            {getCalendarioActividad() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getCalendarioActividad()} 
                  style={{ height: '350px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
          </div>

          {/* Grid Medio: 3 Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {getDistribucionPorTipo() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getDistribucionPorTipo()} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}

            {getActividadPorDiaSemana() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getActividadPorDiaSemana()} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}

            {getDistribucionHorarios() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
                <ReactECharts 
                  option={getDistribucionHorarios()} 
                  style={{ height: '300px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
          </div>

          {/* Grid Inferior: Full Width */}
          {getComparacionTarifas() && (
            <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <ReactECharts 
                option={getComparacionTarifas()} 
                style={{ height: '280px' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )}

          {/* Mensaje si no hay datos */}
          {!getDistribucionTurnosPorPersona() && !getCalendarioActividad() && (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No hay datos para {mesesNombres[mesSeleccionado - 1]} {anioSeleccionado}</p>
              <p className="text-sm mt-1">Selecciona otro mes o agrega turnos para este período</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXPORTACIONES EXCEL */}
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
              <p className="text-sm font-medium text-gray-900">Visualizaciones Inteligentes</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Distribución por Persona</strong>: Compara turnos del mes seleccionado por trabajador</li>
                <li>• <strong>Calendario Mensual</strong>: Visualiza actividad diaria del mes actual</li>
                <li>• <strong>Distribución por Tipo</strong>: Gráfico circular mostrando tipos de personal</li>
                <li>• <strong>Actividad Semanal</strong>: Identifica patrones por día (Lunes a Domingo)</li>
                <li>• <strong>Horarios de Trabajo</strong>: Burbujas optimizadas con rangos horarios</li>
                <li>• <strong>Comparación de Tarifas</strong>: Ordena trabajadores por tarifa/hora</li>
                <li>• <strong>Selector de Período</strong>: Cambia mes y año para filtrar todos los gráficos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Reportes
