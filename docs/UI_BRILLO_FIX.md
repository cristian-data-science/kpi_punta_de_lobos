# Ajuste de Brillo en Interacciones (Focus/Ring)

## Problema
Se observaba una ligera baja de brillo (flicker sutil) al interactuar con cualquier elemento (botones, inputs, links). El efecto se reproducía al enfocar/hover/click debido a la combinación de:

- `transition-all` en componentes base (`button`, `input`)
- `focus-visible:ring-ring/50` + `focus-visible:ring-[3px]` (sombra difusa semitransparente)
- Repetición simultánea en múltiples elementos dentro del layout

Esto generaba un cambio de luminancia aparente en el fondo al repintar.

## Causa Raíz
La utilidad de Tailwind para ring semitransparente + transición amplia provocaba un re-render visual que el usuario percibía como variación de brillo.

## Solución Aplicada (Mínima y No Invasiva)
Archivo: `src/App.css`

1. Eliminado efecto ring difuso reemplazándolo por un `outline` sólido accesible:
```css
:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; box-shadow: none !important; }
```
2. Neutralizado sólo el ring semitransparente generado por utilidades:
```css
.focus-visible:ring-ring\/50:focus-visible { box-shadow: none !important; }
```
3. Sustituido `transition-all` por transiciones específicas (color, background, border) para evitar repaints globales.

## Beneficios
- Mantiene accesibilidad del focus (visible y contrastado)
- Elimina cambio de brillo percibido
- No afecta layout ni componentes
- Fácil reversión si se desea experimentar: basta eliminar el bloque agregado

## Próximos Opcionales (No hechos)
- Implementar modo reducido con `prefers-reduced-motion`
- Añadir token específico `--focus-outline` para personalizar color

---
Fecha: 10-09-2025
Autor: Ajuste automático asistido por IA
