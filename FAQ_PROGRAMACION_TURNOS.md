# ❓ FAQ - Sistema de Programación de Turnos

## Preguntas Frecuentes y Solución de Problemas

---

## 📚 Conceptos Básicos

### ¿Qué es una "plantilla de turno"?
Una plantilla de turno es un turno predefinido que se repite según un patrón. Por ejemplo, "GP1 - Martes 9-18h en Semana 1" es una plantilla. Cuando asignas una persona, estás vinculándola a esa plantilla para un mes específico.

### ¿Qué significa el "ciclo de 4 semanas"?
Los turnos se organizan en un ciclo que se repite cada 4 semanas. Cada guardia (GP1-GP4) tiene patrones diferentes según la semana del ciclo (1, 2, 3 o 4).

### ¿Cuál es la diferencia entre `turnos` y `turnos_v2`?
- **`turnos`**: Tabla original para turnos del día a día (registros reales completados)
- **`turnos_v2`**: Tabla nueva para plantillas asignables (programación mensual)

Son sistemas complementarios pero independientes.

---

## 🎯 Uso del Sistema

### ¿Cómo elijo qué escenario usar?

**Por Temporada**:
- **Baja**: Abril-Octubre (menos visitantes, turnos reducidos)
- **Alta**: Noviembre-Marzo (más visitantes, más cobertura)

**Por Horario**:
- **Invierno**: Mayo-Septiembre (horarios más cortos)
- **Verano**: Octubre-Abril (horarios extendidos, más tarde)

**Combinaciones recomendadas**:
```
Enero:      Alta - Verano      (máxima temporada)
Febrero:    Alta - Verano
Marzo:      Alta - Verano
Abril:      Baja - Invierno    (transición)
Mayo:       Baja - Invierno
Junio:      Baja - Invierno
Julio:      Baja - Invierno
Agosto:     Baja - Invierno
Septiembre: Baja - Invierno
Octubre:    Alta - Invierno    (pre-temporada)
Noviembre:  Alta - Verano      (inicio temporada)
Diciembre:  Alta - Verano
```

### ¿Puedo cambiar de escenario a mitad de mes?
No es recomendable. Los escenarios están diseñados para aplicarse a un mes completo. Si necesitas hacer cambios, es mejor:
1. Desasignar todos los turnos del mes
2. Cambiar el escenario
3. Re-asignar las personas

### ¿Qué pasa si asigno a alguien y luego cambio de persona?
El sistema permite cambiar la asignación en cualquier momento antes de que el turno pase a estado "completado". Simplemente:
1. Haz clic en el turno asignado
2. Selecciona la nueva persona
3. La asignación anterior se sobrescribe automáticamente

---

## 💰 Cálculos y Pagos

### ¿Cómo se calculan los montos?
Fórmula básica:
```
monto_turno = tarifa_base * multiplicador_guardia

Donde:
- tarifa_base:
  * Lun-Vie: $30.000
  * Sábado: $40.000
  * Domingo: $50.000

- multiplicador_guardia (configurables):
  * GP1: 1.0
  * GP2: 1.0
  * GP3: 1.0
  * GP4: 1.0
  * Voluntario: 0.5
```

### ¿Puedo cambiar las tarifas?
Sí, ejecutando en Supabase:
```sql
UPDATE configuracion_pagos 
SET 
  tarifa_dia_semana = 35000,
  tarifa_sabado = 45000,
  tarifa_domingo = 55000
WHERE es_actual = true;
```

### ¿Los cambios de tarifa afectan turnos ya asignados?
No. Los montos se calculan en tiempo real usando las tarifas actuales. Si quieres "congelar" un monto para un mes específico, necesitarás agregar un campo adicional `monto_fijo` en la tabla.

### ¿Por qué los sábados y domingos pagan más?
Es una configuración predeterminada que refleja que los fines de semana suelen tener mayor afluencia de visitantes y requieren mayor incentivo para el personal.

---

## 🔧 Problemas Técnicos

### ERROR: "No se pueden cargar turnos"

**Síntoma**: Página en blanco o mensaje de error al cargar turnos.

**Soluciones**:
1. Verifica que ejecutaste ambos scripts SQL:
   ```sql
   SELECT COUNT(*) FROM turnos_v2;  -- Debe ser ~250
   ```

2. Verifica la conexión a Supabase:
   - Revisa variables de entorno (`.env.local`)
   - Confirma que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configurados

3. Abre la consola del navegador (F12) y busca errores JavaScript

### ERROR: "No aparecen personas para asignar"

**Síntoma**: Modal de asignación se abre pero no muestra personas.

**Soluciones**:
1. Verifica que tienes personas en la BD:
   ```sql
   SELECT * FROM personas WHERE estado = 'activo';
   ```

2. Si no hay personas activas:
   ```sql
   INSERT INTO personas (nombre, rut, tipo, estado) VALUES
   ('Juan Pérez', '12345678-9', 'guia', 'activo');
   ```

3. Actualiza personas inactivas:
   ```sql
   UPDATE personas SET estado = 'activo' WHERE id = 'tu-uuid';
   ```

### ERROR: "Montos aparecen en $0"

**Síntoma**: Dashboard de estadísticas muestra $0 en todos los montos.

**Soluciones**:
1. Verifica configuración de pagos:
   ```sql
   SELECT * FROM configuracion_pagos WHERE es_actual = true;
   ```

2. Si está vacío, ejecuta de nuevo la sección de INSERT de `crear_turnos_v2.sql`:
   ```sql
   INSERT INTO configuracion_pagos (...) VALUES (...);
   ```

3. Verifica que los campos de tarifa no sean NULL:
   ```sql
   UPDATE configuracion_pagos 
   SET 
     tarifa_dia_semana = COALESCE(tarifa_dia_semana, 30000),
     tarifa_sabado = COALESCE(tarifa_sabado, 40000),
     tarifa_domingo = COALESCE(tarifa_domingo, 50000)
   WHERE es_actual = true;
   ```

### ERROR: Calendario no muestra turnos

**Síntoma**: Calendario semanal aparece vacío.

**Soluciones**:
1. Verifica que la semana mostrada tiene turnos:
   ```sql
   SELECT * FROM turnos_v2 
   WHERE temporada = 'baja' 
   AND horario = 'invierno'
   LIMIT 10;
   ```

2. Cambia de semana usando los botones ◀ ▶

3. Verifica que los filtros de escenario (temporada/horario) coincidan con las plantillas que existen

4. Revisa la consola del navegador para errores en `convertirTurnosABloques()`

### ERROR: "Duplicate key violation" al crear plantilla

**Síntoma**: Error al intentar insertar plantilla de turno.

**Causa**: Ya existe una plantilla con la misma combinación de:
- codigo_turno + temporada + horario + semana_ciclo + dia_semana + hora_inicio + hora_fin

**Solución**: Esto es normal y esperado. El `ON CONFLICT DO NOTHING` en los scripts SQL previene duplicados. Si estás creando manualmente, verifica primero:
```sql
SELECT * FROM turnos_v2 
WHERE codigo_turno = 'GP1' 
AND temporada = 'baja'
AND horario = 'invierno'
AND semana_ciclo = 1
AND dia_semana = 'martes';
```

---

## 📊 Dashboard y Estadísticas

### ¿Por qué las estadísticas están vacías?

**Causa**: No hay turnos asignados para el mes/año seleccionado.

**Solución**: 
1. Asigna al menos una persona a un turno
2. Las estadísticas solo muestran datos de turnos con estado "asignado" o "completado"
3. Verifica que mes/año en filtros coincidan con turnos asignados

### ¿Puedo ver estadísticas de meses pasados?

Sí, simplemente cambia el mes y año en los filtros superiores. El dashboard se recalculará automáticamente.

### ¿Cómo interpreto "Horas Totales"?

Es la suma de todas las horas trabajadas en el mes. Se calcula como:
```
suma de (hora_fin - hora_inicio) para cada turno asignado
```

Ejemplo: 8 turnos de 9 horas = 72 horas totales

---

## 🎨 Personalización

### ¿Puedo agregar un quinto tipo de guardia (GP5)?

Sí, pero requiere:
1. Agregar plantillas manualmente en Supabase:
   ```sql
   INSERT INTO turnos_v2 (codigo_turno, temporada, horario, ...) VALUES
   ('GP5', 'baja', 'invierno', 1, 'lunes', '10:00', '19:00', ...);
   ```

2. Agregar multiplicador en configuración:
   ```sql
   ALTER TABLE configuracion_pagos 
   ADD COLUMN multiplicador_gp5 DECIMAL(5,2) DEFAULT 1.0;
   ```

3. Actualizar servicio `calcularEstadisticasMes()` para incluir GP5 en cálculos

### ¿Puedo cambiar los nombres de GP1, GP2, etc?

Sí, actualizando el campo `puesto` en las plantillas:
```sql
UPDATE turnos_v2 
SET puesto = 'Supervisor Principal' 
WHERE codigo_turno = 'GP1';
```

El código `GP1` se mantiene, pero el label mostrado cambia.

### ¿Puedo agregar más días festivos?

Actualmente el sistema solo tiene tarifa para "festivos" pero no maneja fechas específicas. Para implementarlo:

1. Crea tabla de festivos:
   ```sql
   CREATE TABLE festivos (
     fecha DATE PRIMARY KEY,
     nombre TEXT
   );
   
   INSERT INTO festivos VALUES 
   ('2026-01-01', 'Año Nuevo'),
   ('2026-09-18', 'Fiestas Patrias');
   ```

2. Modifica `calcularEstadisticasMes()` para verificar si `turno.fecha` está en tabla festivos

---

## 🔄 Flujo de Trabajo Avanzado

### ¿Cómo programo todo un año?

Recomendación:
1. Programa primero meses de alta temporada (más crítico)
2. Luego meses de baja temporada
3. Mantén un buffer de 1 mes de anticipación

Ejemplo en Octubre 2025:
```
✅ Noviembre 2025 - programado
✅ Diciembre 2025 - programado
⏳ Enero 2026 - en proceso
❌ Febrero 2026 - pendiente
```

### ¿Puedo copiar asignaciones de un mes a otro?

Actualmente no hay función automática, pero puedes:
1. Exportar estadísticas del mes A a Excel
2. Usar eso como referencia para programar mes B

**Próxima mejora sugerida**: Botón "Copiar del mes anterior"

### ¿Cómo manejo vacaciones o ausencias?

Opción 1: No asignar a esa persona en esas semanas
Opción 2: Asignar y luego cambiar estado a "cancelado"
Opción 3: Asignar persona temporal/reemplazo

### ¿Puedo tener dos personas en el mismo turno?

No directamente. La tabla está diseñada para 1 persona por turno. Si necesitas duplicar cobertura:
1. Crea una segunda plantilla manualmente con código "GP1-B"
2. Asigna la segunda persona a esa plantilla

---

## 🚀 Performance y Escalabilidad

### ¿Cuántos turnos puede manejar el sistema?

La tabla `turnos_v2` puede manejar millones de registros. Actualmente tienes ~250 plantillas base. Cuando asignes personas, tendrás:

```
250 plantillas × 12 meses = 3,000 registros por año
```

Esto es muy manejable para PostgreSQL.

### ¿El calendario se vuelve lento con muchos turnos?

El componente `WeeklySchedule` solo muestra 1 semana a la vez (máximo ~30-40 bloques), por lo que el performance es excelente incluso con miles de turnos totales.

### ¿Puedo usar este sistema con múltiples ubicaciones?

Sí, el campo `ubicacion` existe en la tabla. Podrías:
1. Duplicar plantillas con diferentes ubicaciones
2. Agregar filtro por ubicación en la página
3. Mostrar múltiples calendarios (uno por ubicación)

---

## 📱 Acceso y Permisos

### ¿El sistema funciona en móvil?

Sí, la UI usa TailwindCSS responsive. Sin embargo, la experiencia es mejor en tablet o desktop debido a la complejidad del calendario.

### ¿Puedo dar acceso de solo lectura a ciertos usuarios?

Actualmente no hay sistema de roles. Todos los usuarios autenticados tienen acceso completo. Para implementar roles:
1. Agregar tabla `usuarios` con campo `rol`
2. Implementar RLS policies en Supabase
3. Condicionar botones de acción según rol en el frontend

---

## 🔒 Seguridad

### ¿Los datos están protegidos?

Sí:
- **RLS habilitado** en Supabase para ambas tablas
- **Políticas permisivas** actualmente (para desarrollo)
- En producción, debes actualizar las policies a algo como:
  ```sql
  CREATE POLICY "Solo admin puede modificar" ON turnos_v2
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  ```

### ¿Puedo hacer backup de los turnos?

Sí, desde Supabase Dashboard:
1. Settings → Database → Backups
2. O exporta manualmente:
   ```sql
   COPY turnos_v2 TO '/tmp/turnos_backup.csv' CSV HEADER;
   ```

---

## 🐛 Reportar Problemas

Si encuentras un bug no documentado aquí:

1. Verifica la consola del navegador (F12) para errores
2. Revisa que los scripts SQL se ejecutaron correctamente
3. Confirma que tienes la última versión del código
4. Documenta:
   - Qué estabas haciendo
   - Qué esperabas que pasara
   - Qué pasó en realidad
   - Mensaje de error (si aplica)

---

## 📚 Recursos Adicionales

- **INSTRUCCIONES_PROGRAMACION_TURNOS.md** - Guía de instalación paso a paso
- **RESUMEN_SISTEMA_PROGRAMACION.md** - Documentación técnica completa
- **MATRIZ_ESCENARIOS_TURNOS.md** - Comparativa visual de los 4 escenarios
- **sql/crear_turnos_v2.sql** - Script principal de base de datos
- **sql/plantillas_turnos_completas.sql** - Script de plantillas adicionales

---

**¿Tu pregunta no está aquí?** 
Revisa los comentarios en el código fuente o consulta la documentación de Supabase.

**Desarrollado para Punta de Lobos** 🌊
