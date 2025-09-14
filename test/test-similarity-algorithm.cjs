#!/usr/bin/env node

/**
 * Script para probar el algoritmo mejorado de similitud semántica
 */

// Función de normalización (copiada de UploadFiles.jsx)
const normalizeName = (name) => {
  if (!name) return ''
  return name
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/Ñ/g, 'N')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Algoritmo mejorado de similitud (copiado de UploadFiles.jsx)
const calculateNameSimilarity = (name1, name2) => {
  if (!name1 || !name2) return 0
  
  const normalized1 = normalizeName(name1)
  const normalized2 = normalizeName(name2)
  
  console.log(`\n🔍 Comparando:`)
  console.log(`   Nombre 1: "${name1}" → "${normalized1}"`)
  console.log(`   Nombre 2: "${name2}" → "${normalized2}"`)
  
  // Verificar coincidencia exacta
  if (normalized1 === normalized2) return 1.0
  
  // Verificar si uno contiene al otro completamente
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9
  
  // Separar palabras y filtrar palabras muy cortas (< 3 caracteres)
  const words1 = normalized1.split(/\s+/).filter(w => w.length >= 2)
  const words2 = normalized2.split(/\s+/).filter(w => w.length >= 2)
  
  console.log(`   Palabras 1: [${words1.join(', ')}]`)
  console.log(`   Palabras 2: [${words2.join(', ')}]`)
  
  // Algoritmo mejorado de coincidencia de palabras
  let matchingWords = 0
  let exactMatches = 0
  let partialMatches = 0
  
  words1.forEach(word1 => {
    let bestMatchForWord = 0
    let matchDetails = []
    
    words2.forEach(word2 => {
      if (word1 === word2) {
        // Coincidencia exacta
        exactMatches++
        bestMatchForWord = Math.max(bestMatchForWord, 1.0)
        matchDetails.push(`EXACTA vs "${word2}" = 1.0`)
      } else if (word1.length >= 4 && word2.length >= 4) {
        // Para palabras largas, verificar similitud parcial mejorada
        if (word1.includes(word2) || word2.includes(word1)) {
          partialMatches += 0.8
          bestMatchForWord = Math.max(bestMatchForWord, 0.8)
          matchDetails.push(`INCLUSIÓN vs "${word2}" = 0.8`)
        } else {
          // Similitud por caracteres comunes en palabras largas
          const commonChars = [...word1].filter(char => word2.includes(char)).length
          const similarity = commonChars / Math.max(word1.length, word2.length)
          if (similarity >= 0.6) { // 60% de similitud mínima
            partialMatches += similarity * 0.6
            bestMatchForWord = Math.max(bestMatchForWord, similarity * 0.6)
            matchDetails.push(`CARACTERES vs "${word2}" = ${(similarity * 0.6).toFixed(2)}`)
          }
        }
      } else if (word1.length >= 3 && word2.length >= 3) {
        // Para palabras medianas, verificar inclusión o similitud alta
        if (word1.includes(word2) || word2.includes(word1)) {
          partialMatches += 0.7
          bestMatchForWord = Math.max(bestMatchForWord, 0.7)
          matchDetails.push(`INCLUSIÓN MEDIA vs "${word2}" = 0.7`)
        }
      }
    })
    
    if (bestMatchForWord > 0) {
      matchingWords += bestMatchForWord
      console.log(`     "${word1}": ${matchDetails.join(', ')} → ${bestMatchForWord.toFixed(2)}`)
    } else {
      console.log(`     "${word1}": Sin coincidencias`)
    }
  })
  
  // Calcular score de palabras mejorado
  const minWords = Math.min(words1.length, words2.length)
  const maxWords = Math.max(words1.length, words2.length)
  
  let wordSimilarity = 0
  if (maxWords > 0) {
    // Dar más peso a coincidencias exactas
    const weightedScore = (exactMatches * 1.0) + partialMatches
    wordSimilarity = weightedScore / maxWords
    
    // Bonificación si hay coincidencias en nombres cortos
    if (minWords <= 2 && exactMatches >= 1) {
      wordSimilarity = Math.min(wordSimilarity + 0.2, 1.0)
      console.log(`   🎯 Bonus por nombre corto: +0.2`)
    }
  }
  
  // Calcular similitud por caracteres comunes (mejorada)
  const commonChars = [...normalized1].filter(char => normalized2.includes(char)).length
  const maxLength = Math.max(normalized1.length, normalized2.length)
  const charSimilarity = maxLength > 0 ? commonChars / maxLength : 0
  
  // Verificar patrones específicos (primer nombre + apellido)
  const firstWord1 = words1[0] || ''
  const lastWord1 = words1[words1.length - 1] || ''
  const firstWord2 = words2[0] || ''
  const lastWord2 = words2[words2.length - 1] || ''
  
  let namePatternBonus = 0
  if (firstWord1 && firstWord2 && firstWord1 === firstWord2) {
    namePatternBonus += 0.3 // Bonus por primer nombre igual
    console.log(`   🎯 Bonus primer nombre igual: +0.3`)
    
    // Bonus adicional si también coincide algún apellido
    words1.slice(1).forEach(surname1 => {
      words2.slice(1).forEach(surname2 => {
        if (surname1 === surname2 || 
            (surname1.length >= 4 && surname2.length >= 4 && 
             (surname1.includes(surname2) || surname2.includes(surname1)))) {
          namePatternBonus += 0.2
          console.log(`   🎯 Bonus apellido coincidente: +0.2`)
        }
      })
    })
  }
  
  // Score final con ponderación mejorada
  let finalScore = (wordSimilarity * 0.8) + (charSimilarity * 0.2) + Math.min(namePatternBonus, 0.4)
  
  // Asegurar que no exceda 1.0
  finalScore = Math.min(finalScore, 1.0)
  
  console.log(`   📊 Coincidencias exactas: ${exactMatches}`)
  console.log(`   📊 Coincidencias parciales: ${partialMatches.toFixed(2)}`)
  console.log(`   📊 Score palabras: ${wordSimilarity.toFixed(2)}`)
  console.log(`   📊 Score caracteres: ${charSimilarity.toFixed(2)}`)
  console.log(`   📊 Bonus nombres: ${namePatternBonus.toFixed(2)}`)
  console.log(`   🎯 SCORE FINAL: ${finalScore.toFixed(2)} (${Math.round(finalScore * 100)}%)`)
  
  return Math.round(finalScore * 100) / 100 // Redondear a 2 decimales
}

// Casos de prueba
console.log('🧪 Probando algoritmo mejorado de similitud semántica\n')

const testCases = [
  // Caso reportado por el usuario
  {
    archivo: 'WLADIMIR VALDEZ',
    oficial: 'WLADIMIR ROLANDO ISLER VALDÉS',
    esperado: '>= 40%'
  },
  
  // Casos adicionales para validar
  {
    archivo: 'JUAN CARLOS PEREZ',
    oficial: 'JUAN CARLOS PEREZ GONZALEZ',
    esperado: '>= 70%'
  },
  
  {
    archivo: 'MARIA JOSE',
    oficial: 'MARIA JOSE LOPEZ MARTINEZ',
    esperado: '>= 60%'
  },
  
  {
    archivo: 'PEDRO SANCHEZ',
    oficial: 'PEDRO IGNACIO SANCHEZ ROJAS',
    esperado: '>= 50%'
  },
  
  {
    archivo: 'RODRIGUEZ',
    oficial: 'CARLOS RODRIGUEZ SILVA',
    esperado: '>= 30%'
  },
  
  // Casos sin coincidencia
  {
    archivo: 'NOMBRE TOTALMENTE DIFERENTE',
    oficial: 'OTRO TRABAJADOR DISTINTO',
    esperado: '< 30%'
  }
]

testCases.forEach((testCase, index) => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📋 CASO ${index + 1}: ${testCase.esperado}`)
  console.log(`${'='.repeat(60)}`)
  
  const similarity = calculateNameSimilarity(testCase.archivo, testCase.oficial)
  const percentage = Math.round(similarity * 100)
  
  console.log(`\n🏆 RESULTADO: ${percentage}% de similitud`)
  
  // Evaluar si cumple expectativa
  let passed = false
  if (testCase.esperado.includes('>=')) {
    const threshold = parseInt(testCase.esperado.match(/\d+/)[0])
    passed = percentage >= threshold
  } else if (testCase.esperado.includes('<')) {
    const threshold = parseInt(testCase.esperado.match(/\d+/)[0])
    passed = percentage < threshold
  }
  
  console.log(`${passed ? '✅' : '❌'} ${passed ? 'PASÓ' : 'FALLÓ'} el test (esperado: ${testCase.esperado})`)
})

console.log(`\n${'='.repeat(60)}`)
console.log('🎉 Pruebas completadas')
console.log(`${'='.repeat(60)}`)
