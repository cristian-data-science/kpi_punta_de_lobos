// Test para verificar que la corrección del extractInconsistencies funciona
import * as XLSX from 'xlsx'

async function testValidationService() {
  try {
    console.log('🧪 Probando importación del servicio de validación...')
    
    // Importar el servicio
    const { default: excelValidationService } = await import('./src/services/excelValidationService.js')
    console.log('✅ Servicio importado correctamente')
    
    // Probar con archivo real usando readFile correctamente
    const buffer = await import('fs').then(fs => fs.promises.readFile('excel_files/PLANILLA 277 SEMANA 31  DEL 2025.xlsx'))
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    
    console.log('📋 Procesando archivo de prueba...')
    const result = await excelValidationService.validateAndCorrectExcel(worksheet, 'test.xlsx', 'default')
    
    console.log('✅ Validación completada exitosamente!')
    console.log('📊 Resultado:', {
      errores: result.errors?.length || 0,
      advertencias: result.warnings?.length || 0,
      turnos: result.turnos?.length || 0,
      correcciones: result.correctionLog?.length || 0
    })
    
    // Verificar que las inconsistencias se guardaron
    const { default: masterDataService } = await import('./src/services/masterDataService.js')
    const inconsistencies = masterDataService.getInconsistencias()
    console.log('🔍 Inconsistencias detectadas:', inconsistencies.data?.length || 0)
    
    console.log('🎉 Test completado exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message)
    console.error(error.stack)
  }
}

testValidationService()
