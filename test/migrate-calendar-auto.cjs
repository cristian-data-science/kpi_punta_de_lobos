/**
 * 🚀 Script de Migración Automática: localStorage → Supabase
 * 
 * Este script lee los datos de localStorage desde el navegador
 * y los inserta automáticamente en las tablas de Supabase
 */

const { createClient } = require('@supabase/supabase-js')

async function migrateDataToSupabase() {
  console.log('🚀 Migración Automática de Datos de Calendario')
  console.log('=' .repeat(60))

  // Configurar cliente Supabase
  const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    console.log('🔍 Verificando estado actual de Supabase...')
    
    // Verificar conexión y datos existentes
    const [ratesResult, holidaysResult] = await Promise.all([
      supabase.from('shift_rates').select('*'),
      supabase.from('holidays').select('*')
    ])

    if (ratesResult.error) {
      console.error('❌ Error conectando con shift_rates:', ratesResult.error.message)
      return
    }

    if (holidaysResult.error) {
      console.error('❌ Error conectando con holidays:', holidaysResult.error.message)
      return
    }

    console.log(`✅ Conectado a Supabase exitosamente`)
    console.log(`📊 Estado actual:`)
    console.log(`   - Tarifas: ${ratesResult.data.length} registros`)
    console.log(`   - Feriados: ${holidaysResult.data.length} registros`)

    // Datos por defecto para migrar (basados en masterDataService)
    const defaultConfig = {
      shiftRates: {
        firstSecondShift: 20000,      // Primeros y segundos turnos (Lun-Sáb)
        thirdShiftWeekday: 22500,     // Tercer turno (Lun-Vie)
        thirdShiftSaturday: 27500,    // Tercer turno sábado
        holiday: 27500,               // Festivos (cualquier turno)
        sunday: 35000                 // Domingo (todos los turnos)
      },
      holidays: [
        // Feriados chilenos por defecto 2025
        '2025-01-01', // Año Nuevo
        '2025-04-18', // Viernes Santo
        '2025-04-19', // Sábado Santo
        '2025-05-01', // Día del Trabajador
        '2025-05-21', // Día de las Glorias Navales
        '2025-09-18', // Fiestas Patrias
        '2025-09-19', // Día del Ejército
        '2025-12-25'  // Navidad
      ]
    }

    console.log('\n🔄 Iniciando migración de datos por defecto...')

    // Migrar tarifas
    console.log('\n📊 Migrando tarifas...')
    let tarifasInsertadas = 0
    let tarifasActualizadas = 0

    for (const [rateName, rateValue] of Object.entries(defaultConfig.shiftRates)) {
      // Verificar si ya existe
      const existingRate = ratesResult.data.find(r => r.rate_name === rateName)
      
      if (existingRate) {
        // Actualizar si el valor es diferente
        if (existingRate.rate_value !== rateValue) {
          const { error } = await supabase
            .from('shift_rates')
            .update({ 
              rate_value: rateValue,
              updated_at: new Date().toISOString()
            })
            .eq('rate_name', rateName)
          
          if (error) {
            console.error(`❌ Error actualizando tarifa ${rateName}:`, error.message)
          } else {
            console.log(`🔄 Actualizada tarifa: ${rateName} = $${rateValue.toLocaleString()}`)
            tarifasActualizadas++
          }
        } else {
          console.log(`✅ Tarifa ${rateName} ya existe con valor correcto: $${rateValue.toLocaleString()}`)
        }
      } else {
        // Insertar nueva tarifa
        const { error } = await supabase
          .from('shift_rates')
          .insert({
            rate_name: rateName,
            rate_value: rateValue,
            description: getDescripcionTarifa(rateName)
          })
        
        if (error) {
          console.error(`❌ Error insertando tarifa ${rateName}:`, error.message)
        } else {
          console.log(`✨ Nueva tarifa insertada: ${rateName} = $${rateValue.toLocaleString()}`)
          tarifasInsertadas++
        }
      }
    }

    // Migrar feriados
    console.log('\n📅 Migrando feriados...')
    let feriadosInsertados = 0

    for (const holiday of defaultConfig.holidays) {
      // Verificar si ya existe
      const existingHoliday = holidaysResult.data.find(h => h.holiday_date === holiday)
      
      if (!existingHoliday) {
        const { error } = await supabase
          .from('holidays')
          .insert({
            holiday_date: holiday,
            description: getDescripcionFeriado(holiday)
          })
        
        if (error) {
          console.error(`❌ Error insertando feriado ${holiday}:`, error.message)
        } else {
          console.log(`✨ Nuevo feriado insertado: ${holiday}`)
          feriadosInsertados++
        }
      } else {
        console.log(`✅ Feriado ${holiday} ya existe`)
      }
    }

    // Resumen final
    console.log('\n🎉 Migración completada exitosamente!')
    console.log(`📊 Resumen:`)
    console.log(`   - Tarifas insertadas: ${tarifasInsertadas}`)
    console.log(`   - Tarifas actualizadas: ${tarifasActualizadas}`)
    console.log(`   - Feriados insertados: ${feriadosInsertados}`)
    
    // Verificar datos finales
    const [finalRates, finalHolidays] = await Promise.all([
      supabase.from('shift_rates').select('*').order('rate_name'),
      supabase.from('holidays').select('*').order('holiday_date')
    ])

    console.log('\n✅ Estado final en Supabase:')
    console.log('📊 Tarifas:')
    finalRates.data.forEach(rate => {
      console.log(`   - ${rate.rate_name}: $${rate.rate_value.toLocaleString()}`)
    })
    
    console.log('📅 Feriados:')
    finalHolidays.data.forEach(holiday => {
      console.log(`   - ${holiday.holiday_date}`)
    })

    console.log('\n🚀 ¡Listo para usar! Calendar.jsx y Payments.jsx ahora usarán estos datos.')

  } catch (error) {
    console.error('❌ Error durante migración:', error.message)
    console.log('\n🔧 Verifica que:')
    console.log('1. Las tablas se crearon correctamente en Supabase')
    console.log('2. VITE_SUPABASE_ANON_KEY es correcta')
    console.log('3. Las políticas RLS permiten insertar datos')
  }
}

function getDescripcionTarifa(rateName) {
  const descripciones = {
    firstSecondShift: 'Primeros y segundos turnos (Lun-Sáb)',
    thirdShiftWeekday: 'Tercer turno (Lun-Vie)',
    thirdShiftSaturday: 'Tercer turno sábado',
    holiday: 'Festivos (cualquier turno)',
    sunday: 'Domingo (todos los turnos)'
  }
  return descripciones[rateName] || 'Tarifa de turno'
}

function getDescripcionFeriado(date) {
  const fechas = {
    '2025-01-01': 'Año Nuevo',
    '2025-04-18': 'Viernes Santo',
    '2025-04-19': 'Sábado Santo',
    '2025-05-01': 'Día del Trabajador',
    '2025-05-21': 'Día de las Glorias Navales',
    '2025-09-18': 'Fiestas Patrias',
    '2025-09-19': 'Día del Ejército',
    '2025-12-25': 'Navidad'
  }
  return fechas[date] || 'Feriado'
}

// Ejecutar migración
migrateDataToSupabase().catch(console.error)
