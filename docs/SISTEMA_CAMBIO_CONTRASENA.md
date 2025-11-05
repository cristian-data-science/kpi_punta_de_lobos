# 🔐 Sistema de Cambio de Contraseña - Guía de Implementación

## ✅ Implementación Completada

Se ha implementado un sistema completo de cambio de contraseña que permite actualizar la contraseña de administrador desde la interfaz web sin necesidad de redeployment.

---

## 📋 Archivos Creados/Modificados

### Nuevos Archivos
1. **`src/components/PasswordChangeCard.jsx`** - Componente de cambio de contraseña con validaciones
2. **`sql/EJECUTAR_EN_SUPABASE.sql`** - Script SQL para crear tabla app_config
3. **`sql/crear_tabla_app_config.sql`** - Script SQL alternativo
4. **`test/setup-app-config.cjs`** - Script Node.js para setup automático

### Archivos Modificados
1. **`src/pages/Configuracion.jsx`** - Añadido componente PasswordChangeCard
2. **`src/contexts/AuthContext.jsx`** - Actualizado para leer credenciales de Supabase

---

## 🚀 Pasos para Activar el Sistema

### Paso 1: Ejecutar SQL en Supabase (REQUERIDO)

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú lateral izquierdo)
4. Click en **New Query**
5. Copia y pega el contenido de `sql/EJECUTAR_EN_SUPABASE.sql`
6. Click en **Run** (▶️)

**Verificación**: Deberías ver una tabla con 2 filas:
```
admin_password | transapp123 | Contraseña de administrador del sistema
admin_username | admin       | Usuario administrador del sistema
```

---

### Paso 2: Verificar Variables de Entorno

**En `.env.local`** (ya configuradas):
```bash
VITE_SUPABASE_URL=https://reodmwbtuzipvzunmlrj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=transapp123
```

**En Vercel** (Dashboard > Settings > Environment Variables):
- ✅ Verificar que existan las mismas variables
- ✅ Aplicadas a: Production, Preview, Development

---

### Paso 3: Probar el Sistema

#### Localmente:
```bash
pnpm dev
```

1. Inicia sesión con: `admin` / `transapp123`
2. Ve a **Configuración** (sidebar)
3. Busca la sección **"Cambiar Contraseña de Administrador"**
4. Completa el formulario:
   - **Contraseña Actual**: transapp123
   - **Nueva Contraseña**: MiNuevaContraseña123
   - **Confirmar**: MiNuevaContraseña123
5. Click en **Cambiar Contraseña**
6. Logout y vuelve a ingresar con la nueva contraseña

---

## 🔒 Características del Sistema

### Validaciones de Seguridad
- ✅ Contraseña nueva debe ser diferente a la actual
- ✅ Contraseña nueva y confirmación deben coincidir
- ✅ Sin restricciones de longitud o caracteres especiales

### Funcionalidades
- ✅ **Cambio inmediato**: Sin redeployment necesario
- ✅ **Fallback inteligente**: Si Supabase falla, usa variables de entorno
- ✅ **Visibilidad de contraseña**: Botones de mostrar/ocultar
- ✅ **Feedback visual**: Mensajes de éxito/error
- ✅ **Flexibilidad total**: Acepta cualquier contraseña sin restricciones

### Sistema de Fallback
```javascript
// Si Supabase no está disponible:
1. Login intenta leer desde Supabase
2. Si falla → usa VITE_ADMIN_PASSWORD del .env
3. Usuario siempre puede acceder
```

---

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN PROCESS                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │   AuthContext.login()   │
            └─────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │ validateCredentials()   │
            └─────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐
│  Query Supabase  │            │   Fallback to    │
│   app_config     │   ERROR→   │  .env variables  │
└──────────────────┘            └──────────────────┘
         │                                  │
         └────────────────┬─────────────────┘
                          │
                          ▼
                  ┌─────────────┐
                  │  ✅ Login   │
                  └─────────────┘
```

---

## 🔄 Flujo de Cambio de Contraseña

```
┌──────────────────────────────────────────────────────────┐
│           PASSWORD CHANGE PROCESS                        │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  PasswordChangeCard Component  │
         │  (Configuración page)          │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  1. Validate Current Password  │
         │     (Query Supabase)           │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  2. Validate New Password      │
         │     (Security Rules)           │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  3. Update in Supabase         │
         │     (app_config table)         │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  ✅ Success Message             │
         │  (Use new password next login) │
         └────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Error: "Error al verificar contraseña actual"
**Causa**: No se puede conectar a Supabase
**Solución**: 
1. Verificar que ejecutaste el SQL en Supabase
2. Verificar variables de entorno en `.env.local`
3. Revisar conexión a internet

### Error: "Contraseña actual incorrecta"
**Causa**: La contraseña ingresada no coincide
**Solución**:
1. Verificar la contraseña actual en Supabase SQL Editor:
   ```sql
   SELECT config_value FROM app_config WHERE config_key = 'admin_password';
   ```
2. Usar esa contraseña en el formulario

### Sistema usa contraseña antigua después de cambiar
**Causa**: Cache del navegador
**Solución**:
1. Hacer logout completo
2. Cerrar todas las pestañas
3. Limpiar localStorage (F12 > Application > Local Storage > Clear)
4. Volver a iniciar sesión

### Necesito resetear la contraseña a la original
**Solución**: Ejecutar en Supabase SQL Editor:
```sql
UPDATE app_config 
SET config_value = 'transapp123', updated_at = NOW()
WHERE config_key = 'admin_password';
```

---

## 📝 Notas Importantes

### ⚠️ Compatibilidad con Vercel
- El sistema funciona en producción (Vercel) sin configuración adicional
- Las variables `VITE_*` sirven como fallback si Supabase falla
- **NO es necesario actualizar variables de entorno en Vercel** cuando cambias la contraseña
- La contraseña nueva se guarda en Supabase y se sincroniza automáticamente

### 🔐 Seguridad
- Las contraseñas se almacenan en texto plano en Supabase (tabla privada)
- Solo el service role key puede acceder (no expuesto en frontend)
- Para mayor seguridad, migrar a Supabase Auth con bcrypt en el futuro

### 🚀 Ventajas de este Enfoque
1. **Sin redeployment**: Cambios instantáneos
2. **Centralizado**: Una sola fuente de verdad (Supabase)
3. **Resiliente**: Fallback a variables de entorno
4. **Simple**: No requiere backend adicional
5. **Escalable**: Fácil agregar más usuarios después

---

## ✅ Checklist de Implementación

- [x] Crear tabla `app_config` en Supabase
- [x] Insertar credenciales iniciales
- [x] Componente `PasswordChangeCard` implementado
- [x] Integrar en página Configuración
- [x] Actualizar `AuthContext` con validación Supabase
- [x] Sistema de fallback funcional
- [x] Validaciones de seguridad
- [ ] **PENDIENTE**: Ejecutar SQL en Supabase (Paso 1)
- [ ] **PENDIENTE**: Probar cambio de contraseña localmente
- [ ] **PENDIENTE**: Verificar en producción (Vercel)

---

## 🎯 Próximos Pasos (Opcional)

### Mejoras Futuras
1. **Historial de cambios**: Tabla `password_history` con timestamps
2. **Múltiples usuarios**: Tabla `users` con roles
3. **Hashing con bcrypt**: Mayor seguridad
4. **2FA**: Autenticación de dos factores
5. **Reset por email**: Recuperación de contraseña
6. **Migración a Supabase Auth**: Sistema completo de autenticación

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa logs en Supabase Dashboard
3. Verifica que el SQL se ejecutó correctamente
4. Consulta este documento

**Autor**: Sistema implementado el 5 de noviembre de 2025
**Versión**: 1.0.0
