/**
 * Utilidades para validación y formateo de RUT chileno
 * Implementa algoritmo estándar de validación de RUT con dígito verificador
 */

/**
 * Limpia un RUT removiendo puntos, guiones y espacios
 * @param {string} rut - RUT a limpiar
 * @returns {string} RUT limpio (solo números y K)
 */
export const cleanRut = (rut) => {
  if (!rut || typeof rut !== 'string') return '';
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
};

/**
 * Calcula el dígito verificador de un RUT
 * @param {string} rutNumber - Parte numérica del RUT (sin dígito verificador)
 * @returns {string} Dígito verificador (0-9 o K)
 */
export const calculateVerifierDigit = (rutNumber) => {
  if (!rutNumber || isNaN(rutNumber)) return '';
  
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer de derecha a izquierda
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const verifier = 11 - remainder;
  
  if (verifier === 11) return '0';
  if (verifier === 10) return 'K';
  return verifier.toString();
};

/**
 * Valida si un RUT chileno es válido
 * @param {string} rut - RUT completo a validar
 * @returns {boolean} True si el RUT es válido
 */
export const validateRut = (rut) => {
  const cleanedRut = cleanRut(rut);
  
  // Verificar longitud mínima y máxima (7-9 dígitos + verificador)
  if (cleanedRut.length < 8 || cleanedRut.length > 10) return false;
  
  // Separar número y dígito verificador
  const rutNumber = cleanedRut.slice(0, -1);
  const verifierDigit = cleanedRut.slice(-1);
  
  // Verificar que la parte numérica sea válida
  if (isNaN(rutNumber) || rutNumber.length < 7) return false;
  
  // Calcular y comparar dígito verificador
  const calculatedVerifier = calculateVerifierDigit(rutNumber);
  
  return verifierDigit === calculatedVerifier;
};

/**
 * Formatea un RUT con puntos y guión
 * @param {string} rut - RUT a formatear
 * @returns {string} RUT formateado (ej: 12.345.678-9)
 */
export const formatRut = (rut) => {
  const cleanedRut = cleanRut(rut);
  
  if (!cleanedRut) return '';
  
  // Separar número y dígito verificador
  const rutNumber = cleanedRut.slice(0, -1);
  const verifierDigit = cleanedRut.slice(-1);
  
  // Formatear con puntos cada 3 dígitos
  const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedNumber}-${verifierDigit}`;
};

/**
 * Normaliza un RUT para almacenamiento (formato con guión, sin puntos)
 * @param {string} rut - RUT a normalizar
 * @returns {string} RUT normalizado (formato XXXXXXXX-X)
 */
export const normalizeRut = (rut) => {
  const cleanedRut = cleanRut(rut);
  
  if (!validateRut(cleanedRut)) return '';
  
  // Separar número y dígito verificador
  const rutNumber = cleanedRut.slice(0, -1);
  const verifierDigit = cleanedRut.slice(-1);
  
  // Devolver con guión (formato estándar para BD)
  return `${rutNumber}-${verifierDigit}`;
};

/**
 * Valida RUT en tiempo real durante la escritura
 * @param {string} rut - RUT parcial o completo
 * @returns {object} Estado de validación con mensaje
 */
export const validateRutInput = (rut) => {
  if (!rut || rut.length === 0) {
    return { isValid: false, message: '', canContinue: true };
  }
  
  const cleanedRut = cleanRut(rut);
  
  // Muy corto
  if (cleanedRut.length < 8) {
    return { 
      isValid: false, 
      message: 'RUT incompleto (mínimo 8 caracteres)', 
      canContinue: true 
    };
  }
  
  // Muy largo
  if (cleanedRut.length > 10) {
    return { 
      isValid: false, 
      message: 'RUT demasiado largo (máximo 10 caracteres)', 
      canContinue: false 
    };
  }
  
  // Formato inválido (parte numérica)
  const rutNumber = cleanedRut.slice(0, -1);
  if (isNaN(rutNumber)) {
    return { 
      isValid: false, 
      message: 'RUT contiene caracteres inválidos', 
      canContinue: false 
    };
  }
  
  // Validación completa
  const isCompletelyValid = validateRut(cleanedRut);
  
  return {
    isValid: isCompletelyValid,
    message: isCompletelyValid ? 'RUT válido' : 'Dígito verificador incorrecto',
    canContinue: true
  };
};

/**
 * Genera ejemplos de RUT válidos para testing
 * @returns {string[]} Array de RUTs válidos formateados
 */
export const getValidRutExamples = () => {
  const examples = [
    '11111111-1',
    '22222222-2', 
    '12345678-5',
    '98765432-1',
    '18765432-7'
  ];
  
  return examples.filter(rut => validateRut(rut));
};

// Exportación por defecto con todas las funciones
export default {
  cleanRut,
  calculateVerifierDigit,
  validateRut,
  formatRut,
  normalizeRut,
  validateRutInput,
  getValidRutExamples
};
