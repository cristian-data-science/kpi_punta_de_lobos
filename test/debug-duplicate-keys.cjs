// Script para diagnosticar keys duplicadas en React
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDuplicateKeys() {
  console.log('🔍 Investigando keys duplicadas en React...\n')

  try {
    // 1. Verificar si existen los IDs específicos del error
    const problematicIds = [
      '402aa04e-1578-4435-aef2-34f015acc3bc',
      '674f880e-c21d-4ac9-a36b-36ccd650d0ff'
    ]

    console.log('1️⃣ Verificando IDs problemáticos...')
    for (const id of problematicIds) {
      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .eq('id', id)

      if (error) {
        console.error(`❌ Error consultando ${id}:`, error)
        continue
      }

      console.log(`🔍 ID ${id}: ${data.length} registro(s) encontrado(s)`)
      if (data.length > 0) {
        console.table(data.map(t => ({
          id: t.id,
          fecha: t.fecha,
          trabajador_id: t.trabajador_id,
          turno_tipo: t.turno_tipo,
          estado: t.estado
        })))
      }
    }

    // 2. Buscar duplicados por ID en toda la tabla
    console.log('\n2️⃣ Buscando duplicados por ID en turnos...')
    const { data: allTurnos, error: allError } = await supabase
      .from('turnos')
      .select('id, fecha, trabajador_id, turno_tipo, estado')
      .order('fecha', { ascending: false })
      .limit(1000) // Limitar para no sobrecargar

    if (allError) {
      console.error('❌ Error cargando turnos:', allError)
      return
    }

    console.log(`📊 Total turnos cargados: ${allTurnos.length}`)

    // Contar duplicados por ID
    const idCounts = {}
    allTurnos.forEach(turno => {
      idCounts[turno.id] = (idCounts[turno.id] || 0) + 1
    })

    const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1)
    
    if (duplicateIds.length > 0) {
      console.log(`❌ ENCONTRADOS ${duplicateIds.length} IDs duplicados:`)
      duplicateIds.forEach(([id, count]) => {
        console.log(`  - ID ${id}: aparece ${count} veces`)
      })
    } else {
      console.log('✅ No se encontraron IDs duplicados en la base de datos')
    }

    // 3. Verificar la consulta exacta que usa el componente React
    console.log('\n3️⃣ Simulando consulta del componente React...')
    const currentYear = new Date().getFullYear()
    const startOfYear = `${currentYear}-01-01`
    const endOfYear = `${currentYear}-12-31`

    const { data: yearTurnos, error: yearError } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          id,
          nombre,
          rut
        )
      `)
      .gte('fecha', startOfYear)
      .lte('fecha', endOfYear)
      .order('fecha', { ascending: false })

    if (yearError) {
      console.error('❌ Error simulando consulta:', yearError)
      return
    }

    console.log(`📊 Turnos del año ${currentYear}: ${yearTurnos.length}`)

    // Verificar duplicados en esta consulta específica
    const yearIdCounts = {}
    yearTurnos.forEach(turno => {
      yearIdCounts[turno.id] = (yearIdCounts[turno.id] || 0) + 1
    })

    const yearDuplicates = Object.entries(yearIdCounts).filter(([id, count]) => count > 1)
    
    if (yearDuplicates.length > 0) {
      console.log(`❌ DUPLICADOS EN CONSULTA DEL COMPONENTE:`)
      yearDuplicates.forEach(([id, count]) => {
        console.log(`  - ID ${id}: aparece ${count} veces`)
        // Mostrar detalles de los registros duplicados
        const duplicateRecords = yearTurnos.filter(t => t.id === id)
        console.table(duplicateRecords.map(t => ({
          id: t.id,
          fecha: t.fecha,
          trabajador: t.trabajador?.nombre,
          turno_tipo: t.turno_tipo,
          estado: t.estado
        })))
      })
    } else {
      console.log('✅ No se encontraron duplicados en la consulta del componente')
    }

    // 4. Verificar trabajadores duplicados
    console.log('\n4️⃣ Verificando trabajadores duplicados...')
    const { data: workers, error: workersError } = await supabase
      .from('trabajadores')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre')

    if (workersError) {
      console.error('❌ Error cargando trabajadores:', workersError)
      return
    }

    const workerIdCounts = {}
    workers.forEach(worker => {
      workerIdCounts[worker.id] = (workerIdCounts[worker.id] || 0) + 1
    })

    const duplicateWorkers = Object.entries(workerIdCounts).filter(([id, count]) => count > 1)
    
    if (duplicateWorkers.length > 0) {
      console.log(`❌ TRABAJADORES DUPLICADOS:`)
      duplicateWorkers.forEach(([id, count]) => {
        console.log(`  - Worker ID ${id}: aparece ${count} veces`)
      })
    } else {
      console.log('✅ No hay trabajadores duplicados')
    }

    // 5. Sugerencias de solución
    console.log('\n🔧 ANÁLISIS Y SUGERENCIAS:')
    
    if (yearDuplicates.length > 0) {
      console.log('❌ PROBLEMA ENCONTRADO: Hay registros duplicados en la consulta')
      console.log('💡 SOLUCIONES:')
      console.log('   1. Agregar DISTINCT a la consulta SQL')
      console.log('   2. Filtrar duplicados en JavaScript con Set o Map')
      console.log('   3. Revisar triggers o lógica que pueda crear duplicados')
      console.log('   4. Usar key compuesta: key={`${turno.id}-${index}`}')
    } else {
      console.log('✅ No hay duplicados evidentes en los datos')
      console.log('💡 El problema puede ser:')
      console.log('   1. Re-renderizado múltiple del componente')
      console.log('   2. Estado que se actualiza múltiples veces')
      console.log('   3. Efectos que se ejecutan varias veces')
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

// Ejecutar diagnóstico
debugDuplicateKeys()
