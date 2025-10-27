# 🔄 Flujo de Implementación - Sistema de Tarifas por Hora

## 📊 Diagrama de Implementación

```
┌─────────────────────────────────────────────────────────────┐
│                   🚀 FASE 1: INSTALACIÓN                    │
│                         (5 minutos)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  1. Abrir Supabase    │
                  │     SQL Editor        │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  2. Copiar script     │
                  │  agregar_tarifa_      │
                  │     persona.sql       │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  3. Ejecutar script   │
                  │     (Run / F5)        │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  ✅ Campo agregado    │
                  │  ✅ Funciones creadas │
                  │  ✅ Vista creada      │
                  └───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               ⚙️  FASE 2: CONFIGURACIÓN                     │
│                         (2 minutos)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  SELECT nombre, tarifa_hora         │
        │  FROM personas;                     │
        │                                     │
        │  Resultado:                         │
        │  - Instructor: $8.000/h             │
        │  - Guía: $6.000/h                   │
        │  - Staff: $5.000/h                  │
        │  - Visitante: $3.000/h              │
        └─────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  ¿Ajustar tarifas?    │
                  └───────────────────────┘
                       │            │
                       │ No         │ Sí
                       │            ▼
                       │   ┌────────────────┐
                       │   │ UPDATE personas│
                       │   │ SET tarifa_hora│
                       │   └────────────────┘
                       │            │
                       └────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  🔄 FASE 3: VERIFICACIÓN                    │
│                         (1 minuto)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Refrescar navegador  │
                  │  (F5 o Cmd+R)         │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Ir a /programacion-  │
                  │        turnos         │
                  └───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  ✅ FASE 4: PRUEBA                          │
│                         (2 minutos)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  1. Seleccionar Temporada/Horario   │
        │     (ej: Baja / Invierno)           │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  2. Seleccionar Mes/Año             │
        │     (ej: Noviembre 2025)            │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  3. Ver turnos disponibles en       │
        │     calendario semanal              │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  4. Click en un turno               │
        │     (ej: GP1 - Lunes 09:00-18:00)   │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  5. Modal: Seleccionar persona      │
        │     (ej: María González)            │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  6. Click "Asignar"                 │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  ✅ Turno asignado                  │
        │  ✅ Estado: "asignado"              │
        │  ✅ Color azul en calendario        │
        └─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              📊 FASE 5: VERIFICAR CÁLCULOS                  │
│                         (1 minuto)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Scroll a "Estadísticas del Mes"    │
        │  (Dashboard abajo del calendario)   │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Verificar cálculo:                 │
        │                                     │
        │  María González                     │
        │  - Turnos: 1                        │
        │  - Horas: 9h                        │
        │  - Monto: $72.000                   │
        │           (9h × $8.000/h)           │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Verificar manualmente:             │
        │                                     │
        │  Turno: 09:00 - 18:00 = 9 horas     │
        │  Tarifa María: $8.000/hora          │
        │  Cálculo: 9 × $8.000 = $72.000 ✓    │
        └─────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  ¿Cálculo correcto?   │
                  └───────────────────────┘
                       │            │
                       │ No         │ Sí
                       ▼            ▼
              ┌──────────────┐  ┌──────────────┐
              │ Revisar FAQ  │  │ ¡Todo listo! │
              │ en docs/     │  │ 🎉 Funciona  │
              └──────────────┘  └──────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│              🎯 SISTEMA EN PRODUCCIÓN                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Uso Mensual

```
┌───────────────────────────────────────────────────────────┐
│  INICIO DEL MES - Programación de Turnos                  │
└───────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Gerente/Admin decide:           │
        │  - Temporada (Baja/Alta)         │
        │  - Horario (Invierno/Verano)     │
        │  - Mes a programar (ej: Dic)     │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Sistema muestra:                │
        │  - Turnos disponibles (plantilla)│
        │  - Calendario semanal            │
        │  - Personas disponibles          │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Por cada turno:                 │
        │  1. Click en turno               │
        │  2. Seleccionar persona          │
        │  3. Asignar                      │
        │  4. Ver monto calculado          │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Repetir para todas las semanas  │
        │  del mes (4 semanas)             │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Dashboard muestra totales:      │
        │  - Total turnos: 48              │
        │  - Total horas: 432h             │
        │  - Total mes: $2.376.000         │
        │  - Por persona: desglosado       │
        └──────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│  FIN DEL MES - Revisión y Cierre                          │
└───────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Exportar datos (opcional):      │
        │  - Vista SQL con JOIN            │
        │  - Excel desde UI                │
        │  - Dashboard screenshots         │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Procesar pagos según dashboard  │
        │  (usar montos calculados)        │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Cambiar estado de turnos:       │
        │  "asignado" → "completado"       │
        └──────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  Siguiente mes │
                  └────────────────┘
                           │
                           ▼
                    (Volver al inicio)
```

---

## 🛠️ Flujo de Cálculo de Monto

```
┌─────────────────────────────────────────────────────────┐
│  CÁLCULO AUTOMÁTICO DE MONTO                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Usuario asigna      │
                │  persona a turno     │
                └──────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  Sistema obtiene datos:              │
        │                                      │
        │  FROM turnos_v2:                     │
        │  - hora_inicio: "10:00"              │
        │  - hora_fin: "19:00"                 │
        │                                      │
        │  FROM personas (JOIN):               │
        │  - tarifa_hora: 8000                 │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  Función: calcularHorasTurno()       │
        │                                      │
        │  Input:                              │
        │  - horaInicio: "10:00"               │
        │  - horaFin: "19:00"                  │
        │                                      │
        │  Proceso:                            │
        │  - Convertir a minutos: 600, 1140    │
        │  - Diferencia: 540 minutos           │
        │  - Dividir por 60: 9 horas           │
        │                                      │
        │  Output: 9                           │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  Función: calcularMontoTurno()       │
        │                                      │
        │  Input:                              │
        │  - tarifaHora: 8000                  │
        │  - horas: 9                          │
        │                                      │
        │  Proceso:                            │
        │  - Multiplicar: 8000 × 9 = 72000     │
        │  - Redondear: 72000 (ya entero)      │
        │                                      │
        │  Output: 72000                       │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  Función: formatMonto()              │
        │                                      │
        │  Input: 72000                        │
        │                                      │
        │  Proceso:                            │
        │  - Formato: es-CL currency           │
        │  - Sin decimales                     │
        │                                      │
        │  Output: "$72.000"                   │
        └──────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Mostrar en UI:      │
                │  "Monto: $72.000"    │
                └──────────────────────┘
```

---

## 📊 Flujo de Estadísticas Mensual

```
┌─────────────────────────────────────────────────────────┐
│  CÁLCULO DE ESTADÍSTICAS DEL MES                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  calcularEstadisticasMes(mes, anio)  │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  1. Obtener todos los turnos del mes │
        │     WHERE mes_asignacion = mes       │
        │     AND anio_asignacion = anio       │
        │     JOIN personas                    │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  2. Agrupar por persona_id           │
        │     (usando objeto statsByPerson)    │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  3. Para cada turno:                 │
        │                                      │
        │     a. Contar turnos                 │
        │     b. Clasificar día                │
        │        - diasSemana++                │
        │        - sabados++                   │
        │        - domingos++                  │
        │                                      │
        │     c. Calcular horas:               │
        │        horas = calcularHorasTurno()  │
        │                                      │
        │     d. Calcular monto:               │
        │        monto = horas × tarifa_hora   │
        │                                      │
        │     e. Sumar a totales persona       │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  4. Convertir a array y ordenar      │
        │     por montoTotal DESC              │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  5. Calcular totales generales       │
        │     (suma de todos los valores)      │
        └──────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Retornar:           │
                │  - porPersona: []    │
                │  - totales: {}       │
                └──────────────────────┘
```

---

## 🎯 Puntos de Decisión Clave

### ¿Cuándo ajustar tarifas?

```
          ┌────────────────┐
          │  Nueva persona │
          └────────────────┘
                  │
                  ▼
          ┌────────────────┐
          │  Definir tarifa│
          │  según rol     │
          └────────────────┘
                  
          
          ┌────────────────┐
          │  Cambio de rol │
          └────────────────┘
                  │
                  ▼
          ┌────────────────┐
          │  Actualizar    │
          │  tarifa_hora   │
          └────────────────┘


          ┌────────────────┐
          │  Ajuste IPC    │
          └────────────────┘
                  │
                  ▼
          ┌────────────────┐
          │  UPDATE masivo │
          │  (todas ×1.10) │
          └────────────────┘
```

---

**🌊 Flujo completo documentado - Listo para implementar!**
