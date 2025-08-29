# TransApp - Sistema de Gestión de Transporte

<div align="center">

![TransApp](https://img.shields.io/badge/TransApp-Sistema%20de%20Gestión-blue)
![React](https://img.shields.io/badge/React-19.1.0-61dafb)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646cff)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.7-38bdf8)

Sistema de gestión integral para empresas de transporte y logística. Permite administrar trabajadores, vehículos, rutas y pagos de manera eficiente con exportación a Excel.

[Demo en Vivo](https://transapp-demo.vercel.app) • [Documentación](./DEVELOPMENT.md) • [Reportar Bug](../../issues)

</div>

## 🚛 Características Principales

### 📊 Dashboard Inteligente
- Panel de control con métricas en tiempo real
- Gráficos interactivos de rendimiento
- Indicadores KPI principales

### 👥 Gestión de Personal
- Registro completo de trabajadores
- Control de turnos y horarios
- Cálculo automático de pagos

### 🚗 Control de Flota
- Administración de vehículos
- Seguimiento de mantenimientos
- Historial de servicios

### 🗺️ Gestión de Rutas
- Planificación inteligente de rutas
- Asignación de vehículos y conductores
- Optimización de recorridos

### 💰 Sistema de Pagos
- Cálculo automático de remuneraciones
- Tarifas diferenciadas (días normales, feriados, domingos)
- **Exportación a Excel con estilos profesionales**
- Reportes detallados por trabajador

### 📁 Importación de Datos
- Carga masiva via CSV/Excel
- Validación automática de datos
- Procesamiento de planillas de turnos

## 🛠️ Tecnologías Utilizadas

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

### Desarrollo
- **ESLint 9.25.0** - Linting
- **Terser 5.43.1** - Minificación
- **pnpm 9.15.2** - Package manager

## 📦 Instalación y Desarrollo

### Prerrequisitos

```bash
Node.js >= 18.0.0
pnpm >= 9.0.0
```

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/transapp.git
cd transapp

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Abrir en http://localhost:5173
```

### Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm preview      # Preview del build
pnpm lint         # Verificar código
pnpm build:vercel # Build para Vercel
```

## 🚀 Despliegue en Vercel

### Configuración Automática

1. **Fork/Clone** este repositorio
2. **Conecta con Vercel**: Ve a [vercel.com](https://vercel.com) y conecta tu repositorio
3. **Deploy automático**: Vercel detectará automáticamente la configuración

### Configuración Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy desde terminal
vercel

# Deploy de producción
vercel --prod
```

### Variables de Entorno

El proyecto utiliza localStorage para persistencia de datos. No requiere variables de entorno adicionales.

## 🏗️ Estructura del Proyecto

```
transapp/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/        # Componentes reutilizables
│   │   └── ui/           # Componentes base (shadcn/ui)
│   ├── contexts/         # Contextos de React
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilidades y configuración
│   ├── pages/            # Páginas de la aplicación
│   ├── services/         # Servicios de datos
│   └── utils/            # Funciones de utilidad
├── .gitignore
├── package.json
├── README.md
├── tailwind.config.js
└── vite.config.js
```

## 💡 Características Técnicas

### Sistema de Datos
- **Persistencia**: localStorage con prefijo `transapp_`
- **Gestión centralizada**: MasterDataService singleton
- **Validación**: Esquemas de validación para CSV

### Rendimiento
- **Code splitting**: Chunks optimizados
- **Lazy loading**: Carga bajo demanda
- **Minificación**: Terser para producción

### Accesibilidad
- **Radix UI**: Componentes accesibles por defecto
- **Navegación**: Soporte completo de teclado
- **Semántica**: HTML semántico correcto

## 📈 Características del Sistema de Pagos

### Cálculo Automático
- **Turnos normales**: $20.000 (1ro y 2do turno)
- **Tercer turno**: $22.500 (días de semana)
- **Sábados**: $27.500 (tercer turno)
- **Domingos**: $35.000 (todos los turnos)
- **Feriados**: Tarifa especial según configuración

### Exportación Excel
- **Estilos profesionales**: Colores y formatos elegantes
- **Resumen por trabajador**: Total turnos y montos
- **Detalle completo**: Cada turno con fecha y tarifa
- **Resumen general**: Estadísticas globales

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- 📧 **Email**: soporte@transapp.com
- 🐛 **Issues**: [GitHub Issues](../../issues)
- 📚 **Documentación**: [Development Guide](./DEVELOPMENT.md)

---

<div align="center">

**Desarrollado con ❤️ para optimizar la gestión de transporte**

</div>

## 🔑 Credenciales por Defecto

- **Usuario**: admin
- **Contraseña**: transapp123

## 🚀 Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye la aplicación para producción
- `pnpm preview` - Previsualiza la construcción de producción
- `pnpm lint` - Ejecuta el linter ESLint

## 📁 Estructura del Proyecto

```
transapp/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── ui/           # Componentes UI base
│   │   ├── Header.jsx    # Cabecera de la aplicación
│   │   ├── Sidebar.jsx   # Barra lateral de navegación
│   │   └── Layout.jsx    # Layout principal
│   ├── contexts/         # Contextos de React
│   │   └── AuthContext.jsx
│   ├── hooks/           # Hooks personalizados
│   ├── lib/             # Utilidades y configuraciones
│   ├── pages/           # Páginas de la aplicación
│   │   ├── Dashboard.jsx
│   │   ├── Workers.jsx
│   │   ├── Vehicles.jsx
│   │   ├── Routes.jsx
│   │   ├── Payments.jsx
│   │   ├── UploadFiles.jsx
│   │   ├── Settings.jsx
│   │   └── Login.jsx
│   ├── services/        # Servicios y APIs
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
