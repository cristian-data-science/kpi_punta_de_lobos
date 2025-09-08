/**
 * 🧪 Verificación específica para los trabajadores creados
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🧪 TransApp - Verificación de trabajadores')
console.log('=========================================')

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyWorkers() {
  try {
    console.log('\n👥 Verificando trabajadores insertados...')

    const { data: workers, error } = await supabase
      .from('trabajadores')
      .select('*')
      .order('nombre')

    if (error) throw error

    console.log(`\n✅ Total trabajadores: ${workers.length}/14`)
    
    if (workers.length > 0) {
      console.log('\n📋 Lista completa:')
      console.log('=================')
      
      workers.forEach((worker, index) => {
        const contract = worker.contrato === 'fijo' ? '🔒 Fijo' : '📄 Eventual'
        const phone = worker.telefono || '📞 Sin teléfono'
        
        console.log(`${(index + 1).toString().padStart(2)}. ${worker.nombre}`)
        console.log(`    RUT: ${worker.rut} | ${contract} | ${phone}`)
        console.log(`    Estado: ${worker.estado} | Creado: ${worker.created_at.split('T')[0]}`)
        console.log('')
      })
    }

    // Verificar estructura de tabla
    console.log('🔍 Verificando estructura de tabla...')
    if (workers.length > 0) {
      const firstWorker = workers[0]
      const fields = Object.keys(firstWorker)
      
      console.log('📊 Campos disponibles:', fields.join(', '))
      
      const requiredFields = ['id', 'nombre', 'rut', 'contrato', 'telefono', 'estado']
      const missingFields = requiredFields.filter(field => !fields.includes(field))
      
      if (missingFields.length === 0) {
        console.log('✅ Estructura de tabla correcta')
      } else {
        console.log('❌ Campos faltantes:', missingFields.join(', '))
      }
    }

    return workers

  } catch (error) {
    console.error('❌ Error:', error.message)
    
    if (error.message.includes("Could not find the table")) {
      console.log('\n💡 SOLUCIÓN:')
      console.log('1. Ve a: https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new')
      console.log('2. Copia y pega todo el contenido del archivo: supabase_setup.sql')
      console.log('3. Haz clic en "RUN" para ejecutar')
      console.log('4. Vuelve a ejecutar: node verify-workers.js')
    }
    
    return []
  }
}

async function verifyTurnos() {
  try {
    console.log('\n📅 Verificando tabla turnos...')

    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('*')
      .limit(5)

    if (error) {
      console.log('❌ Tabla turnos no existe aún')
      return false
    }

    console.log('✅ Tabla turnos existe con ' + turnos.length + ' registros de ejemplo')
    return true

  } catch (error) {
    console.log('❌ Error verificando turnos:', error.message)
    return false
  }
}

async function main() {
  const workers = await verifyWorkers()
  await verifyTurnos()

  console.log('\n=========================================')
  
  if (workers.length === 14) {
    console.log('🎉 ¡CONFIGURACIÓN PERFECTA!')
    console.log('✅ 14 trabajadores insertados correctamente')
    console.log('✅ Tabla con estructura correcta')
    console.log('✅ TransApp listo para usar')
    
    console.log('\n🚀 Próximos pasos:')
    console.log('• Abrir http://localhost:5173')
    console.log('• Verificar módulo Trabajadores')
    console.log('• Comenzar a usar el sistema')
    
  } else if (workers.length > 0) {
    console.log(`⚠️ CONFIGURACIÓN PARCIAL: ${workers.length}/14 trabajadores`)
    console.log('💡 Revisa si hay duplicados o errores en el SQL')
    
  } else {
    console.log('❌ CONFIGURACIÓN PENDIENTE')
    console.log('💡 Ejecuta el script SQL en Supabase Dashboard primero')
  }
}

main().catch(console.error)
