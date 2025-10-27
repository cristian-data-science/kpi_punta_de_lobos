# 🎯 Issue #1: Eliminar Valores de Demostración y Mostrar Datos 100% Reales en Dashboard

**Estado:** 🔴 Abierto  
**Prioridad:** 🔴 CRÍTICA  
**Tipo:** 🐛 Bug / 🔧 Refactor  
**Módulo:** `Dashboard.jsx`  
**Fecha creación:** 27 de octubre de 2025  
**Tiempo estimado:** 2-3 horas

---

## 📋 Descripción del Problema

El **Dashboard principal** (`src/pages/Dashboard.jsx`) actualmente calcula y muestra TODOS los datos en tiempo real desde Supabase. Sin embargo, existen dos problemas críticos que necesitan ser revisados y corregidos antes de la entrega a la fundación:

### 🚨 Problemas Identificados

1. **Valores hardcodeados o por defecto:**
   - Tarifa estándar hardcodeada: `8000` (línea ~168)
   - Puede haber otros valores por defecto que no reflejan la realidad operativa

2. **Cálculos de demostración o temporales:**
   - Revisar que TODAS las estadísticas se calculen desde datos reales de Supabase
   - No debe haber datos mock, fake, o de prueba
   - Todos los KPIs deben reflejar el estado actual del sistema

3. **Posibles inconsistencias:**
   - Verificar que los filtros de fecha funcionen correctamente
   - Asegurar que los cálculos de horas trabajadas sean precisos
   - Confirmar que las tarifas por persona se obtengan correctamente de la BD

---

## 🎯 Objetivos

### ✅ Objetivo Principal
**Garantizar que el Dashboard muestre ÚNICAMENTE datos 100% reales y actualizados desde la base de datos de Supabase**, eliminando cualquier valor hardcodeado, de demostración o temporal que no refleje la operación real del sistema.

### 🎯 Objetivos Específicos

1. **Auditar cálculos de estadísticas:**
   - Revisar línea por línea los cálculos de KPIs
   - Verificar que todas las queries a Supabase sean correctas
   - Confirmar que no hay valores fake/mock/demo/test

2. **Eliminar valores hardcodeados:**
   - Reemplazar `8000` (tarifa estándar) por valor desde configuración o BD
   - Eliminar cualquier otro valor fijo que deba ser dinámico

3. **Validar cálculos de montos:**
   - Asegurar que `montosAPagar` se calculen con tarifas reales de cada persona
   - Verificar que el cálculo de horas trabajadas sea preciso (considerar almuerzo, pausas, etc.)

4. **Revisar filtros temporales:**
   - Confirmar que "Hoy", "Esta Semana", "Este Mes" funcionen correctamente
   - Validar funciones: `getStartOfWeek`, `getEndOfWeek`, `getStartOfMonth`, `getEndOfMonth`

5. **Testing de precisión:**
   - Comparar datos del Dashboard con consultas directas a Supabase
   - Verificar con casos reales de la fundación

---

## 🔍 Código Actual a Revisar

### 📍 Archivo: `src/pages/Dashboard.jsx`

#### Sección Crítica #1: Cálculo de Montos (Líneas ~164-169)
```javascript
// 🚨 REVISAR: Tarifa hardcodeada en 8000
// Obtener tarifa por persona si existe, sino usar estándar
const tarifaPorHora = persona.tarifa_hora || 8000 // ⚠️ Tarifa estándar
const horaInicio = turno.hora_inicio ? parseInt(turno.hora_inicio.split(':')[0]) : 9
const horaFin = turno.hora_fin ? parseInt(turno.hora_fin.split(':')[0]) : 17
const horasTrabajadas = horaFin - horaInicio

const montoTurno = horasTrabajadas * tarifaPorHora
```

**Preguntas a responder:**
- ❓ ¿El valor `8000` es correcto como tarifa estándar?
- ❓ ¿Debería venir de una tabla de configuración en Supabase?
- ❓ ¿Qué pasa si `persona.tarifa_hora` es `0` o `null`?
- ❓ ¿El cálculo de horas considera hora de almuerzo correctamente?

#### Sección Crítica #2: Estadísticas Generales (Líneas ~54-150)
```javascript
// Obtener estadísticas generales
const estadisticas = await getEstadisticas()

// ⚠️ VERIFICAR: ¿Se están usando estas estadísticas o son redundantes?
// ⚠️ Actualmente parece que NO se usan y se calculan desde cero
```

**Preguntas a responder:**
- ❓ ¿La función `getEstadisticas()` devuelve datos reales o es placeholder?
- ❓ ¿Por qué se llama si no se usa en el código posterior?
- ❓ ¿Debería eliminarse o usarse para optimizar?

#### Sección Crítica #3: Filtros de Fecha (Líneas ~226-250)
```javascript
const getStartOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lunes como inicio
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}
```

**Preguntas a responder:**
- ❓ ¿La semana comienza en Lunes (correcto para Chile)?
- ❓ ¿Se manejan correctamente las zonas horarias?
- ❓ ¿Qué pasa con turnos cerca de medianoche?

---

## 🛠️ Solución Propuesta

### Paso 1: Auditoría Completa (30 min)
```bash
# Buscar posibles valores de demostración
grep -r "demo\|test\|fake\|mock\|dummy\|ejemplo\|prueba\|temporal" src/pages/Dashboard.jsx

# Buscar valores hardcodeados sospechosos
grep -r "8000\|9999\|1234\|TODO\|FIXME" src/pages/Dashboard.jsx
```

### Paso 2: Crear Configuración de Tarifas (45 min)
**Opción A:** Tabla de configuración en Supabase
```sql
-- Script a crear: sql/configuracion_tarifas.sql
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50), -- 'numero', 'texto', 'json'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo)
VALUES ('tarifa_hora_estandar', '8000', 'Tarifa por hora estándar cuando persona no tiene tarifa asignada', 'numero');
```

**Opción B:** Archivo de configuración
```javascript
// src/config/tarifasConfig.js
export const TARIFA_CONFIG = {
  TARIFA_HORA_ESTANDAR: import.meta.env.VITE_TARIFA_ESTANDAR || 8000,
  CALCULAR_ALMUERZO: true,
  HORAS_ALMUERZO: 1
}
```

### Paso 3: Refactorizar Cálculos (60 min)
```javascript
// Ejemplo de mejora
import { TARIFA_CONFIG } from '@/config/tarifasConfig'

// Calcular horas trabajadas CORRECTAMENTE (considerando almuerzo)
const calcularHorasTrabajadas = (horaInicio, horaFin, incluirAlmuerzo = true) => {
  const inicio = new Date(`2000-01-01T${horaInicio}`)
  const fin = new Date(`2000-01-01T${horaFin}`)
  let horas = (fin - inicio) / (1000 * 60 * 60)
  
  // Si el turno es mayor a 6 horas, restar hora de almuerzo
  if (incluirAlmuerzo && horas > 6) {
    horas -= TARIFA_CONFIG.HORAS_ALMUERZO
  }
  
  return horas > 0 ? horas : 0
}

// Usar tarifa real de persona o estándar
const tarifaPorHora = persona.tarifa_hora || TARIFA_CONFIG.TARIFA_HORA_ESTANDAR
const horasTrabajadas = calcularHorasTrabajadas(turno.hora_inicio, turno.hora_fin)
const montoTurno = horasTrabajadas * tarifaPorHora
```

### Paso 4: Testing y Validación (30 min)
```javascript
// Crear tests manuales
// 1. Crear persona con tarifa_hora = 10000
// 2. Crear turno de 09:00 a 18:00 (9h - 1h almuerzo = 8h)
// 3. Verificar Dashboard muestra: 8h * 10000 = $80,000
// 4. Verificar que persona sin tarifa usa estándar (8000)
```

---

## ✅ Criterios de Aceptación

Para considerar este issue **COMPLETADO**, se deben cumplir TODOS los siguientes criterios:

- [ ] **✅ Código auditado:** Revisión línea por línea del Dashboard completada
- [ ] **✅ Valores hardcodeados eliminados:** Todos los valores fijos movidos a configuración
- [ ] **✅ Cálculos validados:** Comparación Dashboard vs queries directas a Supabase coinciden 100%
- [ ] **✅ Tarifas correctas:** Sistema usa `tarifa_hora` de tabla `personas` correctamente
- [ ] **✅ Tarifa estándar configurable:** Valor por defecto viene de configuración (env o tabla)
- [ ] **✅ Horas precisas:** Cálculo de horas considera almuerzo y pausas correctamente
- [ ] **✅ Fechas correctas:** Filtros "Hoy", "Esta Semana", "Este Mes" funcionan correctamente
- [ ] **✅ Sin datos fake:** Confirmado que NO hay valores de demo/test/mock
- [ ] **✅ Testing realizado:** Al menos 3 casos reales probados y validados
- [ ] **✅ Documentación actualizada:** Comentarios claros en código explicando cálculos

---

## 📊 Impacto

### 🎯 Para la Fundación
- ✅ **Confianza:** Dashboard muestra datos reales y precisos
- ✅ **Decisiones:** Métricas confiables para toma de decisiones
- ✅ **Transparencia:** Cálculos de pagos son verificables

### 🎯 Para el Proyecto
- ✅ **Credibilidad:** Sistema profesional listo para producción
- ✅ **Mantenibilidad:** Código limpio sin valores mágicos
- ✅ **Escalabilidad:** Configuración centralizada fácil de modificar

---

## 🔗 Archivos Relacionados

### Archivos a Modificar
- `src/pages/Dashboard.jsx` (archivo principal)
- `src/services/supabaseHelpers.js` (si se optimizan queries)
- `src/config/tarifasConfig.js` (crear nuevo)

### Archivos a Crear
- `sql/configuracion_tarifas.sql` (opcional, si se usa tabla de config)
- `docs/development/CALCULO_TARIFAS_DASHBOARD.md` (documentar lógica)

### Archivos a Revisar
- `.env.example` (agregar `VITE_TARIFA_ESTANDAR` si se usa)
- `README.md` (actualizar sección de configuración)

---

## 🚧 Notas Técnicas

### ⚠️ Consideraciones Importantes

1. **Zona Horaria:**
   - Chile usa UTC-3 (UTC-4 en horario de verano)
   - Verificar que `new Date().toISOString()` no cause desfases

2. **Rendimiento:**
   - Dashboard hace múltiples queries a Supabase
   - Considerar optimización con queries combinadas o caché

3. **Datos Históricos:**
   - ¿Qué pasa si se cambia la tarifa de una persona?
   - ¿Los turnos antiguos mantienen la tarifa de ese momento?

4. **Casos Edge:**
   - Turnos que cruzan medianoche (ej: 23:00 - 02:00)
   - Personas sin tarifa asignada
   - Turnos sin hora_inicio o hora_fin

---

## 🏷️ Labels Sugeridos
- `priority: critical`
- `type: bug`
- `type: refactor`
- `module: dashboard`
- `needs: review`
- `milestone: entrega-fundacion`

---

## 👥 Asignación
- **Responsable:** [Por asignar]
- **Revisor:** [Por asignar]
- **Fundación contacto:** [Persona de la fundación para validar cálculos]

---

## 📅 Historial

| Fecha | Acción | Responsable | Comentario |
|-------|--------|-------------|------------|
| 2025-10-27 | Issue creado | Sistema | Issue #1 creado desde análisis pre-entrega |

---

## 💬 Comentarios Adicionales

**Contexto de Creación:**
Este issue fue creado como parte de la preparación para la entrega del proyecto a la fundación Punta de Lobos. Es CRÍTICO para asegurar que el sistema muestre información confiable y precisa desde el primer día de uso.

**Prioridad de Entrega:**
Este es uno de los 5 issues críticos que deben resolverse antes de la entrega oficial. Se recomienda abordar en el siguiente orden:
1. Issue #3 (Seguridad)
2. **Issue #1 (Dashboard - ESTE)** ⬅️ SEGUNDO EN PRIORIDAD
3. Issue #4 (Testing)
4. Issue #5 (Despliegue)
5. Issue #2 (Documentación)

---

**Última actualización:** 27 de octubre de 2025
