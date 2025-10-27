# 🚀 ORDEN DE EJECUCIÓN DE SCRIPTS SQL

## 📋 Para el Sistema de Programación de Turnos (Nuevo)

### ✅ **ORDEN CORRECTO** (3 scripts en total)

---

## 1️⃣ **PRIMERO**: `crear_turnos_v2.sql`

**Propósito**: Crea las tablas base del sistema  
**Tiempo**: ~5 segundos  
**Crea**:
- ✅ Tabla `turnos_v2` (plantillas de turnos)
- ✅ Tabla `configuracion_pagos` (ya no se usa, pero no molesta)
- ✅ ~50 plantillas de turnos para **Temporada Baja - Horario Invierno**
- ✅ Índices, triggers, RLS policies

**Ejecución**:
```bash
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Copiar todo el contenido de: sql/crear_turnos_v2.sql
4. Ejecutar (botón Run o F5)
5. Verificar: ✅ Success
```

**Verificación**:
```sql
SELECT COUNT(*) FROM turnos_v2;
-- Debería retornar: ~50 registros
```

---

## 2️⃣ **SEGUNDO**: `plantillas_turnos_completas.sql`

**Propósito**: Agrega las plantillas de los otros 3 escenarios  
**Tiempo**: ~5 segundos  
**Crea**:
- ✅ ~50 plantillas para **Temporada Baja - Horario Verano**
- ✅ ~70 plantillas para **Temporada Alta - Horario Invierno**
- ✅ ~80 plantillas para **Temporada Alta - Horario Verano**

**Ejecución**:
```bash
1. En el mismo SQL Editor de Supabase
2. Copiar todo el contenido de: sql/plantillas_turnos_completas.sql
3. Ejecutar (botón Run o F5)
4. Verificar: ✅ Success
```

**Verificación**:
```sql
SELECT COUNT(*) FROM turnos_v2;
-- Debería retornar: ~250 registros (50 + 200 nuevos)
```

---

## 3️⃣ **TERCERO**: `agregar_tarifa_persona.sql` ⭐ **NUEVO**

**Propósito**: Agrega el sistema de tarifa por hora  
**Tiempo**: ~3 segundos  
**Modifica**:
- ✅ Agrega columna `tarifa_hora` a tabla `personas`
- ✅ Crea función `calcular_horas_turno()`
- ✅ Crea vista `vista_turnos_v2_con_pago`
- ✅ Crea función `obtener_estadisticas_mes()`

**Ejecución**:
```bash
1. En el mismo SQL Editor de Supabase
2. Copiar todo el contenido de: sql/agregar_tarifa_persona.sql
3. Ejecutar (botón Run o F5)
4. Verificar: ✅ Success
```

**Verificación**:
```sql
SELECT nombre, tipo, tarifa_hora 
FROM personas 
ORDER BY tarifa_hora DESC;

-- Debería mostrar todas las personas con tarifa_hora = 5000 (default)
```

---

## 📊 RESUMEN DEL ORDEN

```
┌─────────────────────────────────────────────────┐
│  ORDEN DE EJECUCIÓN                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  1️⃣  crear_turnos_v2.sql                        │
│      ↓ (Crea tablas + 50 plantillas)           │
│                                                 │
│  2️⃣  plantillas_turnos_completas.sql            │
│      ↓ (Agrega 200 plantillas más)             │
│                                                 │
│  3️⃣  agregar_tarifa_persona.sql                 │
│      ↓ (Agrega sistema de tarifa/hora)         │
│                                                 │
│  ✅  SISTEMA COMPLETO LISTO                     │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ **IMPORTANTE: ¿Ya ejecutaste los primeros 2?**

### Si **NO** has ejecutado ninguno:
```bash
✅ Ejecuta en este orden:
   1. crear_turnos_v2.sql
   2. plantillas_turnos_completas.sql
   3. agregar_tarifa_persona.sql
```

### Si **YA** ejecutaste los primeros 2:
```bash
✅ Solo ejecuta:
   3. agregar_tarifa_persona.sql
```

### Si **NO ESTÁS SEGURO**:
```sql
-- Ejecuta esta query para verificar:
SELECT COUNT(*) FROM turnos_v2;

-- Resultados:
-- 0 registros    → No has ejecutado nada, empieza con script 1
-- ~50 registros  → Ejecutaste script 1, continúa con script 2
-- ~250 registros → Ejecutaste scripts 1 y 2, ejecuta script 3
```

---

## ✅ VERIFICACIÓN COMPLETA

Después de ejecutar LOS 3 SCRIPTS, verifica:

### 1. Turnos V2 creados
```sql
SELECT COUNT(*) FROM turnos_v2;
-- Resultado esperado: ~250 registros
```

### 2. Campo tarifa_hora existe
```sql
SELECT nombre, tarifa_hora FROM personas LIMIT 5;
-- Resultado esperado: Muestra nombres con tarifa_hora = 5000
```

### 3. Funciones creadas
```sql
SELECT calcular_horas_turno('09:00'::TIME, '18:00'::TIME);
-- Resultado esperado: 9.00
```

### 4. Vista creada
```sql
SELECT COUNT(*) FROM vista_turnos_v2_con_pago;
-- Resultado esperado: ~250 registros
```

---

## 🎯 SIGUIENTE PASO

Una vez ejecutados los 3 scripts:

```bash
1. Refrescar tu navegador (F5)
2. Ir a: http://localhost:5173/programacion-turnos
3. Seleccionar: Temporada Baja, Horario Invierno
4. Ver calendario con turnos disponibles
5. Asignar una persona a un turno
6. Ver dashboard con monto calculado
```

---

## 🔧 TROUBLESHOOTING

### Error: "relation turnos_v2 does not exist"
**Solución**: No ejecutaste el script 1 (`crear_turnos_v2.sql`)  
**Acción**: Ejecuta primero el script 1

### Error: "column tarifa_hora does not exist"
**Solución**: No ejecutaste el script 3 (`agregar_tarifa_persona.sql`)  
**Acción**: Ejecuta el script 3

### Error: "duplicate key value violates unique constraint"
**Solución**: Ya ejecutaste el script antes  
**Acción**: Está bien, ignora el error (ON CONFLICT DO NOTHING)

### Ver solo 50 turnos en lugar de 250
**Solución**: No ejecutaste el script 2 (`plantillas_turnos_completas.sql`)  
**Acción**: Ejecuta el script 2

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Los scripts son IDEMPOTENTES
Puedes ejecutarlos múltiples veces sin problemas:
- `IF NOT EXISTS` previene errores de duplicación
- `ON CONFLICT DO NOTHING` ignora inserts duplicados
- `CREATE OR REPLACE` actualiza funciones/vistas

### ⚠️ No importa el orden si algo falla
Si un script falla a la mitad:
1. Lee el mensaje de error
2. Corrige si es necesario
3. Vuelve a ejecutar el mismo script
4. Continúa con el siguiente

### ⚠️ Tabla configuracion_pagos ya no se usa
Después del script 3, el sistema usa `personas.tarifa_hora` directamente.
La tabla `configuracion_pagos` queda ahí pero no se consulta.

---

## 🚀 RESUMEN EJECUTIVO

```
ORDEN:
1️⃣ crear_turnos_v2.sql            → Crea sistema base
2️⃣ plantillas_turnos_completas.sql → Completa plantillas
3️⃣ agregar_tarifa_persona.sql      → Agrega tarifa/hora

TIEMPO TOTAL: ~15 segundos

RESULTADO: Sistema de programación de turnos con 
          tarifa por hora completamente funcional
```

---

**¿Ya ejecutaste alguno? Ejecuta los que falten en orden y ¡listo! 🌊**
