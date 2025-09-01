// Test script para debug del sistema de validación
const XLSX = require('xlsx')

// Simular las reglas
const rules = {
  turnos: {
    allowed: ['PRIMER TURNO', 'SEGUNDO TURNO', 'TERCER TURNO']
  }
}

// Simular estructura detectada
const structure = {
  columnMapping: {
    FECHA: 0,
    TURNO: 1,
    'CANT.': 2,
    'CONDUCTOR 1': 3,
    'CONDUCTOR 2': 4,
    'CONDUCTOR 3': 5,
    'CONDUCTOR 4': 6,
    'CONDUCTOR 5': 7
  },
  dataStartRow: 1,
  dataEndRow: 5
}

// Cargar archivo real
try {
  console.log('🔍 Testing validation logic...')
  
  const workbook = XLSX.readFile('excel_files/PLANILLA 277 SEMANA 31  DEL 2025.xlsx')
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })
  
  console.log('📊 Headers detectados:', data[0])
  
  // Simular el bucle de validación
  let validTurnos = 0
  
  for (let i = structure.dataStartRow; i < Math.min(structure.dataEndRow, data.length); i++) {
    const row = data[i]
    if (!row) continue
    
    const turno = row[structure.columnMapping.TURNO]
    const cantCol = structure.columnMapping['CANT.'] || structure.columnMapping['CANT']
    const cantidadEsperada = cantCol !== undefined ? row[cantCol] : null
    
    console.log(`📝 Fila ${i}:`)
    console.log(`  - Turno: "${turno}" (tipo: ${typeof turno})`)
    console.log(`  - Cantidad: ${cantidadEsperada} (tipo: ${typeof cantidadEsperada})`)
    console.log(`  - Turno válido: ${rules.turnos.allowed.includes(turno)}`)
    console.log(`  - Cantidad > 0: ${cantidadEsperada > 0}`)
    
    if (turno && rules.turnos.allowed.includes(turno) && cantidadEsperada > 0) {
      validTurnos++
      console.log(`  ✅ TURNO VÁLIDO`)
    } else {
      console.log(`  ❌ TURNO RECHAZADO`)
    }
    console.log('')
  }
  
  console.log(`🎯 Total turnos válidos encontrados: ${validTurnos}`)
  
} catch (error) {
  console.error('❌ Error:', error.message)
}
