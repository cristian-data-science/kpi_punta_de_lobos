# ✅ Conexión Supabase - Setup Completo

## 🎉 ¡Todo Listo para Conectar!

He preparado todo lo necesario para conectar tu aplicación con Supabase de forma rápida y automatizada.

---

## 📦 Archivos Creados

### 1️⃣ Configuración
- ✅ `.env.local` - Variables de entorno (COMPLETA TUS CREDENCIALES)
- ✅ `setup-supabase.ps1` - Script automatizado de configuración
- ✅ `SETUP_SUPABASE_RAPIDO.md` - Guía detallada paso a paso

### 2️⃣ Servicios
- ✅ `src/services/supabaseClient.js` - Cliente Supabase (ya existía, singleton)
- ✅ `src/services/supabaseHelpers.js` - Funciones helpers CRUD completas

### 3️⃣ Componentes
- ✅ `src/components/SupabaseConnectionTest.jsx` - Test visual de conexión
- ✅ `src/pages/TestSupabase.jsx` - Página de prueba completa
- ✅ Ruta `/test-supabase` agregada al router
- ✅ Opción en Sidebar agregada

### 4️⃣ Base de Datos
- ✅ `sql/puntadelobos_setup.sql` - Script SQL completo (ya existía)

---

## 🚀 Pasos Rápidos (5 minutos)

### PASO 1: Crear Proyecto en Supabase
```
1. Ve a: https://supabase.com/dashboard
2. Click "New project"
3. Nombre: punta-de-lobos-kpi
4. Selecciona región (recomendado: South America)
5. Crea contraseña de BD (GUÁRDALA)
6. Click "Create new project" (toma ~2 min)
```

### PASO 2: Obtener Credenciales
```
1. En tu proyecto, ve a Settings (⚙️) → API
2. Copia estos 2 valores:
   
   📋 Project URL
   Ejemplo: https://abcdefgh.supabase.co
   
   🔑 anon/public key
   Ejemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### PASO 3: Configurar .env.local
```powershell
# Abre el archivo .env.local y reemplaza:

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co  ← PEGA TU URL AQUÍ
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui            ← PEGA TU KEY AQUÍ
```

### PASO 4: Ejecutar Script Automatizado
```powershell
# En PowerShell, desde la raíz del proyecto:
.\setup-supabase.ps1
```

El script:
- ✅ Verifica que pnpm esté instalado
- ✅ Verifica que .env.local existe
- ✅ Valida las credenciales
- ✅ Instala @supabase/supabase-js (si hace falta)
- ✅ Instala todas las dependencias
- ✅ Te pregunta si quieres iniciar el servidor

### PASO 5: Crear Tablas en Supabase
```
1. En Supabase Dashboard, ve a SQL Editor
2. Click "New query"
3. Copia todo el contenido de: sql/puntadelobos_setup.sql
4. Pega en el editor
5. Click "Run" (▶️)
```

Esto crea:
- ✅ Tabla `personas`
- ✅ Tabla `registros`
- ✅ Tabla `configuracion`
- ✅ Índices optimizados
- ✅ Triggers para updated_at
- ✅ Row Level Security (RLS)
- ✅ Datos de ejemplo

### PASO 6: Probar la Conexión
```powershell
# Si no iniciaste el servidor, hazlo ahora:
pnpm dev
```

```
1. Abre: http://localhost:5173
2. Haz login (admin/puntadelobos2025)
3. En el sidebar, click "Test Supabase"
4. ¡Verás el estado de la conexión!
```

---

## 🎯 Funciones Disponibles

### En `supabaseHelpers.js`:

```javascript
import { 
  checkSupabaseConnection,  // Verificar conexión
  getPersonas,              // Obtener personas con paginación
  createPersona,            // Crear nueva persona
  updatePersona,            // Actualizar persona
  deletePersona,            // Eliminar persona
  searchPersonas,           // Buscar por nombre/RUT
  getRegistros,             // Obtener registros/actividades
  createRegistro,           // Crear registro
  getEstadisticas,          // Obtener estadísticas generales
  getConfiguracion,         // Obtener configuración
  updateConfiguracion,      // Actualizar configuración
  subscribeToTable,         // Real-time subscriptions
  unsubscribe              // Cancelar subscripción
} from '@/services/supabaseHelpers'
```

### Ejemplos de Uso:

```javascript
// Obtener personas
const { data, error, count } = await getPersonas(1, 10)

// Crear persona
const { data, error } = await createPersona({
  nombre: 'Juan Pérez',
  rut: '12345678-9',
  email: 'juan@example.com',
  tipo: 'instructor'
})

// Buscar
const { data, error } = await searchPersonas('Juan')

// Estadísticas
const stats = await getEstadisticas()
console.log('Total personas:', stats.totalPersonas)

// Real-time
const subscription = subscribeToTable('personas', (payload) => {
  console.log('Cambio detectado:', payload)
})
```

---

## 🔍 Verificación

### ✅ Checklist de Configuración

```
□ Proyecto Supabase creado
□ .env.local configurado con credenciales reales
□ Script setup-supabase.ps1 ejecutado sin errores
□ Tablas creadas en Supabase (SQL ejecutado)
□ Servidor de desarrollo corriendo (pnpm dev)
□ Página /test-supabase muestra "✅ Conectado"
□ Puedes crear y buscar personas desde la página de prueba
```

### 🐛 Solución de Problemas

**Error: "Invalid API key"**
```
- Verifica que copiaste la anon key completa
- No debe haber espacios al inicio/final
- Debe empezar con "eyJ"
```

**Error: "Failed to fetch"**
```
- Verifica la URL del proyecto
- Debe incluir https://
- Formato: https://tuproyecto.supabase.co
```

**Error: "relation does not exist"**
```
- Ejecuta el script SQL en Supabase
- Ve a SQL Editor → New query
- Pega el contenido de sql/puntadelobos_setup.sql
- Click Run
```

---

## 📚 Próximos Pasos

### 1️⃣ Migrar Autenticación
Reemplazar el login local por Supabase Auth:
```javascript
// Futuro: Usar Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### 2️⃣ Implementar CRUD en Páginas
- Usa los helpers en `Personas.jsx`, `Registros.jsx`, etc.
- Reemplaza datos estáticos por llamadas a Supabase

### 3️⃣ Habilitar Real-time
```javascript
// Actualización automática cuando cambian datos
subscribeToTable('personas', (payload) => {
  // Actualizar UI automáticamente
})
```

### 4️⃣ Configurar Storage
Para fotos de personas, documentos, etc.:
```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)
```

---

## 🆘 Ayuda

### Documentación
- 📖 `SETUP_SUPABASE_RAPIDO.md` - Guía detallada
- 🔗 [Docs Supabase JS](https://supabase.com/docs/reference/javascript)
- 🔗 [Dashboard Supabase](https://supabase.com/dashboard)

### Logs y Debug
```javascript
// En la consola del navegador (F12):
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')

// Test rápido
import { checkSupabaseConnection } from '@/services/supabaseHelpers'
const status = await checkSupabaseConnection()
console.log(status)
```

---

## ⚡ Comando Único

Si tienes todo configurado, ejecuta esto para verificar todo:

```powershell
# Verificar instalación, credenciales y estado
.\setup-supabase.ps1
```

---

## 🎊 ¡Éxito!

Si al ir a `/test-supabase` ves:
- ✅ Estado: Conectado
- 📊 Estadísticas de la base de datos
- 📝 Puedes crear y buscar personas

**¡La conexión está lista!** 🎉

Ahora puedes empezar a usar Supabase en toda tu aplicación.

---

**Creado con ❤️ usando Context7 y documentación oficial de Supabase**
