# 🌊 Punta de Lobos - Sistema de Gestión de Personas# TransApp - Sistema de Gestión de Transporte



Sistema moderno y completo de gestión de personas para Punta de Lobos, construido con React, Vite y Supabase.<div align="center">



## ✨ Características![TransApp](https://img.shields.io/badge/TransApp-Sistema%20de%20Gestión-blue)

![React](https://img.shields.io/badge/React-19.1.0-61dafb)

- 🔐 Sistema de autenticación seguro con control de intentos![Vite](https://img.shields.io/badge/Vite-6.3.5-646cff)

- 📊 Dashboard con métricas y estadísticas en tiempo real![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.7-38bdf8)

- 👥 Gestión completa de personas (visitantes, guías, staff, instructores)

- 📝 Registro cronológico de actividades y eventosSistema de gestión integral para empresas de transporte y logística. Permite administrar trabajadores, vehículos, rutas y pagos de manera eficiente con exportación a Excel.

- 📈 Reportes y análisis de datos

- ⚙️ Panel de configuración del sistema[Demo en Vivo](https://transapp-demo.vercel.app) • [Documentación](./DEVELOPMENT.md) • [Reportar Bug](../../issues)

- 📱 Diseño responsive (móvil, tablet, desktop)

- 🎨 UI moderna con TailwindCSS y shadcn/ui</div>

- 🗄️ Base de datos PostgreSQL en Supabase

## 🚛 Características Principales

## 🛠️ Stack Tecnológico

### 📊 Dashboard Inteligente

- **Frontend**: React 19 + Vite 6- Panel de control con métricas en tiempo real

- **Router**: React Router 7- Gráficos interactivos de rendimiento

- **UI**: TailwindCSS 4 + shadcn/ui (Radix UI)- Indicadores KPI principales

- **Backend**: Supabase (PostgreSQL)

- **Iconos**: Lucide React### 👥 Gestión de Personal

- **Gestor**: pnpm- Registro completo de trabajadores

- Control de turnos y horarios

## 📋 Requisitos Previos- Cálculo automático de pagos



- Node.js >= 18.0.0### 🚗 Control de Flota

- pnpm >= 9.0.0- Administración de vehículos

- Cuenta en Supabase (gratuita)- Seguimiento de mantenimientos

- Historial de servicios

## 🚀 Instalación

### 🗺️ Gestión de Rutas

### 1. Clonar el repositorio- Planificación inteligente de rutas

- Asignación de vehículos y conductores

```bash- Optimización de recorridos

git clone https://github.com/cristian-data-science/transapp.git

cd transapp### 💰 Sistema de Pagos

```- Cálculo automático de remuneraciones

- Tarifas diferenciadas (días normales, feriados, domingos)

### 2. Instalar dependencias- **Exportación a Excel con estilos profesionales**

- Reportes detallados por trabajador

```bash

pnpm install### 📁 Importación de Datos

```- Carga masiva via CSV/Excel

- Validación automática de datos

### 3. Configurar variables de entorno- Procesamiento de planillas de turnos



```bash## 🛠️ Tecnologías Utilizadas

# Copiar archivo de ejemplo

cp .env.example .env.local### Frontend

- **React 19.1.0** - Framework principal

# Editar .env.local con tus credenciales de Supabase- **Vite 6.3.5** - Build tool y dev server

```- **React Router DOM 7.6.1** - Navegación



Contenido de `.env.local`:### Styling & UI

- **Tailwind CSS 4.1.7** - Framework de estilos

```env- **Radix UI** - Componentes accesibles

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co- **shadcn/ui** - Sistema de componentes

VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase- **Lucide React** - Iconografía

VITE_ADMIN_USERNAME=admin- **Framer Motion 12.15.0** - Animaciones

VITE_ADMIN_PASSWORD=tu_password_seguro

```### Visualización de Datos

- **ECharts 5.6.0** - Gráficos avanzados

### 4. Configurar Base de Datos en Supabase- **Recharts 2.15.3** - Gráficos React

- **ExcelJS** - Exportación a Excel con estilos

1. Crear proyecto en [Supabase](https://supabase.com)

2. Ir a **SQL Editor** en el dashboard### Desarrollo

3. Ejecutar el script completo de `sql/puntadelobos_setup.sql`- **ESLint 9.25.0** - Linting

4. Verificar que las tablas se crearon correctamente- **Terser 5.43.1** - Minificación

- **pnpm 9.15.2** - Package manager

### 5. Ejecutar en desarrollo

## 📦 Instalación y Desarrollo

```bash

pnpm dev### Prerrequisitos

```

```bash

La aplicación estará disponible en `http://localhost:5173`Node.js >= 18.0.0

pnpm >= 9.0.0

## 📁 Estructura del Proyecto```



```### Instalación Local

transapp/

├── src/```bash

│   ├── components/          # Componentes reutilizables# Clonar el repositorio

│   │   ├── ui/             # Componentes UI (shadcn/ui)git clone https://github.com/tu-usuario/transapp.git

│   │   ├── Header.jsx      # Cabecera principalcd transapp

│   │   ├── Sidebar.jsx     # Menú lateral

│   │   └── Layout.jsx      # Layout principal# Instalar dependencias

│   ├── contexts/pnpm install

│   │   └── AuthContext.jsx # Contexto de autenticación

│   ├── pages/              # Páginas de la aplicación# Iniciar servidor de desarrollo

│   │   ├── Login.jsx       # Página de loginpnpm dev

│   │   ├── Dashboard.jsx   # Panel principal

│   │   ├── Personas.jsx    # Gestión de personas# Abrir en http://localhost:5173

│   │   ├── Registros.jsx   # Historial de actividades```

│   │   ├── Reportes.jsx    # Análisis y estadísticas

│   │   └── Configuracion.jsx # Ajustes del sistema### Scripts Disponibles

│   ├── services/           # Servicios de datos

│   │   ├── supabaseClient.js    # Cliente Supabase```bash

│   │   └── persistentStorage.js # LocalStorage wrapperpnpm dev          # Servidor de desarrollo

│   ├── lib/pnpm build        # Build de producción

│   │   └── utils.js        # Utilidades generalespnpm preview      # Preview del build

│   ├── App.jsx             # Componente principalpnpm lint         # Verificar código

│   └── main.jsx            # Punto de entradapnpm build:vercel # Build para Vercel

├── sql/```

│   └── puntadelobos_setup.sql  # Script SQL para Supabase

├── docs/## 🚀 Despliegue en Vercel

│   └── README.md           # Documentación del template

├── package.json### Configuración Automática

├── vite.config.js

└── .env.example1. **Fork/Clone** este repositorio

```2. **Conecta con Vercel**: Ve a [vercel.com](https://vercel.com) y conecta tu repositorio

3. **Deploy automático**: Vercel detectará automáticamente la configuración

## 🔐 Credenciales por Defecto

### Configuración Manual

**Usuario**: admin  

**Contraseña**: (definida en `.env.local`)```bash

# Instalar Vercel CLI

⚠️ **Importante**: Cambia estas credenciales en producción.npm i -g vercel



## 📊 Base de Datos# Deploy desde terminal

vercel

### Tablas Principales

# Deploy de producción

#### `personas`vercel --prod

Gestión de personas registradas:```

- nombre, rut, email, telefono

- tipo: visitante, guia, staff, instructor, otro### Variables de Entorno

- estado: activo, inactivo

- notas, timestampsEl proyecto utiliza localStorage para persistencia de datos. No requiere variables de entorno adicionales.



#### `registros`## 🏗️ Estructura del Proyecto

Historial de actividades:

- persona_id (foreign key)```

- fecha, tipo_actividadtransapp/

- descripcion, duracion_minutos├── public/                 # Archivos estáticos

- notas, timestamps├── src/

│   ├── components/        # Componentes reutilizables

#### `configuracion`│   │   └── ui/           # Componentes base (shadcn/ui)

Ajustes del sistema:│   ├── contexts/         # Contextos de React

- clave (única), valor, tipo│   ├── hooks/            # Custom hooks

- descripcion, timestamps│   ├── lib/              # Utilidades y configuración

│   ├── pages/            # Páginas de la aplicación

## 🎯 Funcionalidades Principales│   ├── services/         # Servicios de datos

│   └── utils/            # Funciones de utilidad

### Dashboard├── .gitignore

- Métricas generales del sistema├── package.json

- Resumen de actividades├── README.md

- Estadísticas en tiempo real├── tailwind.config.js

└── vite.config.js

### Personas```

- Agregar, editar, eliminar personas

- Búsqueda y filtros avanzados## 💡 Características Técnicas

- Categorización por tipo (visitante, guía, staff, etc.)

### Sistema de Datos

### Registros- **Persistencia**: localStorage con prefijo `transapp_`

- Crear registros de actividades- **Gestión centralizada**: MasterDataService singleton

- Historial cronológico- **Validación**: Esquemas de validación para CSV

- Asociación con personas

### Rendimiento

### Reportes- **Code splitting**: Chunks optimizados

- Visualizaciones y gráficos- **Lazy loading**: Carga bajo demanda

- Análisis de tendencias- **Minificación**: Terser para producción

- Exportación de datos

### Accesibilidad

### Configuración- **Radix UI**: Componentes accesibles por defecto

- Ajustes del sistema- **Navegación**: Soporte completo de teclado

- Gestión de usuarios- **Semántica**: HTML semántico correcto

- Personalización

## 📈 Características del Sistema de Pagos

## 🔧 Scripts Disponibles

### Cálculo Automático

```bash- **Turnos normales**: $20.000 (1ro y 2do turno)

pnpm dev          # Servidor de desarrollo- **Tercer turno**: $22.500 (días de semana)

pnpm build        # Build para producción- **Sábados**: $27.500 (tercer turno)

pnpm preview      # Preview del build- **Domingos**: $35.000 (todos los turnos)

pnpm lint         # Linter de código- **Feriados**: Tarifa especial según configuración

```

### Exportación Excel

## 🎨 Personalización- **Estilos profesionales**: Colores y formatos elegantes

- **Resumen por trabajador**: Total turnos y montos

### Cambiar colores del tema- **Detalle completo**: Cada turno con fecha y tarifa

- **Resumen general**: Estadísticas globales

Editar `tailwind.config.js` y los gradientes en:

- `src/components/Header.jsx`## 🤝 Contribución

- `src/components/Sidebar.jsx`

- `src/App.jsx`1. Fork el proyecto

2. Crea una rama feature (`git checkout -b feature/nueva-caracteristica`)

### Agregar nuevas páginas3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)

4. Push a la rama (`git push origin feature/nueva-caracteristica`)

1. Crear componente en `src/pages/`5. Abre un Pull Request

2. Agregar ruta en `src/App.jsx`

3. Agregar item en `src/components/Sidebar.jsx`## 📄 Licencia



## 🚀 DespliegueEste proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.



### Vercel (Recomendado)## 🆘 Soporte



1. Conectar repositorio en Vercel- 📧 **Email**: soporte@transapp.com

2. Configurar variables de entorno- 🐛 **Issues**: [GitHub Issues](../../issues)

3. Deploy automático- 📚 **Documentación**: [Development Guide](./DEVELOPMENT.md)



### Otros Proveedores---



Compatible con:<div align="center">

- Netlify

- Railway**Desarrollado con ❤️ para optimizar la gestión de transporte**

- Render

- Cualquier hosting que soporte React + Vite</div>



## 📦 Dependencias Principales## 🔑 Credenciales por Defecto



```json- **Usuario**: admin

{- **Contraseña**: transapp123

  "@supabase/supabase-js": "^2.57.2",

  "react": "^19.1.0",## 🚀 Scripts Disponibles

  "react-router-dom": "^7.6.1",

  "tailwindcss": "^4.1.7",- `pnpm dev` - Inicia el servidor de desarrollo

  "lucide-react": "^0.510.0"- `pnpm build` - Construye la aplicación para producción

}- `pnpm preview` - Previsualiza la construcción de producción

```- `pnpm lint` - Ejecuta el linter ESLint



## 🤝 Contribuir## 📁 Estructura del Proyecto



Las contribuciones son bienvenidas:```

transapp/

1. Fork el proyecto├── public/                 # Archivos estáticos

2. Crea una rama (`git checkout -b feature/AmazingFeature`)├── src/

3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)│   ├── components/        # Componentes reutilizables

4. Push a la rama (`git push origin feature/AmazingFeature`)│   │   ├── ui/           # Componentes UI base

5. Abre un Pull Request│   │   ├── Header.jsx    # Cabecera de la aplicación

│   │   ├── Sidebar.jsx   # Barra lateral de navegación

## 📝 Licencia│   │   └── Layout.jsx    # Layout principal

│   ├── contexts/         # Contextos de React

Proyecto de código abierto.│   │   └── AuthContext.jsx

│   ├── hooks/           # Hooks personalizados

## 🆘 Soporte│   ├── lib/             # Utilidades y configuraciones

│   ├── pages/           # Páginas de la aplicación

Para soporte y preguntas:│   │   ├── Dashboard.jsx

- Crear un issue en GitHub│   │   ├── Workers.jsx

- Contactar al equipo de desarrollo│   │   ├── Vehicles.jsx

│   │   ├── Routes.jsx

---│   │   ├── Payments.jsx

│   │   ├── UploadFiles.jsx

**Hecho con ❤️ para Punta de Lobos** 🌊│   │   ├── Settings.jsx

│   │   └── Login.jsx

Template base creado desde TransApp│   ├── services/        # Servicios y APIs

│   │   ├── masterDataService.js
│   │   └── persistentStorage.js
│   ├── utils/           # Funciones utilitarias
│   │   └── csvUtils.js
│   ├── App.jsx          # Componente principal
│   └── main.jsx         # Punto de entrada
├── package.json
├── vite.config.js
└── README.md
```

## 📋 Funcionalidades por Módulo

### Dashboard
- Resumen de estadísticas principales
- Actividad reciente del sistema
- Estado de la flota en tiempo real
- Notificaciones y alertas

### Trabajadores
- Registro de personal
- Gestión de información personal
- Control de cargos y roles
- Historial laboral

### Vehículos
- Inventario de la flota
- Control de mantenimientos
- Asignación de conductores
- Seguimiento de estado

### Rutas
- Planificación de rutas
- Asignación de vehículos y conductores
- Cálculo de distancias y tiempos
- Seguimiento en tiempo real

### Pagos
- Gestión de remuneraciones
- Control de pagos pendientes
- Historial de transacciones
- Reportes financieros

### Carga de Archivos
- Importación de datos CSV/Excel
- Validación automática de formatos
- Procesamiento por lotes
- Reportes de errores

## 💾 Almacenamiento de Datos

El sistema utiliza LocalStorage para persistir los datos localmente. Los datos se organizan en las siguientes colecciones:

- `transapp_workers` - Información de trabajadores
- `transapp_vehicles` - Datos de vehículos
- `transapp_routes` - Configuración de rutas
- `transapp_payments` - Registros de pagos
- `transapp_auth` - Estado de autenticación

## 🔧 Configuración

### Variables de Entorno

No se requieren variables de entorno adicionales para el funcionamiento básico.

### Personalización de Tema

El sistema utiliza Tailwind CSS con un sistema de variables CSS para el tema. Puedes personalizar los colores editando el archivo `src/App.css`.

## 📄 Formatos de Importación

### Trabajadores (CSV)
```csv
nombre,rut,cargo,telefono,fecha_ingreso
Juan Pérez,12.345.678-9,Conductor,+56912345678,2023-01-15
```

### Vehículos (CSV)
```csv
patente,marca,modelo,año,estado,conductor
ABC-123,Volvo,FH16,2020,Operativo,Juan Pérez
```

### Rutas (CSV)
```csv
codigo,nombre,origen,destino,distancia,tiempo_estimado
RT-001,Santiago-Valparaíso,Santiago Centro,Puerto Valparaíso,120 km,2h 30min
```

## 🔐 Seguridad

- Autenticación basada en credenciales
- Almacenamiento local encriptado
- Cierre automático de sesión por inactividad
- Validación de datos de entrada

## 🆘 Soporte

Para obtener ayuda o reportar problemas:

1. Revisa la documentación
2. Consulta los logs del navegador (F12)
3. Verifica la conectividad
4. Contacta al administrador del sistema

## 📈 Próximas Mejoras

- [ ] Integración con APIs externas
- [ ] Reportes avanzados con gráficos
- [ ] Notificaciones push
- [ ] Aplicación móvil
- [ ] Sincronización en tiempo real
- [ ] Backup automático en la nube

## 📜 Licencia

Este proyecto es de uso interno para la empresa de transporte.

---

**TransApp** - Sistema de Gestión de Transporte v1.0.0
