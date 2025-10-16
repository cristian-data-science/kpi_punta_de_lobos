# 🚀 Guía Rápida - Visualizador de Turnos

## Para Trabajadores

### ¿Cómo accedo a mis turnos?

1. **Abre tu navegador** y ve a:
   ```
   https://tu-dominio.com/trabajador/login
   ```

2. **Ingresa tu RUT**
   - Puedes escribirlo con o sin puntos y guión
   - Ejemplo: `12345678-9` o `123456789`
   - Se formateará automáticamente mientras escribes

3. **Presiona "Ver Mis Turnos"**
   - El sistema validará tu RUT
   - Te mostrará tus turnos si tu RUT está registrado

4. **Visualiza tus turnos**
   - **Vista Calendario**: Ver turnos en formato semanal
   - **Vista Lista**: Ver turnos en formato de lista detallada
   - Navega entre semanas con las flechas ⬅️ ➡️
   - Presiona "Hoy" para volver a la semana actual

### Información que verás

- 📅 **Fecha** de cada turno
- ⏰ **Hora de inicio y fin**
- 🍽️ **Hora de almuerzo** (si aplica)
- 📍 **Puesto** donde trabajarás
- 🏖️ **Ubicación** del trabajo
- 📝 **Notas** adicionales importantes

### Estadísticas

En la parte superior verás:
- **Turnos Hoy**: Cuántos turnos tienes para hoy
- **Activos**: Turnos en curso ahora mismo
- **Completados**: Turnos ya finalizados
- **Programados**: Turnos pendientes

### ¿Cómo salir?

Presiona el botón **"Salir"** 🚪 en la esquina superior derecha.

---

## Para Administradores

### Requisitos previos

Para que un trabajador pueda acceder:

1. **Debe estar registrado** en la tabla `personas`
2. **Debe tener un RUT válido** en el sistema
3. El RUT debe estar **sin puntos ni guiones** en la base de datos
4. Debe tener **turnos asignados** para verlos en el calendario

### Registro de nuevos trabajadores

Asegúrate de que cuando registres un trabajador:
- El campo `rut` esté completo
- El RUT esté sin formato (ej: `123456789` en vez de `12.345.678-9`)
- El RUT sea válido (con dígito verificador correcto)

### Ejemplo SQL

```sql
-- Agregar trabajador con RUT
INSERT INTO personas (nombre, rut, email, telefono, tipo)
VALUES ('Juan Pérez', '123456789', 'juan@email.com', '+56912345678', 'guarda');

-- Verificar RUTs registrados
SELECT nombre, rut FROM personas WHERE rut IS NOT NULL;
```

### Accesos

- **Admin**: `https://tu-dominio.com/` (login normal)
- **Trabajadores**: `https://tu-dominio.com/trabajador/login` (login con RUT)

### Diferencias entre Admin y Trabajador

| Característica | Admin | Trabajador |
|----------------|-------|------------|
| Login | Usuario + Contraseña | Solo RUT |
| Ver turnos | Todos | Solo los propios |
| Editar turnos | ✅ Sí | ❌ No |
| Crear turnos | ✅ Sí | ❌ No |
| Eliminar turnos | ✅ Sí | ❌ No |
| Gestión personas | ✅ Sí | ❌ No |
| Reportes | ✅ Sí | ❌ No |

---

## Soporte Técnico

### Problemas comunes

#### "RUT no encontrado"
- ✅ Verifica que el RUT esté registrado en la base de datos
- ✅ Verifica que el RUT esté sin puntos ni guiones en la BD
- ✅ Verifica que el dígito verificador sea correcto

#### "RUT inválido"
- ✅ Verifica que el RUT tenga el formato correcto
- ✅ El dígito verificador debe ser correcto
- ✅ Debe tener al menos 7 dígitos + 1 verificador

#### No aparecen turnos
- ✅ Verifica que el trabajador tenga turnos asignados
- ✅ Verifica la semana actual (navega con las flechas)
- ✅ Presiona el botón "Actualizar" 🔄

### Contacto

Para más ayuda, contacta al administrador del sistema.

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025
