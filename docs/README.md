# 🌊 Punta de Lobos - Sistema de Gestión de Personas

Template limpio y funcional para gestión de personas, basado en la arquitectura de TransApp.

## 📋 Estructura del Template

Este proyecto es un template completo con:
- ✅ Sistema de autenticación funcional
- ✅ Layout responsive con sidebar colapsable
- ✅ Conexión a Supabase configurada
- ✅ Componentes UI modernos (shadcn/ui + TailwindCSS)
- ✅ 5 páginas base listas para desarrollo
- ✅ Estructura SQL definida

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite 6
- **Router**: React Router 7
- **UI**: TailwindCSS 4 + shadcn/ui (Radix UI)
- **Backend**: Supabase (PostgreSQL)
- **Iconos**: Lucide React
- **Gestor de paquetes**: pnpm

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── Header.jsx       # Cabecera con logo y logout
│   ├── Sidebar.jsx      # Menú lateral
│   └── Layout.jsx       # Layout principal
├── contexts/
│   └── AuthContext.jsx  # Contexto de autenticación
├── pages/
│   ├── Login.jsx        # Página de login
│   ├── Dashboard.jsx    # Panel principal
│   ├── Personas.jsx     # Gestión de personas
│   ├── Registros.jsx    # Historial de actividades
│   ├── Reportes.jsx     # Análisis y estadísticas
│   └── Configuracion.jsx # Ajustes del sistema
├── services/
│   ├── supabaseClient.js    # Cliente Supabase
│   └── persistentStorage.js # Wrapper localStorage
├── lib/
│   └── utils.js         # Utilidades generales
└── App.jsx              # Router y rutas
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### `personas`
- Gestión de personas (visitantes, guías, staff, instructores)
- Campos: nombre, rut, email, telefono, tipo, estado, notas

#### `registros`
- Historial de actividades y eventos
- Campos: persona_id, fecha, tipo_actividad, descripcion, duracion_minutos

#### `configuracion`
- Ajustes del sistema
- Campos: clave, valor, tipo, descripcion

## 🚀 Configuración Inicial

### 1. Clonar y configurar proyecto

```bash
# Instalar dependencias
pnpm install

# Copiar archivo de environment
cp .env.example .env.local
```

### 2. Configurar Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Copiar URL y API Key a `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=tu_password_seguro
```

### 3. Crear tablas en Supabase

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Ejecutar el contenido de `sql/puntadelobos_setup.sql`
3. Verificar que las tablas se crearon correctamente

### 4. Ejecutar proyecto

```bash
# Modo desarrollo
pnpm dev

# Build para producción
pnpm build

# Preview de producción
pnpm preview
```

## 🔐 Sistema de Autenticación

El template incluye un sistema de login simple con:
- Control de intentos fallidos (configurable)
- Bloqueo temporal por seguridad
- Sesión persistente en localStorage
- Credenciales configurables via `.env`

**Configuración en** `src/config/loginConfig.js`:
```javascript
export const LOGIN_CONFIG = {
  loginAttemptsEnabled: true,  // Activar límite de intentos
  maxLoginAttempts: 3,         // Intentos máximos
  lockoutDuration: 15,         // Minutos de bloqueo
  resetAttemptsOnSuccess: true,
  showAttemptsRemaining: true
}
```

## 📱 Páginas Disponibles

### Dashboard (`/`)
Panel principal con métricas y resumen del sistema.

### Personas (`/personas`)
Gestión completa de personas registradas en el sistema.

### Registros (`/registros`)
Historial cronológico de actividades y eventos.

### Reportes (`/reportes`)
Análisis estadísticos y visualizaciones de datos.

### Configuración (`/configuracion`)
Ajustes del sistema y preferencias.

## 🎨 Personalización

### Cambiar branding

**Header** (`src/components/Header.jsx`):
```jsx
<h1>Punta de Lobos</h1>
<p>Sistema de Gestión de Personas</p>
```

**Sidebar** (`src/components/Sidebar.jsx`):
Modificar array `menuItems` para cambiar opciones del menú.

### Agregar nuevas páginas

1. Crear componente en `src/pages/TuPagina.jsx`
2. Agregar ruta en `src/App.jsx`:
```jsx
<Route path="tu-pagina" element={<TuPagina />} />
```
3. Agregar item en Sidebar (`src/components/Sidebar.jsx`)

## 📦 Dependencias Principales

```json
{
  "@supabase/supabase-js": "^2.57.2",
  "react": "^19.1.0",
  "react-router-dom": "^7.6.1",
  "tailwindcss": "^4.1.7",
  "@radix-ui/*": "Componentes UI",
  "lucide-react": "^0.510.0"
}
```

## 🔧 Scripts Disponibles

```bash
pnpm dev          # Servidor desarrollo (puerto 5173)
pnpm build        # Build para producción
pnpm preview      # Preview de build
pnpm lint         # Linter de código
```

## 📝 Próximos Pasos

1. ✅ Configurar conexión Supabase
2. ✅ Ejecutar SQL de estructura
3. 🔲 Implementar CRUD de personas
4. 🔲 Desarrollar sistema de registros
5. 🔲 Crear visualizaciones en reportes
6. 🔲 Personalizar estilos según necesidades
7. 🔲 Agregar validaciones de formularios
8. 🔲 Implementar búsquedas y filtros

## 🤝 Contribuir

Este es un template base. Siéntete libre de:
- Agregar nuevas funcionalidades
- Mejorar componentes existentes
- Adaptar a casos de uso específicos
- Compartir mejoras

## 📄 Licencia

Template de código abierto basado en TransApp.

---

**Creado con ❤️ para Punta de Lobos** 🌊
