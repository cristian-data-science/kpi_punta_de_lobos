# 🌊 Sistema de Programación de Turnos V2 - Punta de Lobos

## 🎉 ¡Implementación Completa!

Este documento es tu punto de partida para usar el nuevo sistema de programación de turnos.

---

## 📖 Tabla de Contenidos

1. [¿Qué es este sistema?](#qué-es-este-sistema)
2. [Instalación Rápida](#instalación-rápida)
3. [Documentación](#documentación)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Acceso Rápido](#acceso-rápido)

---

## 🎯 ¿Qué es este sistema?

Un sistema completo para **programar turnos mensuales** de guardaparques en Punta de Lobos.

### Características principales:

✅ **4 Escenarios predefinidos**
- Temporada Baja - Horario Invierno
- Temporada Baja - Horario Verano  
- Temporada Alta - Horario Invierno
- Temporada Alta - Horario Verano

✅ **250+ Plantillas de turnos** listas para usar

✅ **Asignación visual** con calendario semanal

✅ **Dashboard de estadísticas** en tiempo real:
- Cantidad de turnos por persona
- Días de semana vs fin de semana
- Horas totales trabajadas
- Cálculo automático de pagos

✅ **Sistema de tarifas** configurable

---

## ⚡ Instalación Rápida

### Paso 1: Base de Datos (5 minutos)

1. Abre **Supabase Dashboard** → SQL Editor

2. Ejecuta el primer script:
   ```
   sql/crear_turnos_v2.sql
   ```
   
3. Ejecuta el segundo script:
   ```
   sql/plantillas_turnos_completas.sql
   ```

4. Verifica instalación:
   ```sql
   SELECT COUNT(*) FROM turnos_v2;
   -- Debe mostrar ~250
   ```

### Paso 2: Frontend (Ya está listo)

El código frontend ya está integrado:
- ✅ Servicios Supabase creados
- ✅ Página de programación implementada
- ✅ Rutas configuradas
- ✅ Menú actualizado

Solo necesitas **refrescar tu navegador**.

### Paso 3: Acceder

Navega a:
```
http://localhost:5173/programacion-turnos
```

---

## 📚 Documentación

### 📄 Archivos de Documentación

| Archivo | Propósito | Cuándo Leer |
|---------|-----------|-------------|
| **INSTRUCCIONES_PROGRAMACION_TURNOS.md** | Guía paso a paso de instalación | Al instalar por primera vez |
| **RESUMEN_SISTEMA_PROGRAMACION.md** | Documentación técnica completa | Para entender la arquitectura |
| **MATRIZ_ESCENARIOS_TURNOS.md** | Comparativa visual de los 4 escenarios | Para entender diferencias de horarios |
| **FAQ_PROGRAMACION_TURNOS.md** | Preguntas frecuentes y troubleshooting | Cuando tengas dudas o problemas |
| **README_PROGRAMACION_TURNOS.md** | Este archivo - Punto de entrada | Empieza aquí |

### 🎓 Orden de Lectura Sugerido

**Para instaladores/administradores:**
1. Este README (5 min)
2. INSTRUCCIONES_PROGRAMACION_TURNOS.md (10 min)
3. FAQ_PROGRAMACION_TURNOS.md (referencia cuando necesites)

**Para usuarios finales:**
1. MATRIZ_ESCENARIOS_TURNOS.md (15 min) - Entender los turnos
2. Sección "Uso del Sistema" en INSTRUCCIONES_PROGRAMACION_TURNOS.md (10 min)

**Para desarrolladores:**
1. RESUMEN_SISTEMA_PROGRAMACION.md (20 min) - Arquitectura completa
2. Comentarios en código fuente

---

## 📁 Estructura de Archivos

### Archivos SQL (carpeta `sql/`)
```
sql/
├── crear_turnos_v2.sql              ← Script principal (ejecutar primero)
└── plantillas_turnos_completas.sql  ← Plantillas adicionales (ejecutar segundo)
```

### Archivos JavaScript (carpeta `src/`)
```
src/
├── services/
│   └── turnosV2Helpers.js           ← Servicios Supabase para turnos_v2
├── pages/
│   └── ProgramacionTurnos.jsx       ← Página principal (522 líneas)
├── App.jsx                          ← Ruta /programacion-turnos añadida
└── components/
    └── Sidebar.jsx                  ← Nuevo ítem "Programación" en menú
```

### Archivos de Documentación (carpeta raíz)
```
/
├── README_PROGRAMACION_TURNOS.md              ← Este archivo
├── INSTRUCCIONES_PROGRAMACION_TURNOS.md       ← Guía de instalación
├── RESUMEN_SISTEMA_PROGRAMACION.md            ← Documentación técnica
├── MATRIZ_ESCENARIOS_TURNOS.md                ← Comparativa de escenarios
└── FAQ_PROGRAMACION_TURNOS.md                 ← Preguntas frecuentes
```

---

## 🚀 Acceso Rápido

### URLs del Sistema

```
Dashboard Principal:       http://localhost:5173/
Programación de Turnos:   http://localhost:5173/programacion-turnos
Personas:                  http://localhost:5173/personas
Turnos (Original):         http://localhost:5173/turnos
```

### Scripts SQL en Supabase

**Dashboard**: https://supabase.com/dashboard
**SQL Editor**: Dashboard → SQL Editor → New query

### Consultas Útiles

```sql
-- Ver todas las plantillas
SELECT codigo_turno, temporada, horario, COUNT(*) 
FROM turnos_v2 
GROUP BY codigo_turno, temporada, horario
ORDER BY temporada, horario, codigo_turno;

-- Ver turnos asignados del mes actual
SELECT * FROM turnos_v2 
WHERE mes_asignacion = EXTRACT(MONTH FROM CURRENT_DATE)
AND anio_asignacion = EXTRACT(YEAR FROM CURRENT_DATE);

-- Ver configuración de pagos actual
SELECT * FROM configuracion_pagos WHERE es_actual = true;

-- Estadísticas rápidas
SELECT 
  estado, 
  COUNT(*) as cantidad 
FROM turnos_v2 
GROUP BY estado;
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Programar el próximo mes

1. Ve a `/programacion-turnos`
2. Selecciona mes próximo en filtros
3. Elige escenario (temporada + horario)
4. Haz clic en cada turno del calendario
5. Asigna personas
6. Verifica dashboard de estadísticas

**Tiempo estimado**: 20-30 minutos para un mes completo

### Caso 2: Consultar cuánto gana una persona

1. Ve a `/programacion-turnos`
2. Selecciona mes y año
3. Busca la persona en la tabla de estadísticas (parte inferior)
4. Columna "Monto a Pagar" muestra el total

### Caso 3: Cambiar tarifas

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta:
   ```sql
   UPDATE configuracion_pagos 
   SET 
     tarifa_dia_semana = 35000,
     tarifa_sabado = 45000,
     tarifa_domingo = 55000
   WHERE es_actual = true;
   ```
3. Refresca la página de programación
4. Los montos se recalculan automáticamente

---

## 🔧 Troubleshooting Rápido

### ❌ "No se cargan turnos"
→ Verifica que ejecutaste ambos scripts SQL

### ❌ "No aparecen personas"
→ Verifica que tienes personas con `estado = 'activo'` en tabla `personas`

### ❌ "Montos en $0"
→ Ejecuta de nuevo la sección de INSERT de `crear_turnos_v2.sql`

### ❌ "Calendario vacío"
→ Cambia de semana con los botones ◀ ▶ o verifica filtros de escenario

**Para más detalles**: Lee `FAQ_PROGRAMACION_TURNOS.md`

---

## 🎨 Vista Previa del Sistema

### Pantalla Principal
```
┌─────────────────────────────────────────────────────────┐
│ 📅 Programación de Turnos                [Hoy] [Refresh]│
├─────────────────────────────────────────────────────────┤
│ ⚙️ Configuración del Escenario                          │
│ [Temporada ▼] [Horario ▼] [Mes ▼] [Año ▼]              │
├─────────────────────────────────────────────────────────┤
│ Cards de Estadísticas:                                  │
│ [Turnos: 50] [Asignados: 25] [Disponibles: 25] [...]  │
├─────────────────────────────────────────────────────────┤
│ 📋 Calendario Semanal (WeeklySchedule)                  │
│ (Clic en turno para asignar)                            │
├─────────────────────────────────────────────────────────┤
│ 📈 Dashboard de Estadísticas por Persona               │
│ Tabla con: Turnos, Días, Sábados, Domingos, Monto      │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Datos del Sistema

### Tablas Creadas

1. **`turnos_v2`** (Principal)
   - ~250 plantillas de turnos
   - Campos: codigo_turno, temporada, horario, dia_semana, etc.
   - Asignaciones vía `persona_id`

2. **`configuracion_pagos`** (Tarifas)
   - Tarifas por tipo de día
   - Multiplicadores por guardia
   - Configurable sin código

### Escenarios Disponibles

| Escenario | Plantillas | Complejidad |
|-----------|------------|-------------|
| Baja - Invierno | ~50 | ⭐⭐ Básico |
| Baja - Verano | ~50 | ⭐⭐ Básico |
| Alta - Invierno | ~70 | ⭐⭐⭐ Medio |
| Alta - Verano | ~80 | ⭐⭐⭐⭐ Complejo |

---

## 🎓 Próximos Pasos

### Después de Instalar:

1. ✅ Familiarízate con la interfaz (5 min)
2. ✅ Prueba asignar una persona a un turno (2 min)
3. ✅ Revisa el dashboard de estadísticas (3 min)
4. ✅ Lee MATRIZ_ESCENARIOS_TURNOS.md para entender diferencias (10 min)
5. ✅ Programa tu primer mes real (20-30 min)

### Mejoras Futuras Sugeridas:

- [ ] Botón "Copiar mes anterior"
- [ ] Exportar dashboard a Excel
- [ ] Validación de conflictos de horarios
- [ ] Vista mensual completa (no solo semanal)
- [ ] Gestión de días festivos
- [ ] Notificaciones de turnos sin asignar
- [ ] Sistema de roles y permisos

---

## 🆘 Necesitas Ayuda?

1. **Primero**: Lee `FAQ_PROGRAMACION_TURNOS.md`
2. **Luego**: Revisa la consola del navegador (F12) para errores
3. **Verifica**: Que los scripts SQL se ejecutaron correctamente
4. **Consulta**: Comentarios en el código fuente

---

## 📝 Notas Importantes

- ⚠️ Este sistema es **independiente** de la tabla `turnos` original
- ⚠️ Los turnos asignados aquí son para **programación mensual**, no registros diarios
- ⚠️ Las tarifas se calculan **en tiempo real**, no se guardan por turno
- ⚠️ Cambiar escenario en medio del mes requiere **re-asignar todo**

---

## ✅ Checklist de Instalación

```
□ Scripts SQL ejecutados (crear_turnos_v2.sql)
□ Plantillas adicionales ejecutadas (plantillas_turnos_completas.sql)
□ Verificado que hay ~250 registros en turnos_v2
□ Verificado que existe configuracion_pagos con datos
□ Navegador refrescado
□ Accedido a /programacion-turnos
□ Leído INSTRUCCIONES_PROGRAMACION_TURNOS.md
□ Primer turno asignado exitosamente
```

---

## 🎉 ¡Listo para Usar!

El sistema está **100% funcional** y listo para programar turnos mensuales.

**Siguiente paso**: Abre http://localhost:5173/programacion-turnos y comienza a asignar personas.

---

## 📞 Información del Proyecto

- **Proyecto**: Punta de Lobos - Sistema de Gestión de Personas
- **Módulo**: Programación de Turnos V2
- **Versión**: 1.0.0
- **Fecha**: Octubre 2025
- **Estado**: ✅ Producción

---

**Desarrollado con ❤️ para Punta de Lobos** 🌊

---

## 🔗 Enlaces Rápidos

- 📄 [Instrucciones de Instalación](./INSTRUCCIONES_PROGRAMACION_TURNOS.md)
- 📘 [Documentación Técnica Completa](./RESUMEN_SISTEMA_PROGRAMACION.md)
- 📊 [Matriz de Escenarios](./MATRIZ_ESCENARIOS_TURNOS.md)
- ❓ [Preguntas Frecuentes](./FAQ_PROGRAMACION_TURNOS.md)
- 💾 [Script SQL Principal](./sql/crear_turnos_v2.sql)
- 💾 [Plantillas Completas](./sql/plantillas_turnos_completas.sql)

---

**¿Todo claro?** ¡Perfecto! Ahora ve a programar tus primeros turnos. 🚀
