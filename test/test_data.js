// Script para crear datos de prueba y probar la funcionalidad
console.log('=== CREANDO DATOS DE PRUEBA ===')

// Datos de prueba que incluyen feriados y domingos
const testShifts = [
  // Juan Pérez - múltiples turnos incluyendo domingo y feriado
  {
    fecha: '2025-01-15', // Miércoles normal
    turno: 'PRIMER TURNO',
    conductorNombre: 'JUAN PÉREZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-16', // Jueves normal
    turno: 'TERCER TURNO',
    conductorNombre: 'JUAN PÉREZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-19', // Domingo
    turno: 'PRIMER TURNO',
    conductorNombre: 'JUAN PÉREZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-01', // Año Nuevo (feriado)
    turno: 'SEGUNDO TURNO',
    conductorNombre: 'JUAN PÉREZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },

  // María González - diferentes tipos de turnos
  {
    fecha: '2025-01-17', // Viernes normal
    turno: 'PRIMER TURNO',
    conductorNombre: 'MARÍA GONZÁLEZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-18', // Sábado
    turno: 'TERCER TURNO',
    conductorNombre: 'MARÍA GONZÁLEZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-19', // Domingo
    turno: 'SEGUNDO TURNO',
    conductorNombre: 'MARÍA GONZÁLEZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },

  // Carlos Rodríguez - menos turnos
  {
    fecha: '2025-01-20', // Lunes normal
    turno: 'PRIMER TURNO',
    conductorNombre: 'CARLOS RODRÍGUEZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  },
  {
    fecha: '2025-01-21', // Martes normal
    turno: 'TERCER TURNO',
    conductorNombre: 'CARLOS RODRÍGUEZ',
    cantidadEsperada: 1,
    archivo: 'planilla_semana_1.xlsx',
    fechaImportacion: new Date().toISOString()
  }
]

// Simular subida de datos
console.log('📊 Turnos a procesar:', testShifts.length)
testShifts.forEach((shift, index) => {
  console.log(`${index + 1}. ${shift.conductorNombre} - ${shift.fecha} - ${shift.turno}`)
})

console.log('\n🎯 Para probar en la aplicación:')
console.log('1. Ve a la sección "Subir Archivos"')
console.log('2. Sube una planilla Excel con estos datos')
console.log('3. Ve a la sección "Pagos" para ver los cálculos')
console.log('4. Haz clic en cada trabajador para expandir detalles')
console.log('5. Observa los íconos de feriados (🎁) y domingos (⭐)')

export default testShifts
