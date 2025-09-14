const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function restoreCarlosShifts() {
  console.log('🔄 Restaurando turnos del 13 de agosto...')
  
  // Los datos que obtuvimos antes de la eliminación accidental
  const shiftsToRestore = [
    {
      trabajador_id: 'c8feefd4-7154-4d26-9253-35a1c401fa08', // Carlos
      fecha: '2025-08-13',
      turno_tipo: 'primer_turno',
      estado: 'programado'
    },
    {
      trabajador_id: 'c8feefd4-7154-4d26-9253-35a1c401fa08', // Carlos  
      fecha: '2025-08-13',
      turno_tipo: 'tercer_turno',
      estado: 'programado'
    }
  ]
  
  const { error } = await supabase
    .from('turnos')
    .insert(shiftsToRestore)
  
  if (error) {
    console.error('❌ Error restaurando:', error)
  } else {
    console.log('✅ Turnos de Carlos restaurados correctamente')
  }
}

restoreCarlosShifts().catch(console.error)
