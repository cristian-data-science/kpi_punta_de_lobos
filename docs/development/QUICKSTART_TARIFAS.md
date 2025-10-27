# 🚀 Quick Start - Tarifa por Hora según Persona

## ⚡ Cambio en 3 Pasos

### 1️⃣ Ejecuta el Script SQL (5 minutos)

```bash
# Abre Supabase Dashboard → SQL Editor
# Copia y ejecuta: sql/agregar_tarifa_persona.sql
```

**Esto agrega**:
- Campo `tarifa_hora` a tabla `personas`
- Función `calcular_horas_turno()`
- Vista `vista_turnos_v2_con_pago`
- Función `obtener_estadisticas_mes()`

### 2️⃣ Verifica Tarifas Asignadas

```sql
SELECT nombre, tipo, tarifa_hora, estado
FROM personas
ORDER BY tarifa_hora DESC;
```

**Tarifas por defecto**:
- Instructor: $8.000/hora
- Guía: $6.000/hora
- Staff: $5.000/hora
- Visitante: $3.000/hora

### 3️⃣ ¡Listo! Refresca tu Navegador

El dashboard ahora calculará:

```
Monto = Horas Trabajadas × Tarifa de la Persona
```

---

## 💡 Cómo Funciona

### Antes (Complejo)
```javascript
// Tarifas por día + multiplicadores por guardia
tarifa_lunes = $30.000
tarifa_sabado = $40.000
tarifa_domingo = $50.000
multiplicador_GP1 = 1.0
multiplicador_voluntario = 0.5
```

### Ahora (Simple)
```javascript
// Una sola tarifa por persona
maria.tarifa_hora = $8.000
juan.tarifa_hora = $6.000
carlos.tarifa_hora = $3.000

// Cálculo directo
monto_turno = horas_trabajadas × persona.tarifa_hora
```

---

## 📊 Ejemplo Real

**María (Instructora) - Turno 10:00-19:00**
```
Horas: 9 horas
Tarifa: $8.000/hora
Monto: 9 × $8.000 = $72.000
```

**Juan (Guía) - Turno 12:00-21:00**
```
Horas: 9 horas
Tarifa: $6.000/hora
Monto: 9 × $6.000 = $54.000
```

**Dashboard Mensual**:
```
┌─────────┬────────┬───────┬──────────┐
│ Persona │ Turnos │ Horas │ Monto    │
├─────────┼────────┼───────┼──────────┤
│ María   │ 12     │ 108h  │ $864.000 │
│ Juan    │ 10     │  90h  │ $540.000 │
│ Carlos  │  8     │  72h  │ $216.000 │
├─────────┼────────┼───────┼──────────┤
│ TOTAL   │ 30     │ 270h  │ $1.620k  │
└─────────┴────────┴───────┴──────────┘
```

---

## 🔧 Ajustar Tarifas

### En SQL (Ahora)
```sql
-- Cambiar tarifa de una persona
UPDATE personas 
SET tarifa_hora = 7500 
WHERE nombre = 'Juan Pérez';

-- Aumentar 10% todas las tarifas
UPDATE personas 
SET tarifa_hora = tarifa_hora * 1.10
WHERE estado = 'activo';
```

### En UI (Futuro - Opcional)
Podrías crear una página en Configuración para editar visualmente.

---

## ✅ Archivos Modificados

1. **`sql/agregar_tarifa_persona.sql`** - Script de instalación
2. **`src/services/turnosV2Helpers.js`** - Lógica de cálculo actualizada
3. **`SISTEMA_TARIFAS_POR_PERSONA.md`** - Documentación completa

---

## 🎯 Resultado

- ✅ **Simplicidad**: Un solo valor por persona
- ✅ **Flexibilidad**: Cada persona con tarifa propia
- ✅ **Transparencia**: Cálculo obvio (horas × tarifa)
- ✅ **Sin cambios en UI**: El dashboard funciona igual, solo mejores cálculos

---

**🌊 ¡Ejecuta el SQL y ya está funcionando!**

Para más detalles ver: `SISTEMA_TARIFAS_POR_PERSONA.md`
