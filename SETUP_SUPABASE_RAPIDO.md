# 🚀 Configuración Rápida de Supabase

## ⚡ Pasos Rápidos (5 minutos)

### 1️⃣ Crear Proyecto en Supabase
1. Ve a https://supabase.com/dashboard
2. Click en **"New project"**
3. Nombre: `punta-de-lobos-kpi`
4. Database Password: Guarda esta contraseña ⚠️
5. Region: Selecciona la más cercana (recomendado: South America)
6. Click en **"Create new project"** (toma ~2 minutos)

### 2️⃣ Obtener Credenciales
1. Una vez creado el proyecto, ve a **Settings** (⚙️) > **API**
2. Copia estos valores:
   - **Project URL** → Ejemplo: `https://abcdefgh.supabase.co`
   - **anon/public key** → Una clave larga que empieza con `eyJ...`

### 3️⃣ Configurar Variables de Entorno
1. Abre el archivo `.env.local` en la raíz del proyecto
2. Reemplaza estos valores:
   ```bash
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co  # ← Pega tu Project URL
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui           # ← Pega tu anon key
   ```

### 4️⃣ Crear Tablas en la Base de Datos
1. En Supabase Dashboard, ve a **SQL Editor**
2. Click en **"New query"**
3. Copia y pega el contenido del archivo `sql/puntadelobos_setup.sql`
4. Click en **"Run"** (▶️)

### 5️⃣ Verificar Conexión
```powershell
# Instalar dependencias (si aún no lo has hecho)
pnpm install

# Iniciar el servidor de desarrollo
pnpm dev
```

## 🎯 Verificación Rápida

### Probar la Conexión
Abre la consola del navegador (F12) y ejecuta:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('¿Conectado?', import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌')
```

### Probar una Query
```javascript
import { getSupabaseClient } from '@/services/supabaseClient'

const supabase = getSupabaseClient()
const { data, error } = await supabase.from('personas').select('*').limit(1)
console.log('Datos:', data, 'Error:', error)
```

## 📋 Tablas Principales

El script SQL crea estas tablas automáticamente:
- ✅ `personas` - Información de personas/trabajadores
- ✅ `registros` - Control de entradas/salidas
- ✅ `turnos` - Gestión de turnos
- ✅ `cobros` - Registro de cobros/pagos
- ✅ `configuracion` - Configuración general del sistema

## 🔒 Seguridad (Row Level Security)

El script incluye políticas RLS básicas. Para producción:
1. Ve a **Authentication** > **Policies**
2. Revisa las políticas de cada tabla
3. Ajusta según tus necesidades de seguridad

## 🆘 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste la **anon key** completa
- Asegúrate de que no haya espacios al inicio/final

### Error: "Failed to fetch"
- Verifica la **Project URL**
- Asegúrate de que incluye `https://`

### Error: "relation does not exist"
- Ejecuta el script SQL en el SQL Editor
- Verifica que todas las tablas se crearon

## 📚 Próximos Pasos

1. **Migrar Autenticación**: Cambiar de login local a Supabase Auth
2. **Implementar CRUD**: Crear, leer, actualizar y eliminar registros
3. **Real-time**: Habilitar actualizaciones en tiempo real
4. **Storage**: Configurar almacenamiento de archivos (fotos, documentos)

## 🔗 Enlaces Útiles

- [Dashboard Supabase](https://supabase.com/dashboard)
- [Documentación Supabase JS](https://supabase.com/docs/reference/javascript)
- [SQL Editor](https://supabase.com/dashboard/project/_/sql)
- [API Docs](https://supabase.com/dashboard/project/_/api)

---

¿Necesitas ayuda? Revisa los logs en la consola del navegador (F12) 🔍
