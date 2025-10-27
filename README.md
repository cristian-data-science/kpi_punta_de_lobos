# 🌊 Punta de Lobos - Sistema de Gestión de Personas

Sistema moderno y completo de gestión de personas para Punta de Lobos, construido con React, Vite y Supabase.

## ✨ Características

- 🔐 Sistema de autenticación seguro con control de intentos
- 📊 Dashboard con métricas y estadísticas en tiempo real
- 👥 Gestión completa de personas (visitantes, guías, staff, instructores)
- 📝 Registro cronológico de actividades y eventos
- 📅 Calendario de turnos con múltiples vistas (semana, mes, año)
- 💰 Sistema de tarifas por persona
- 📈 Reportes y análisis de datos
- ⚙️ Panel de configuración del sistema
- 📱 Diseño responsive (móvil, tablet, desktop)
- 🎨 UI moderna con TailwindCSS y shadcn/ui
- 🗄️ Base de datos PostgreSQL en Supabase

## 📚 Documentación

- 📘 **[Manual de Usuario](./docs/MANUAL_USUARIO.md)** - Guía completa para usuarios finales
- 🔧 **[Documentación Técnica](./docs/README.md)** - Documentación para desarrolladores
- 📅 **[Changelog](./docs/changelogs/)** - Historial de cambios
- 🛠️ **[Documentación de Desarrollo](./docs/development/)** - Guías técnicas detalladas
- 👤 **[Guías de Usuario](./docs/user-guides/)** - Tutoriales y guías paso a paso

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.1.0** - Framework principal
- **Vite 6.3.5** - Build tool y dev server
- **React Router DOM 7.6.1** - Navegación

### Styling & UI
- **Tailwind CSS 4.1.7** - Framework de estilos
- **Radix UI** - Componentes accesibles
- **shadcn/ui** - Sistema de componentes
- **Lucide React** - Iconografía
- **Framer Motion 12.15.0** - Animaciones

### Visualización de Datos
- **ECharts 5.6.0** - Gráficos avanzados
- **Recharts 2.15.3** - Gráficos React
- **ExcelJS** - Exportación a Excel con estilos

### Backend & Base de Datos
- **Supabase** - PostgreSQL con autenticación y APIs
- **@supabase/supabase-js 2.57.2** - Cliente oficial

### Desarrollo
- **ESLint 9.25.0** - Linting
- **pnpm 9.15.2** - Package manager

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0
- Cuenta en [Supabase](https://supabase.com) (gratuita)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd kpi
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y completa con tus credenciales:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales reales:

```env
# 🔗 Credenciales Supabase (obtener desde Dashboard)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# 🔐 Credenciales de Login Admin
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=tu_password_seguro

# 📱 Configuración de Aplicación
VITE_APP_NAME=Punta de Lobos
VITE_APP_VERSION=1.0.0
NODE_ENV=development
```

**⚠️ IMPORTANTE**: 
- NUNCA subas `.env.local` al repositorio Git
- Cambia las credenciales por defecto por seguridad
- Obtén tus credenciales de Supabase desde: Dashboard > Settings > API

### 4. Configurar Base de Datos en Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** en el dashboard
3. Ejecuta el script completo de `sql/puntadelobos_setup.sql`

También puedes usar el script automatizado:

```bash
# PowerShell (Windows)
.\scripts\setup-supabase.ps1

# Bash (Linux/Mac)
bash scripts/build.sh
```

### 5. Iniciar servidor de desarrollo

```bash
pnpm dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 📁 Estructura del Proyecto

```
kpi/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes UI (shadcn/ui)
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── Layout.jsx
│   ├── contexts/            # Contextos de React
│   │   └── AuthContext.jsx
│   ├── pages/              # Páginas de la aplicación
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Personas.jsx
│   │   ├── Calendario.jsx
│   │   └── ...
│   ├── services/           # Servicios y API
│   │   └── supabaseClient.js
│   ├── config/             # Configuraciones
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilidades
│   └── utils/              # Funciones auxiliares
├── config/                 # Archivos de configuración
│   ├── components.json     # Config de shadcn/ui
│   ├── mcp.example.json    # Ejemplo de configuración MCP
│   └── vercel.json         # Config de Vercel
├── docs/                   # Documentación
│   ├── development/        # Docs de desarrollo
│   ├── user-guides/        # Guías de usuario
│   ├── changelogs/         # Historial de cambios
│   └── fixes/              # Documentación de fixes
├── scripts/                # Scripts de utilidades
│   ├── setup-supabase.ps1  # Setup automatizado (Windows)
│   └── build.sh            # Script de build (Linux/Mac)
├── sql/                    # Scripts SQL
│   └── puntadelobos_setup.sql
├── public/                 # Assets estáticos
├── .env.example            # Plantilla de variables de entorno
├── .env.local              # Variables de entorno (NO SUBIR A GIT)
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## 🔒 Seguridad

Este proyecto sigue las mejores prácticas de seguridad:

- ✅ Credenciales SIEMPRE en variables de entorno
- ✅ `.env.local` excluido del repositorio
- ✅ Sin contraseñas hardcodeadas en el código
- ✅ Control de intentos de login
- ✅ Validación de inputs en frontend y backend
- ✅ Row Level Security (RLS) habilitado en Supabase

### ⚠️ Checklist de Seguridad

Antes de hacer push a un repositorio público:

- [ ] Verificar que `.env.local` NO está en Git: `git ls-files .env.local` (debe estar vacío)
- [ ] Verificar que `mcp.json` NO está en Git: `git ls-files mcp.json` (debe estar vacío)
- [ ] Buscar credenciales hardcodeadas: `grep -r "eyJ" src/` (no debe haber JWTs)
- [ ] Verificar que `.gitignore` incluye todos los archivos sensibles
- [ ] Cambiar contraseñas por defecto en `.env.local`

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel Dashboard
3. Deploy automático en cada push

### Build para producción

```bash
pnpm build
pnpm preview  # Vista previa del build
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build para producción
pnpm preview      # Vista previa del build
pnpm lint         # Ejecutar ESLint
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

Agradecemos profundamente al **equipo de Patagonia Chile** por permitirnos hacer esta contribución a la fundación Parque Punta de Lobos, apoyando la gestión sostenible y el cuidado de este invaluable patrimonio natural.

### Tecnologías

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

Desarrollado con ❤️ para Punta de Lobos
