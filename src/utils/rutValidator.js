/**
 * 🇨🇱 Utilidades para validación y formateo de RUT chileno
 */

/**
 * Formatea un RUT con puntos y guión
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado (ej: 12.345.678-9)
 */
export const formatRut = (rut) => {
  // Eliminar caracteres no numéricos excepto K
  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  
  if (cleanRut.length < 2) return cleanRut
  
  // Separar número y dígito verificador
  const dv = cleanRut.slice(-1)
  const numero = cleanRut.slice(0, -1)
  
  // Formatear número con puntos
  const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `${numeroFormateado}-${dv}`
}

/**
 * Limpia un RUT de puntos y guiones
 * @param {string} rut - RUT con o sin formato
 * @returns {string} RUT sin formato (ej: 123456789)
 */
export const cleanRut = (rut) => {
  return rut.replace(/[.-]/g, '').toUpperCase()
}

/**
 * Calcula el dígito verificador de un RUT
 * @param {string} rutSinDv - RUT sin dígito verificador
 * @returns {string} Dígito verificador (0-9 o K)
 */
export const calcularDv = (rutSinDv) => {
  let suma = 0
  let multiplicador = 2
  
  // Recorrer de derecha a izquierda
  for (let i = rutSinDv.length - 1; i >= 0; i--) {
    suma += parseInt(rutSinDv[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  
  const resto = suma % 11
  const dv = 11 - resto
  
  if (dv === 11) return '0'
  if (dv === 10) return 'K'
  return dv.toString()
}

/**
 * Valida si un RUT es válido
 * @param {string} rut - RUT con o sin formato
 * @returns {boolean} true si el RUT es válido
 */
export const validarRut = (rut) => {
  if (!rut || typeof rut !== 'string') return false
  
  // Limpiar RUT
  const rutLimpio = cleanRut(rut)
  
  // Validar largo mínimo (7 dígitos + 1 dv = 8 caracteres)
  if (rutLimpio.length < 8) return false
  
  // Separar número y dígito verificador
  const dv = rutLimpio.slice(-1)
  const numero = rutLimpio.slice(0, -1)
  
  // Validar que el número sea numérico
  if (!/^\d+$/.test(numero)) return false
  
  // Calcular y comparar dígito verificador
  const dvCalculado = calcularDv(numero)
  
  return dv === dvCalculado
}

/**
 * Valida y formatea un RUT en un solo paso
 * @param {string} rut - RUT con o sin formato
 * @returns {object} { isValid: boolean, formatted: string, clean: string }
 */
export const validateAndFormatRut = (rut) => {
  const clean = cleanRut(rut)
  const isValid = validarRut(rut)
  const formatted = isValid ? formatRut(clean) : rut
  
  return {
    isValid,
    formatted,
    clean
  }
}

export default {
  formatRut,
  cleanRut,
  calcularDv,
  validarRut,
  validateAndFormatRut
}
