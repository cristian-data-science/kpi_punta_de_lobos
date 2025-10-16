// 🌊 PUNTA DE LOBOS - Servicios para Turnos V2 (Programación de Turnos)
// MODELO DE PAGO: Tarifa por hora según persona (tarifa_hora en tabla personas)

import { getSupabaseClient } from './supabaseClient'

const supabase = getSupabaseClient()

// ==================================================
// 💰 CÁLCULO DE HORAS Y MONTOS
// ==================================================

/**
 * Calcular horas entre hora_inicio y hora_fin
 * @param {string} horaInicio - Formato "HH:MM:SS" o "HH:MM"
 * @param {string} horaFin - Formato "HH:MM:SS" o "HH:MM"
 * @returns {number} - Horas trabajadas (decimal)
 */
export function calcularHorasTurno(horaInicio, horaFin) {
  try {
    const [horaIni, minIni] = horaInicio.split(':').map(Number)
    const [horaFin2, minFin] = horaFin.split(':').map(Number)
    
    const minutosInicio = horaIni * 60 + minIni
    const minutosFin = horaFin2 * 60 + minFin
    
    const diferenciaMinutos = minutosFin - minutosInicio
    const horas = diferenciaMinutos / 60
    
    return Math.round(horas * 100) / 100 // Redondear a 2 decimales
  } catch (error) {
    console.error('❌ Error calculando horas:', error)
    return 0
  }
}

/**
 * Calcular monto según tarifa de persona y horas trabajadas
 * @param {number} tarifaHora - Tarifa por hora de la persona
 * @param {number} horas - Horas trabajadas
 * @returns {number} - Monto total en CLP
 */
export function calcularMontoTurno(tarifaHora, horas) {
  if (!tarifaHora || !horas) return 0
  return Math.round(tarifaHora * horas)
}

/**
 * Formatear monto en pesos chilenos
 */
export const formatMonto = (monto) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(monto)
}

// ==================================================
// 📅 TURNOS V2 - CRUD BÁSICO
// ==================================================

/**
 * Obtener plantillas de turnos con filtros
 * @param {Object} filters - Filtros opcionales
 */
export const getTurnosV2 = async (filters = {}) => {
  try {
    let query = supabase
      .from('turnos_v2')
      .select(`
        *,
        persona:persona_id (
          id,
          nombre,
          rut,
          tipo,
          tarifa_hora
        )
      `)
      .order('semana_ciclo', { ascending: true })
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true })

    // Aplicar filtros
    if (filters.temporada) {
      query = query.eq('temporada', filters.temporada)
    }
    if (filters.horario) {
      query = query.eq('horario', filters.horario)
    }
    if (filters.codigo_turno) {
      query = query.eq('codigo_turno', filters.codigo_turno)
    }
    if (filters.semana_ciclo) {
      query = query.eq('semana_ciclo', filters.semana_ciclo)
    }
    if (filters.estado) {
      query = query.eq('estado', filters.estado)
    }
    if (filters.mes_asignacion && filters.anio_asignacion) {
      query = query
        .eq('mes_asignacion', filters.mes_asignacion)
        .eq('anio_asignacion', filters.anio_asignacion)
    }
    if (filters.persona_id) {
      query = query.eq('persona_id', filters.persona_id)
    }
    if (filters.es_activo !== undefined) {
      query = query.eq('es_activo', filters.es_activo)
    }

    const { data, error } = await query
    return { data, error }
  } catch (error) {
    console.error('Error al obtener turnos V2:', error)
    return { data: null, error }
  }
}

/**
 * Crear nuevo turno V2
 */
export const createTurnoV2 = async (turno) => {
  try {
    const { data, error } = await supabase
      .from('turnos_v2')
      .insert([turno])
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error al crear turno V2:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar turno V2
 */
export const updateTurnoV2 = async (turnoId, updates) => {
  try {
    const { data, error } = await supabase
      .from('turnos_v2')
      .update(updates)
      .eq('id', turnoId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error al actualizar turno V2:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar turno V2
 */
export const deleteTurnoV2 = async (turnoId) => {
  try {
    const { data, error } = await supabase
      .from('turnos_v2')
      .delete()
      .eq('id', turnoId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error al eliminar turno V2:', error)
    return { data: null, error }
  }
}

// ==================================================
// 👥 ASIGNACIÓN DE PERSONAS
// ==================================================

/**
 * Asignar persona a un turno
 */
export const asignarPersonaTurno = async (turnoId, personaId, fecha, mes, anio) => {
  try {
    const { data, error } = await supabase
      .from('turnos_v2')
      .update({
        persona_id: personaId,
        fecha_asignacion: fecha,
        mes_asignacion: mes,
        anio_asignacion: anio,
        estado: 'asignado'
      })
      .eq('id', turnoId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error al asignar persona a turno:', error)
    return { data: null, error }
  }
}

/**
 * Desasignar persona de turno
 */
export const desasignarPersonaTurno = async (turnoId) => {
  try {
    const { data, error } = await supabase
      .from('turnos_v2')
      .update({
        persona_id: null,
        fecha_asignacion: null,
        mes_asignacion: null,
        anio_asignacion: null,
        estado: 'disponible'
      })
      .eq('id', turnoId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error al desasignar persona de turno:', error)
    return { data: null, error }
  }
}

// ==================================================
// 📊 ESTADÍSTICAS Y REPORTES
// ==================================================

/**
 * Calcular estadísticas de turnos para un mes
 * NUEVO: Usa tarifa_hora de cada persona para calcular montos
 */
export const calcularEstadisticasMes = async (mes, anio) => {
  try {
    const { data: turnos, error } = await getTurnosV2({
      mes_asignacion: mes,
      anio_asignacion: anio
    })

    if (error) return { data: null, error }

    // Calcular estadísticas por persona
    const statsByPerson = {}

    turnos.forEach(turno => {
      if (!turno.persona_id) return

      const personaId = turno.persona_id
      if (!statsByPerson[personaId]) {
        statsByPerson[personaId] = {
          persona: turno.persona,
          totalTurnos: 0,
          turnosAsignados: 0,
          diasSemana: 0,
          sabados: 0,
          domingos: 0,
          horasTotales: 0,
          montoTotal: 0
        }
      }

      const stats = statsByPerson[personaId]
      stats.totalTurnos++

      if (turno.estado === 'asignado' || turno.estado === 'completado') {
        stats.turnosAsignados++

        // Contar tipo de día
        if (turno.dia_semana === 'sabado') {
          stats.sabados++
        } else if (turno.dia_semana === 'domingo') {
          stats.domingos++
        } else {
          stats.diasSemana++
        }

        // Calcular horas y monto usando tarifa de la persona
        const horas = calcularHorasTurno(turno.hora_inicio, turno.hora_fin)
        const tarifaHora = turno.persona?.tarifa_hora || 0
        const monto = calcularMontoTurno(tarifaHora, horas)

        stats.horasTotales += horas
        stats.montoTotal += monto
      }
    })

    // Convertir a array y ordenar por monto
    const porPersona = Object.values(statsByPerson).sort((a, b) => b.montoTotal - a.montoTotal)

    // Calcular totales generales
    const totales = porPersona.reduce(
      (acc, persona) => ({
        totalTurnos: acc.totalTurnos + persona.totalTurnos,
        turnosAsignados: acc.turnosAsignados + persona.turnosAsignados,
        diasSemana: acc.diasSemana + persona.diasSemana,
        sabados: acc.sabados + persona.sabados,
        domingos: acc.domingos + persona.domingos,
        horasTotales: acc.horasTotales + persona.horasTotales,
        montoTotal: acc.montoTotal + persona.montoTotal
      }),
      {
        totalTurnos: 0,
        turnosAsignados: 0,
        diasSemana: 0,
        sabados: 0,
        domingos: 0,
        horasTotales: 0,
        montoTotal: 0
      }
    )

    return {
      data: {
        porPersona,
        totales
      },
      error: null
    }
  } catch (error) {
    console.error('Error al calcular estadísticas del mes:', error)
    return { data: null, error }
  }
}

// ==================================================
// 🔧 UTILIDADES
// ==================================================

/**
 * Obtener todas las personas activas con sus tarifas
 */
export const getPersonasActivas = async () => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('id, nombre, rut, tipo, tarifa_hora, estado')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true })

    return { data, error }
  } catch (error) {
    console.error('Error al obtener personas activas:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar tarifa_hora de una persona
 */
export const updateTarifaPersona = async (personaId, tarifaHora) => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .update({ tarifa_hora: tarifaHora })
      .eq('id', personaId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error al actualizar tarifa de persona:', error)
    return { data: null, error }
  }
}

/**
 * Obtener fecha del día de la semana en un mes específico
 */
export const getFechaDelDia = (diaSemana, semana, mes, anio) => {
  const diasMap = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6
  }

  const diaSemanaNum = diasMap[diaSemana.toLowerCase()]
  const primerDia = new Date(anio, mes - 1, 1)
  const primerDiaSemana = primerDia.getDay()

  // Calcular offset para llegar al día deseado en la primera semana
  let offset = diaSemanaNum - primerDiaSemana
  if (offset < 0) offset += 7

  // Sumar las semanas
  const dia = offset + 1 + ((semana - 1) * 7)

  return new Date(anio, mes - 1, dia)
}

/**
 * Obtener número de semana del mes para una fecha
 */
export const getSemanaDelMes = (fecha) => {
  const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
  const diasDesdeInicio = Math.floor((fecha - primerDia) / (1000 * 60 * 60 * 24))
  return Math.floor(diasDesdeInicio / 7) + 1
}
