# 🔒 Sistema de Límite de Intentos de Login - TransApp

## 🚀 Activación/Desactivación Rápida

Para **activar o desactivar** el sistema de límite de intentos, editar el archivo:

```
src/config/loginConfig.js
```

### ✅ Para Activar el Sistema:
```javascript
loginAttemptsEnabled: true,
```

### ❌ Para Desactivar el Sistema:
```javascript
loginAttemptsEnabled: false,
```

## ⚙️ Configuración Disponible

### Configuración Principal
- **`loginAttemptsEnabled`**: `true/false` - Activar/desactivar todo el sistema
- **`maxLoginAttempts`**: `3` - Número máximo de intentos permitidos (por defecto: 3)
- **`lockoutDuration`**: `15` - Minutos de bloqueo después de exceder intentos (por defecto: 15 min)

### Configuración Adicional
- **`resetAttemptsOnSuccess`**: `true/false` - Resetear contador al login exitoso
- **`showAttemptsRemaining`**: `true/false` - Mostrar intentos restantes al usuario

## 🎯 Comportamiento del Sistema

### Cuando está ACTIVADO (`loginAttemptsEnabled: true`):
1. **Intento 1 fallido**: "Credenciales incorrectas. Te quedan 2 intentos."
2. **Intento 2 fallido**: "Credenciales incorrectas. Te quedan 1 intentos."
3. **Intento 3 fallido**: "Demasiados intentos fallidos. Usuario bloqueado por 15 minutos."
4. **Durante bloqueo**: Botón deshabilitado con mensaje "Usuario bloqueado. Intenta nuevamente en X minutos."

### Cuando está DESACTIVADO (`loginAttemptsEnabled: false`):
- Login normal sin límites ni contadores
- Mensaje simple: "Credenciales incorrectas"
- Sin bloqueos ni restricciones

## 🔧 Cambios Rápidos

### Cambiar número de intentos (ejemplo: 5 intentos)
```javascript
maxLoginAttempts: 5,
```

### Cambiar tiempo de bloqueo (ejemplo: 30 minutos)
```javascript
lockoutDuration: 30,
```

### No mostrar intentos restantes
```javascript
showAttemptsRemaining: false,
```

## 🗄️ Datos Almacenados

El sistema utiliza localStorage para persistir:
- `transapp-login-attempts`: Contador de intentos actuales
- `transapp-lockout`: Información de bloqueo (tiempo de fin, intentos)

Para **limpiar manualmente** el bloqueo desde el navegador:
```javascript
localStorage.removeItem('transapp-login-attempts')
localStorage.removeItem('transapp-lockout')
```

## 🔄 Reiniciar Sistema

El sistema se reinicia automáticamente cuando:
1. Login exitoso (si `resetAttemptsOnSuccess: true`)
2. Expira el tiempo de bloqueo
3. Se limpia manualmente el localStorage

## 📝 Credenciales de Prueba

- **Usuario**: `admin`
- **Contraseña**: `transapp123`

---
*Configuración: `src/config/loginConfig.js` | Sistema: AuthContext + Login Component*
