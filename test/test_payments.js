// Script de prueba para verificar el cálculo de pagos
import masterDataService from './src/services/masterDataService.js'

// Simular algunos turnos de prueba
const testShifts = [
  {
    fecha: '2025-01-15', // Miércoles normal
    turno: 'PRIMER TURNO',
    conductorNombre: 'JUAN PEREZ',
    cantidadEsperada: 1,
    archivo: 'test.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-15', // Miércoles normal
    turno: 'TERCER TURNO',
    conductorNombre: 'JUAN PEREZ',
    cantidadEsperada: 1,
    archivo: 'test.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-19', // Domingo
    turno: 'PRIMER TURNO',
    conductorNombre: 'MARIA GONZALEZ',
    cantidadEsperada: 1,
    archivo: 'test.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-18', // Sábado
    turno: 'TERCER TURNO',
    conductorNombre: 'CARLOS RODRIGUEZ',
    cantidadEsperada: 1,
    archivo: 'test.xlsx',
    fechaImportacion: new Date().toISOString()
  }
]

console.log('=== PRUEBA DE CÁLCULO DE PAGOS ===')
console.log('Tarifas configuradas:', masterDataService.getCalendarConfig().shiftRates)

// Limpiar datos anteriores
masterDataService.saveWorkerShifts([])

// Agregar turnos de prueba
masterDataService.addWorkerShifts(testShifts)

// Calcular pagos
const payments = masterDataService.calculateWorkerPayments()

console.log('\n=== RESULTADOS ===')
payments.forEach(payment => {
  console.log(`\nTrabajador: ${payment.conductorNombre}`)
  console.log(`Total turnos: ${payment.totalTurnos}`)
  console.log(`Total a pagar: $${payment.totalMonto.toLocaleString()}`)
  console.log('Desglose:')
  Object.entries(payment.desglosePorTipo).forEach(([tipo, data]) => {
    if (data.cantidad > 0) {
      console.log(`  ${tipo}: ${data.cantidad} turnos = $${data.monto.toLocaleString()}`)
    }
  })
})
