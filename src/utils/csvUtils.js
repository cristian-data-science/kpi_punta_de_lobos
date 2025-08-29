// Utilidades para manejo de archivos CSV
export const parseCSV = (csvText) => {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(header => header.trim())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line) {
      const values = line.split(',').map(value => value.trim())
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
  }

  return { headers, rows }
}

// Validar estructura de CSV para trabajadores
export const validateWorkersCSV = (data) => {
  const requiredFields = ['nombre', 'rut', 'cargo', 'telefono']
  const { headers, rows } = data
  
  const missingFields = requiredFields.filter(field => 
    !headers.some(header => header.toLowerCase().includes(field))
  )

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
    }
  }

  // Validar que hay datos
  if (rows.length === 0) {
    return {
      valid: false,
      error: 'El archivo no contiene datos'
    }
  }

  return { valid: true, data: rows }
}

// Validar estructura de CSV para vehículos
export const validateVehiclesCSV = (data) => {
  const requiredFields = ['patente', 'marca', 'modelo', 'año']
  const { headers, rows } = data
  
  const missingFields = requiredFields.filter(field => 
    !headers.some(header => header.toLowerCase().includes(field))
  )

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
    }
  }

  if (rows.length === 0) {
    return {
      valid: false,
      error: 'El archivo no contiene datos'
    }
  }

  return { valid: true, data: rows }
}

// Validar estructura de CSV para rutas
export const validateRoutesCSV = (data) => {
  const requiredFields = ['codigo', 'nombre', 'origen', 'destino']
  const { headers, rows } = data
  
  const missingFields = requiredFields.filter(field => 
    !headers.some(header => header.toLowerCase().includes(field))
  )

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
    }
  }

  if (rows.length === 0) {
    return {
      valid: false,
      error: 'El archivo no contiene datos'
    }
  }

  return { valid: true, data: rows }
}

// Formatear datos para el almacenamiento
export const formatWorkerData = (rawData) => {
  return rawData.map((item, index) => ({
    id: index + 1,
    name: item.nombre || item.name || '',
    rut: item.rut || '',
    position: item.cargo || item.position || '',
    phone: item.telefono || item.phone || '',
    status: 'Activo',
    hireDate: item.fecha_ingreso || item.hire_date || new Date().toISOString().split('T')[0]
  }))
}

export const formatVehicleData = (rawData) => {
  return rawData.map((item, index) => ({
    id: index + 1,
    plate: item.patente || item.plate || '',
    brand: item.marca || item.brand || '',
    model: item.modelo || item.model || '',
    year: parseInt(item.año || item.year) || new Date().getFullYear(),
    status: item.estado || item.status || 'Operativo',
    driver: item.conductor || item.driver || '-',
    lastMaintenance: item.ultimo_mantenimiento || item.last_maintenance || '',
    nextMaintenance: item.proximo_mantenimiento || item.next_maintenance || ''
  }))
}

export const formatRouteData = (rawData) => {
  return rawData.map((item, index) => ({
    id: index + 1,
    code: item.codigo || item.code || `RT-${String(index + 1).padStart(3, '0')}`,
    name: item.nombre || item.name || '',
    origin: item.origen || item.origin || '',
    destination: item.destino || item.destination || '',
    distance: item.distancia || item.distance || '',
    estimatedTime: item.tiempo_estimado || item.estimated_time || '',
    status: item.estado || item.status || 'Activa',
    assignedVehicle: item.vehiculo_asignado || item.assigned_vehicle || '-',
    driver: item.conductor || item.driver || '-'
  }))
}
