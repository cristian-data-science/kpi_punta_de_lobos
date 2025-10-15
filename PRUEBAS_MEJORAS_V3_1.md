# 🧪 Guía de Pruebas - Mejoras v3.1

## ✅ Checklist de Pruebas

### 1. Headers con Fechas
- [ ] Abre la sección Turnos
- [ ] Verifica que cada día muestra: "LUNES 14", "MARTES 15", etc.
- [ ] El número debe ser más grande que el nombre del día
- [ ] El día actual debe tener fondo azul claro

### 2. Posicionamiento de Bloques
- [ ] Crea un turno para el día Martes a las 10:00
- [ ] El bloque del turno NO debe pasar por detrás del header
- [ ] El bloque debe empezar exactamente en la línea de las 10:00
- [ ] El bloque debe terminar en la hora correcta (ej: 11:00)

### 3. Colores Persistentes
- [ ] Crea un turno para "María González"
- [ ] Anota el color que recibe (ej: azul)
- [ ] Recarga la página (F5)
- [ ] Verifica que María González sigue teniendo el mismo color
- [ ] Crea otro turno para "Juan Pérez"
- [ ] Debe recibir un color diferente al de María

### 4. Modal con Overlay
- [ ] Click en una celda vacía para crear turno
- [ ] El fondo debe ser semi-transparente (no negro sólido)
- [ ] Se debe ver el contenido detrás con blur
- [ ] Click fuera del modal (en el fondo) debe cerrarlo
- [ ] Click dentro del modal NO debe cerrarlo

### 5. Animaciones y Hover
- [ ] Pasa el mouse sobre un turno
- [ ] Debe elevarse suavemente
- [ ] La sombra debe hacerse más pronunciada
- [ ] Pasa el mouse sobre una celda vacía
- [ ] Debe cambiar a fondo azul claro
- [ ] El cursor debe cambiar a pointer

### 6. Tooltip
- [ ] Pasa el mouse sobre un turno
- [ ] Debe aparecer un tooltip negro con información
- [ ] El tooltip debe seguir el cursor
- [ ] El tooltip debe tener una pequeña flecha

### 7. Responsive
- [ ] Redimensiona la ventana a <1000px
- [ ] Debe aparecer scroll horizontal
- [ ] Los turnos deben seguir viéndose correctamente
- [ ] En móvil, todo debe funcionar con touch

## 🐛 Si algo no funciona...

### Los bloques siguen mal posicionados
1. Abre DevTools (F12)
2. Busca `.blocks-layer` en el inspector
3. Verifica que tiene `top: 56px`
4. Verifica que los bloques tienen la clase correcta

### Los colores no persisten
1. Abre DevTools → Application → Local Storage
2. Busca la key `schedule_person_colors`
3. Debe tener un objeto JSON con los colores

### El modal sigue con fondo negro
1. Inspecciona el elemento del modal
2. Debe tener clase `modal-overlay`
3. Verifica que el CSS se cargó correctamente

### Las fechas no aparecen
1. Abre la consola (F12)
2. Busca errores relacionados con `formatDayWithDate`
3. Verifica que `weekStart` tiene un valor válido

## 📸 Capturas de Referencia

### Headers Correctos
```
┌─────────┬─────────┬─────────┐
│  LUNES  │ MARTES  │ MIÉRCOLES│
│   14    │   15    │   16    │  ← Números grandes
└─────────┴─────────┴─────────┘
```

### Bloques Bien Posicionados
```
┌─────────────────────────┐
│      MARTES 15         │ ← Header
├─────────────────────────┤
│ 09:00                  │
├─────────────────────────┤
│ 10:00 [MARÍA GONZÁLEZ] │ ← Empieza aquí
│       [MARÍA GONZÁLEZ] │
├─────────────────────────┤
│ 11:00                  │ ← Termina aquí
```

### Modal con Overlay Correcto
```
[Fondo semi-transparente con blur]
  ┌─────────────────────┐
  │   ⚡ Crear Turno    │
  │                     │
  │ [Formulario]        │
  │                     │
  │ [Cancelar] [Crear]  │
  └─────────────────────┘
```

## ✅ Criterios de Éxito

- ✅ Todas las pruebas pasan
- ✅ No hay errores en consola
- ✅ La interfaz se ve profesional
- ✅ Las animaciones son suaves (60fps)
- ✅ Funciona en Chrome, Firefox, Safari, Edge

## 🎉 ¡Éxito!

Si todas las pruebas pasan, ¡felicitaciones! El calendario está funcionando perfectamente con todas las mejoras aplicadas.

---

**Nota**: Si encuentras algún problema, revisa primero:
1. Que el navegador está actualizado
2. Que no hay errores en consola (F12)
3. Que limpiaste la cache (Ctrl+Shift+Delete)
