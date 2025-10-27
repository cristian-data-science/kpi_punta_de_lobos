# 🚀 Inicio Rápido - Módulo de Turnos con Calendario

## ✅ Verificación Previa

Antes de probar el módulo, asegúrate de que:

1. ✅ Las dependencias están instaladas:
```powershell
npm list react-big-calendar date-fns
```

2. ✅ El servidor está corriendo:
```powershell
npm run dev
```

3. ✅ La tabla `turnos` existe en Supabase:
   - Ve al SQL Editor en Supabase
   - Ejecuta el script `sql/agregar_turnos_cobros.sql` si no lo has hecho

4. ✅ Tienes al menos una persona en la tabla `personas`

## 🎯 Pruebas Recomendadas

### 1. **Prueba Creación Rápida** (más importante ⚡)

1. Navega a `/turnos`
2. El calendario debe estar visible
3. Haz **click en cualquier espacio** del calendario
   - Debe abrir un modal con "⚡ Crear Turno Rápido"
   - La fecha y hora deben estar pre-rellenadas
4. Selecciona una persona del dropdown
5. Click en "Crear Turno"
6. El turno debe aparecer en el calendario inmediatamente

**Tiempo esperado**: < 3 segundos ✅

### 2. **Prueba Edición Rápida**

1. Haz **click en un turno** del calendario
2. Debe abrir el modal de edición
3. Modifica el estado o las horas
4. Guarda
5. Los cambios deben reflejarse en el color/posición

**Tiempo esperado**: < 5 segundos ✅

### 3. **Prueba Vistas del Calendario**

1. Click en los botones: Mes / Semana / Día / Agenda
2. Cada vista debe mostrar los turnos correctamente
3. Los colores por estado deben mantenerse

### 4. **Prueba Vista Lista vs Calendario**

1. Click en "Ver Lista"
2. Debe cambiar a vista tradicional de lista
3. Click en "Ver Calendario"
4. Debe volver al calendario

### 5. **Prueba Creación Completa**

1. Click en botón "Nuevo Turno" (no en el calendario)
2. Debe abrir formulario completo
3. Rellena todos los campos:
   - Persona
   - Fecha y horarios
   - Tipo de turno: Completo
   - Estado: Programado
   - Puesto: "Instructor"
   - Ubicación: "Punta de Lobos"
   - Notas: "Turno de prueba"
4. Guarda
5. El turno debe aparecer en el calendario con todos los detalles

## 🐛 Problemas Comunes

### El calendario está en blanco
**Solución**: No hay turnos en la base de datos
- Crea tu primer turno con el botón "Nuevo Turno"
- O haz click en el calendario para crear uno rápido

### No se puede seleccionar en el calendario
**Solución**: Verifica que la biblioteca está cargada
- Abre la consola del navegador (F12)
- Busca errores relacionados con `react-big-calendar`
- Si hay error, ejecuta: `npm install react-big-calendar date-fns --legacy-peer-deps`

### Los colores no se ven bien
**Solución**: El CSS personalizado no se cargó
- Verifica que existe el archivo `src/pages/Turnos.css`
- Recarga la página con Ctrl+F5

### Error al crear turno
**Solución**: Revisa los datos requeridos
- Persona es obligatoria
- Fecha debe ser válida
- Horas deben estar en formato HH:mm

## 📊 Estados y Colores

Para probar todos los estados, crea turnos y cambia su estado:

- **Programado** 🔵: Azul (predeterminado)
- **En Curso** 🟢: Verde (cambia un turno a este estado)
- **Completado** ⚫: Gris (marca turnos finalizados)
- **Cancelado** 🔴: Rojo (cancela algún turno)
- **Ausente** 🟠: Naranja (marca ausencias)

## ⚡ Prueba de Velocidad

**Desafío**: ¿Puedes crear 5 turnos en menos de 30 segundos?

1. Click en calendario → Selecciona persona → Crear (repeat 5x)
2. Si toma más tiempo, algo no está optimizado

**Objetivo**: Cada turno debe crearse en ~5 segundos

## ✅ Checklist Final

- [ ] Calendario se muestra correctamente
- [ ] Click en espacio vacío abre modal rápido
- [ ] Click en turno existente abre editor
- [ ] Se pueden crear turnos rápidos (< 3 seg)
- [ ] Los turnos se muestran en el calendario
- [ ] Los colores por estado funcionan
- [ ] Las 4 vistas (Mes/Semana/Día/Agenda) funcionan
- [ ] Toggle entre Lista y Calendario funciona
- [ ] Las estadísticas se actualizan
- [ ] Se pueden editar turnos
- [ ] Se pueden eliminar turnos
- [ ] El calendario es responsive (prueba en móvil)

## 🎉 ¡Éxito!

Si todas las pruebas pasan, ¡felicidades! Tienes un sistema de gestión de turnos profesional con:

- ⚡ Creación ultra-rápida
- 🗓️ Visualización de calendario
- 🎨 Código de colores intuitivo
- 📱 Diseño responsive
- 🔄 Actualización en tiempo real

## 📞 Reportar Problemas

Si encuentras algún problema:

1. Anota el error exacto de la consola (F12)
2. Describe qué estabas haciendo
3. Incluye capturas de pantalla si es posible
4. Verifica primero el apartado "Problemas Comunes" arriba

¡Disfruta tu nuevo módulo de turnos! 🚀
