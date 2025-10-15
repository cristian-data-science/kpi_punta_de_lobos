// 🎭 Datos de ejemplo para testing del calendario semanal
// Basado en la maqueta Excel proporcionada

export const FIXTURE_BLOCKS = [
  // LUNES
  {"id":"lu-scar-1","day":0,"start":"09:00","end":"11:00","label":"SCARLETTE","role":"OPER","type":"shift"},
  {"id":"lu-lunch-1","day":0,"start":"12:00","end":"13:00","label":"Almuerzo","type":"lunch"},
  {"id":"lu-scar-2","day":0,"start":"14:00","end":"16:00","label":"SCARLETTE","type":"shift"},

  // MARTES
  {"id":"ma-tina-1","day":1,"start":"09:00","end":"12:00","label":"TINA","type":"shift"},
  {"id":"ma-scar-1","day":1,"start":"11:00","end":"13:00","label":"SCARLETTE","type":"shift"},
  {"id":"ma-lunch-1","day":1,"start":"13:00","end":"14:00","label":"Almuerzo","type":"lunch"},
  {"id":"ma-tina-2","day":1,"start":"14:00","end":"16:00","label":"TINA","type":"shift"},
  {"id":"ma-scar-2","day":1,"start":"17:00","end":"20:00","label":"SCARLETTE","type":"shift"},

  // MIÉRCOLES
  {"id":"mi-tina-1","day":2,"start":"09:00","end":"11:00","label":"TINA","type":"shift"},
  {"id":"mi-nico-1","day":2,"start":"11:00","end":"13:00","label":"NICO","type":"shift"},
  {"id":"mi-lunch-1","day":2,"start":"13:00","end":"14:00","label":"Almuerzo","type":"lunch"},
  {"id":"mi-tina-2","day":2,"start":"14:00","end":"16:00","label":"TINA","type":"shift"},
  {"id":"mi-nico-2","day":2,"start":"17:00","end":"20:00","label":"NICO","type":"shift"},

  // JUEVES
  {"id":"ju-tina-1","day":3,"start":"09:00","end":"13:00","label":"TINA","type":"shift"},
  {"id":"ju-nico-1","day":3,"start":"11:00","end":"13:00","label":"NICO","type":"shift"},
  {"id":"ju-lunch-1","day":3,"start":"13:00","end":"14:00","label":"Almuerzo","type":"lunch"},
  {"id":"ju-tina-2","day":3,"start":"14:00","end":"16:00","label":"TINA","type":"shift"},
  {"id":"ju-nico-2","day":3,"start":"17:00","end":"20:00","label":"NICO","type":"shift"},
  {"id":"ju-banos-1","day":3,"start":"17:00","end":"20:00","label":"BAÑOS","type":"shift"},

  // VIERNES
  {"id":"vi-tina-1","day":4,"start":"09:00","end":"13:00","label":"TINA","type":"shift"},
  {"id":"vi-nico-1","day":4,"start":"10:00","end":"13:00","label":"NICO","type":"shift"},
  {"id":"vi-gp4-1","day":4,"start":"11:00","end":"13:00","label":"GP 4","type":"shift"},
  {"id":"vi-lunch-1","day":4,"start":"13:00","end":"14:00","label":"Almuerzo","type":"lunch"},
  {"id":"vi-banos-1","day":4,"start":"12:00","end":"14:00","label":"BAÑOS","type":"shift"},
  {"id":"vi-nico-2","day":4,"start":"15:00","end":"17:00","label":"NICO","type":"shift"},
  {"id":"vi-gp4-2","day":4,"start":"16:00","end":"19:00","label":"GP 4","type":"shift"},
  {"id":"vi-banos-2","day":4,"start":"17:00","end":"20:00","label":"BAÑOS","type":"shift"},

  // SÁBADO
  {"id":"sa-scar-1","day":5,"start":"09:00","end":"11:00","label":"SCARLETTE","type":"shift"},
  {"id":"sa-nico-1","day":5,"start":"11:00","end":"13:00","label":"NICO","type":"shift"},
  {"id":"sa-gp4-1","day":5,"start":"11:00","end":"13:00","label":"GP 4","type":"shift"},
  {"id":"sa-lunch-1","day":5,"start":"13:00","end":"14:00","label":"Almuerzo","type":"lunch"},
  {"id":"sa-banos-1","day":5,"start":"12:00","end":"14:00","label":"BAÑOS","type":"shift"},
  {"id":"sa-scar-2","day":5,"start":"14:00","end":"17:00","label":"SCARLETTE","type":"shift"},
  {"id":"sa-nico-2","day":5,"start":"15:00","end":"17:00","label":"NICO","type":"shift"},
  {"id":"sa-gp4-2","day":5,"start":"15:00","end":"17:00","label":"GP 4","type":"shift"},
  {"id":"sa-banos-2","day":5,"start":"16:00","end":"20:00","label":"BAÑOS","type":"shift"},

  // DOMINGO
  {"id":"do-scar-1","day":6,"start":"09:00","end":"11:00","label":"SCARLETTE","type":"shift"},
  {"id":"do-gp5-1","day":6,"start":"10:00","end":"13:00","label":"GP 5","type":"shift"},
  {"id":"do-gp4-1","day":6,"start":"11:00","end":"14:00","label":"GP 4","type":"shift"},
  {"id":"do-lunch-1","day":6,"start":"13:00","end":"14:00","label":"Almuerzo","type":"lunch"},
  {"id":"do-banos-1","day":6,"start":"12:00","end":"14:00","label":"BAÑOS","type":"shift"},
  {"id":"do-scar-2","day":6,"start":"14:00","end":"17:00","label":"SCARLETTE","type":"shift"},
  {"id":"do-gp5-2","day":6,"start":"15:00","end":"17:00","label":"GP 5","type":"shift"},
  {"id":"do-gp4-2","day":6,"start":"16:00","end":"19:00","label":"GP 4","type":"shift"},
  {"id":"do-banos-2","day":6,"start":"16:00","end":"20:00","label":"BAÑOS","type":"shift"}
]

// Función para generar turnos de Supabase simulados desde los fixtures
export const generateMockTurnos = (weekStart) => {
  const startDate = new Date(weekStart + 'T00:00:00')
  
  return FIXTURE_BLOCKS.map(block => {
    const turnoDate = new Date(startDate)
    turnoDate.setDate(turnoDate.getDate() + block.day)
    
    return {
      id: block.id,
      persona_id: `persona-${block.label}`,
      fecha: turnoDate.toISOString().split('T')[0],
      hora_inicio: block.start,
      hora_fin: block.end,
      tipo_turno: block.type === 'lunch' ? 'almuerzo' : 'completo',
      estado: 'programado',
      puesto: block.role || block.label,
      ubicacion: 'Punta de Lobos',
      notas: '',
      persona: {
        id: `persona-${block.label}`,
        nombre: block.label,
        tipo: 'empleado'
      }
    }
  })
}
