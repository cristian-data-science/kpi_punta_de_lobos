import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, PieChart, TrendingUp, Download, FileSpreadsheet, Users, Clock, DollarSign, Activity } from 'lucide-react'
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

  // ==================== VISUALIZACIONES ====================

  // 1. Top 5 Personas por Horas Trabajadas
  const getTopPersonasChart = () => {
    const personasConHoras = personas.map(p => {
      const turnosPersona = turnos.filter(t => t.persona_id === p.id && t.estado === 'completado')
      const totalHoras = turnosPersona.reduce((sum, t) => {
        if (t.hora_inicio && t.hora_fin) {
          const inicio = new Date(`2000-01-01T${t.hora_inicio}`)
          const fin = new Date(`2000-01-01T${t.hora_fin}`)
          const horas = (fin - inicio) / (1000 * 60 * 60)
          return sum + (horas > 0 ? horas : 0)
        }
        return sum
      }, 0)
      return { nombre: p.nombre, horas: Math.round(totalHoras * 10) / 10 }
    }).filter(p => p.horas > 0) // Solo personas con horas trabajadas

    const top5 = personasConHoras
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5)

    if (top5.length === 0) {
      return null
    }

    return {
      title: { 
        text: 'Top 5 Personas por Horas Trabajadas', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        formatter: '{b}: {c}h'
      },
      grid: { left: '20%', right: '15%', bottom: '5%', top: '15%' },
      xAxis: { 
        type: 'value', 
        name: 'Horas',
        nameTextStyle: { fontSize: 11, color: '#6b7280' }
      },
      yAxis: { 
        type: 'category', 
        data: top5.map(p => p.nombre.length > 20 ? p.nombre.substring(0, 17) + '...' : p.nombre),
        axisLabel: { fontSize: 11, color: '#374151' }
      },
      series: [{
        type: 'bar',
        data: top5.map(p => p.horas),
        barWidth: '60%',
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#0891b2' },
            { offset: 1, color: '#06b6d4' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: { 
          show: true, 
          position: 'right', 
          formatter: '{c}h',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#0891b2'
        }
      }]
    }
  }

  // 2. Distribución de Turnos por Tipo
  const getTurnosPorTipoChart = () => {
    const turnosPorTipo = turnos.reduce((acc, t) => {
      const tipo = t.tipo_turno || 'Sin especificar'
      acc[tipo] = (acc[tipo] || 0) + 1
      return acc
    }, {})

    const colorPalette = ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']
    const data = Object.entries(turnosPorTipo)
      .map(([name, value], index) => ({ 
        name, 
        value,
        itemStyle: { color: colorPalette[index % colorPalette.length] }
      }))

    if (data.length === 0) {
      return null
    }

    return {
      title: { 
        text: 'Distribución de Turnos por Tipo', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { 
        trigger: 'item', 
        formatter: '{b}<br/>{c} turnos ({d}%)'
      },
      legend: { 
        bottom: '2%', 
        left: 'center',
        textStyle: { fontSize: 10 }
      },
      series: [{
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          formatter: '{d}%',
          fontSize: 12,
          fontWeight: 'bold'
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
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: data
      }]
    }
  }

  // 3. Estado de Turnos
  const getTurnosPorEstadoChart = () => {
    const turnosPorEstado = turnos.reduce((acc, t) => {
      const estado = t.estado || 'Sin especificar'
      acc[estado] = (acc[estado] || 0) + 1
      return acc
    }, {})

    const estadoConfig = {
      'completado': { label: 'Completados', color: '#10b981' },
      'programado': { label: 'Programados', color: '#3b82f6' },
      'en_curso': { label: 'En Curso', color: '#f59e0b' },
      'cancelado': { label: 'Cancelados', color: '#ef4444' },
      'ausente': { label: 'Ausentes', color: '#6b7280' }
    }

    const data = Object.entries(turnosPorEstado).map(([estado, value]) => ({ 
      name: estadoConfig[estado]?.label || estado,
      value,
      itemStyle: { color: estadoConfig[estado]?.color || '#94a3b8' }
    }))

    if (data.length === 0) {
      return null
    }

    return {
      title: { 
        text: 'Estado de Turnos', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { 
        trigger: 'item', 
        formatter: '{b}<br/>{c} turnos ({d}%)'
      },
      legend: { 
        bottom: '2%', 
        left: 'center',
        textStyle: { fontSize: 10 }
      },
      series: [{
        type: 'pie',
        radius: '65%',
        center: ['50%', '45%'],
        data: data,
        label: {
          show: true,
          formatter: '{b}\n{c}',
          fontSize: 11,
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.4)'
          }
        }
      }]
    }
  }

  // 4. Turnos por Ubicación
  const getTurnosPorUbicacionChart = () => {
    const turnosPorUbicacion = turnos.reduce((acc, t) => {
      const ubicacion = t.ubicacion || 'Sin especificar'
      acc[ubicacion] = (acc[ubicacion] || 0) + 1
      return acc
    }, {})

    const data = Object.entries(turnosPorUbicacion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Top 8 ubicaciones

    if (data.length === 0) {
      return null
    }

    return {
      title: { 
        text: 'Turnos por Ubicación (Top 8)', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        formatter: '{b}<br/>{c} turnos'
      },
      grid: { left: '5%', right: '5%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: data.map(d => d[0].length > 15 ? d[0].substring(0, 12) + '...' : d[0]),
        axisLabel: { 
          rotate: 30, 
          fontSize: 10,
          color: '#374151'
        }
      },
      yAxis: { 
        type: 'value', 
        name: 'Turnos',
        nameTextStyle: { fontSize: 11, color: '#6b7280' }
      },
      series: [{
        type: 'bar',
        data: data.map(d => d[1]),
        barWidth: '50%',
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#a78bfa' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        label: { 
          show: true, 
          position: 'top',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#7c3aed'
        }
      }]
    }
  }

  // 5. Evolución Mensual de Turnos
  const getEvolucionTurnosChart = () => {
    const turnosPorMes = {}
    
    turnos.forEach(t => {
      if (t.fecha) {
        const fecha = new Date(t.fecha + 'T00:00:00')
        const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        turnosPorMes[mesAnio] = (turnosPorMes[mesAnio] || 0) + 1
      }
    })

    const mesesOrdenados = Object.keys(turnosPorMes).sort()
    if (mesesOrdenados.length === 0) {
      return null
    }
    
    const valores = mesesOrdenados.map(m => turnosPorMes[m])
    const labels = mesesOrdenados.map(m => {
      const [anio, mes] = m.split('-')
      const fecha = new Date(anio, parseInt(mes) - 1)
      return fecha.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    })

    return {
      title: { 
        text: 'Evolución Mensual de Turnos', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { 
        trigger: 'axis',
        formatter: '{b}<br/>{c} turnos'
      },
      grid: { left: '5%', right: '5%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: labels,
        axisLabel: { 
          rotate: 30, 
          fontSize: 10,
          color: '#374151'
        },
        boundaryGap: false
      },
      yAxis: { 
        type: 'value', 
        name: 'Turnos',
        nameTextStyle: { fontSize: 11, color: '#6b7280' }
      },
      series: [{
        type: 'line',
        data: valores,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#0891b2'
        },
        itemStyle: { 
          color: '#0891b2',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(8, 145, 178, 0.4)' },
            { offset: 1, color: 'rgba(8, 145, 178, 0.05)' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          color: '#0891b2',
          fontWeight: 'bold'
        }
      }]
    }
  }

  // 6. Promedio de Horas por Tipo de Persona
  const getPromedioHorasPorTipoChart = () => {
    const tiposPersona = {}
    
    personas.forEach(p => {
      const tipo = p.tipo || 'Sin especificar'
      if (!tiposPersona[tipo]) {
        tiposPersona[tipo] = { total: 0, count: 0 }
      }
      
      const turnosPersona = turnos.filter(t => t.persona_id === p.id && t.estado === 'completado')
      const totalHoras = turnosPersona.reduce((sum, t) => {
        if (t.hora_inicio && t.hora_fin) {
          const inicio = new Date(`2000-01-01T${t.hora_inicio}`)
          const fin = new Date(`2000-01-01T${t.hora_fin}`)
          const horas = (fin - inicio) / (1000 * 60 * 60)
          return sum + (horas > 0 ? horas : 0)
        }
        return sum
      }, 0)
      
      if (totalHoras > 0) {
        tiposPersona[tipo].total += totalHoras
        tiposPersona[tipo].count += 1
      }
    })

    const data = Object.entries(tiposPersona)
      .filter(([_, v]) => v.count > 0)
      .map(([tipo, v]) => ({
        tipo,
        promedio: Math.round((v.total / v.count) * 10) / 10
      }))

    if (data.length === 0) {
      return null
    }

    return {
      title: { 
        text: 'Promedio de Horas por Tipo de Persona', 
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        formatter: '{b}: {c}h promedio'
      },
      grid: { left: '20%', right: '15%', bottom: '5%', top: '15%' },
      xAxis: { 
        type: 'value', 
        name: 'Horas',
        nameTextStyle: { fontSize: 11, color: '#6b7280' }
      },
      yAxis: { 
        type: 'category', 
        data: data.map(d => d.tipo),
        axisLabel: { fontSize: 11, color: '#374151' }
      },
      series: [{
        type: 'bar',
        data: data.map(d => d.promedio),
        barWidth: '60%',
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#f59e0b' },
            { offset: 1, color: '#fbbf24' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: { 
          show: true, 
          position: 'right', 
          formatter: '{c}h',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#d97706'
        }
      }]
    }
  }

  // ==================== EXPORTACIONES EXCEL ====================

  // Exportar Personas
  const exportarPersonas = async () => {
    try {
      if (personas.length === 0) {
        alert('No hay personas para exportar')
        return
      }

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Personas')

      // Título
      sheet.mergeCells('A1:G1')
      const titleCell = sheet.getCell('A1')
      titleCell.value = '👥 Base de Datos de Personas'
      titleCell.font = { name: 'Arial Black', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4788' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
      sheet.getRow(1).height = 25

      // Encabezados
      sheet.getRow(3).values = ['Nombre', 'RUT', 'Tipo', 'Tarifa/Hora', 'Estado', 'Teléfono', 'Email']
      sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
      sheet.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' }
      
      // Datos
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

      // Ajustar anchos
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

  // Exportar Turnos
  const exportarTurnos = async () => {
    try {
      if (turnos.length === 0) {
        alert('No hay turnos para exportar')
        return
      }

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Turnos')

      // Título
      sheet.mergeCells('A1:H1')
      const titleCell = sheet.getCell('A1')
      titleCell.value = '⏰ Registro Completo de Turnos'
      titleCell.font = { name: 'Arial Black', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
      sheet.getRow(1).height = 25

      // Encabezados
      sheet.getRow(3).values = ['Fecha', 'Persona', 'Tipo Turno', 'Hora Inicio', 'Hora Fin', 'Ubicación', 'Estado', 'Puesto']
      sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14B8A6' } }
      sheet.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' }
      
      // Datos
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

      // Ajustar anchos
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

  // Exportar Análisis Combinado
  const exportarAnalisisCombinado = async () => {
    try {
      if (personas.length === 0 && turnos.length === 0) {
        alert('No hay datos para exportar')
        return
      }

      const workbook = new ExcelJS.Workbook()
      
      // HOJA 1: Resumen por Persona
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

      // HOJA 2: Turnos con Persona
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
          <h1 className="text-3xl font-bold text-gray-900">📊 Reportes y Análisis</h1>
          <p className="text-gray-600 mt-2">Visualizaciones y exportaciones de datos</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Personas</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnos.length}</div>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
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

      {/* SECCIÓN 1: VISUALIZACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            Visualizaciones de Datos
          </CardTitle>
          <CardDescription>
            Análisis gráfico de personas, turnos y tendencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fila 1: Top Personas y Turnos por Tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {getTopPersonasChart() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                <ReactECharts 
                  option={getTopPersonasChart()} 
                  style={{ height: '280px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
            {getTurnosPorTipoChart() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                <ReactECharts 
                  option={getTurnosPorTipoChart()} 
                  style={{ height: '280px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
          </div>

          {/* Fila 2: Estado Turnos y Ubicaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {getTurnosPorEstadoChart() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                <ReactECharts 
                  option={getTurnosPorEstadoChart()} 
                  style={{ height: '280px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
            {getTurnosPorUbicacionChart() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                <ReactECharts 
                  option={getTurnosPorUbicacionChart()} 
                  style={{ height: '280px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
          </div>

          {/* Fila 3: Evolución y Promedio por Tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {getEvolucionTurnosChart() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                <ReactECharts 
                  option={getEvolucionTurnosChart()} 
                  style={{ height: '280px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
            {getPromedioHorasPorTipoChart() && (
              <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                <ReactECharts 
                  option={getPromedioHorasPorTipoChart()} 
                  style={{ height: '280px' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            )}
          </div>

          {/* Mensaje si no hay datos */}
          {!getTopPersonasChart() && !getTurnosPorTipoChart() && !getTurnosPorEstadoChart() && (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No hay datos suficientes para mostrar visualizaciones</p>
              <p className="text-sm mt-1">Agrega personas y turnos para ver los análisis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: DESCARGAS EXCEL */}
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
            <div className="text-teal-600 mt-1">ℹ️</div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">Información sobre los reportes</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Las visualizaciones se actualizan en tiempo real con los datos más recientes</li>
                <li>• Los archivos Excel incluyen formato profesional con colores y estilos</li>
                <li>• Los reportes combinados generan múltiples hojas con análisis cruzados</li>
                <li>• Usa el botón "Actualizar" si has modificado datos recientemente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Reportes
