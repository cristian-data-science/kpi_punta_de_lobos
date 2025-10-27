# 🎯 Guía Rápida: Probar Visualizador de Turnos

## 🚀 Paso a Paso

### Paso 1: Preparar la Base de Datos

1. **Abre Supabase** (o tu cliente SQL)
2. **Ejecuta el script**: `sql/prueba_visualizador_turnos.sql`
3. Esto creará:
   - 3 personas de prueba con RUTs válidos
   - Turnos de prueba para la semana actual

### Paso 2: Obtener un RUT de Prueba

Ejecuta en Supabase:
```sql
SELECT nombre, rut FROM personas WHERE rut IS NOT NULL LIMIT 5;
```

Te devolverá algo como:
```
nombre          | rut
----------------|----------
Juan Pérez      | 111111111
María González  | 222222222
```

### Paso 3: Acceder al Login de Trabajadores

1. Abre tu navegador en:
   ```
   http://localhost:5173/trabajador/login
   ```

2. Verás una pantalla como el login admin pero más simple:
   - Solo un campo: **RUT**
   - Título: "Visualizador de Turnos"
   - Subtítulo: "Ingresa tu RUT para ver tus turnos"

### Paso 4: Ingresar el RUT

Puedes ingresar el RUT de dos formas:

**Opción 1 - Sin formato:**
```
111111111
```

**Opción 2 - Con formato:**
```
11.111.111-1
```

El sistema:
- ✅ Formateará automáticamente mientras escribes
- ✅ Validará el dígito verificador
- ✅ Buscará en la base de datos

### Paso 5: Ver tus Turnos

Si el RUT es válido:
1. Te redirigirá a `/trabajador/turnos`
2. Verás:
   - Tu nombre y RUT en la parte superior
   - Estadísticas: Turnos Hoy, Activos, Completados, Programados
   - **Vista Calendario**: Turnos en formato semanal
   - **Vista Lista**: Turnos en formato de lista detallada
   - Botones: Hoy, Ver Lista/Calendario, Actualizar, Salir

## 🎨 Diferencias con el Admin

| Característica | Admin | Trabajador |
|----------------|-------|------------|
| **URL** | `/` | `/trabajador/login` |
| **Login** | Usuario + Contraseña | Solo RUT |
| **Ver turnos** | Todos | Solo los propios |
| **Editar** | ✅ Sí | ❌ No (solo lectura) |
| **Crear** | ✅ Sí | ❌ No |
| **Layout** | Con sidebar y header | Full screen limpio |

## 🧪 RUTs de Prueba Válidos

Si ejecutaste el script, estos RUTs funcionan:

```
11.111.111-1  → Juan Pérez
22.222.222-2  → María González
33.333.333-3  → Pedro Rodríguez
```

## ❌ Errores Comunes

### "RUT inválido"
- ✅ Verifica que el dígito verificador sea correcto
- ✅ El RUT debe tener al menos 7 dígitos + 1 verificador

### "RUT no encontrado"
- ✅ Verifica que la persona exista en la tabla `personas`
- ✅ El RUT en la BD debe estar sin puntos ni guiones
- ✅ Ejecuta: `SELECT * FROM personas WHERE rut = '111111111'`

### No aparecen turnos
- ✅ Verifica que tenga turnos asignados
- ✅ Los turnos deben ser de la semana actual
- ✅ Navega con las flechas ⬅️ ➡️ si son de otra semana

## 🔧 Debug Rápido

Si algo no funciona, abre la consola del navegador (F12) y busca mensajes como:
```javascript
TrabajadorContext: Login exitoso para: Juan Pérez
```

## 📱 Probar en Móvil

El visualizador es responsive, puedes probarlo:
1. Abre Chrome DevTools (F12)
2. Activa el modo dispositivo móvil
3. Recarga la página
4. Verás la versión móvil optimizada

## 🎉 ¡Listo!

Ya puedes:
- ✅ Acceder con cualquier RUT válido
- ✅ Ver turnos personalizados
- ✅ Navegar entre semanas
- ✅ Cambiar entre vista calendario y lista
- ✅ Cerrar sesión y probar con otro RUT

---

**Siguiente paso**: Compartir la URL `/trabajador/login` con tus trabajadores para que vean sus turnos.
