# TransApp - Guía de Desarrollo

## 🚀 Primeros Pasos

### 1. Instalación del Proyecto

```bash
# Navegar al directorio del proyecto
cd transapp

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

### 2. Estructura del Proyecto

La aplicación sigue una arquitectura modular basada en componentes de React:

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes UI básicos (shadcn/ui)
│   ├── Header.jsx      # Cabecera principal
│   ├── Sidebar.jsx     # Navegación lateral
│   └── Layout.jsx      # Layout principal
├── contexts/           # Contextos de React
├── hooks/              # Hooks personalizados
├── pages/              # Páginas principales de la aplicación
├── services/           # Lógica de negocio y servicios
├── utils/              # Funciones utilitarias
└── lib/                # Configuraciones y utilidades
```

### 3. Tecnologías Clave

- **React 19**: Framework principal
- **Vite**: Build tool y servidor de desarrollo
- **Tailwind CSS**: Framework de estilos
- **Radix UI**: Componentes primitivos accesibles
- **React Router**: Manejo de rutas
- **Lucide React**: Iconografía

### 4. Patrones de Desarrollo

#### Componentes
- Usar componentes funcionales con hooks
- Separar lógica de presentación
- Implementar PropTypes o TypeScript para tipado

#### Estado
- LocalStorage para persistencia
- Context API para estado global
- useState/useEffect para estado local

#### Estilos
- Tailwind CSS para estilos utilitarios
- Componentes Radix UI para funcionalidad base
- Variables CSS para temas personalizables

## 📋 Tareas de Desarrollo Comunes

### Agregar una Nueva Página

1. Crear el archivo en `src/pages/NuevaPagina.jsx`
2. Implementar el componente
3. Agregar la ruta en `src/App.jsx`
4. Agregar el enlace en `src/components/Sidebar.jsx`

### Crear un Nuevo Componente UI

1. Crear archivo en `src/components/ui/componente.jsx`
2. Usar la estructura base de shadcn/ui
3. Exportar el componente
4. Documentar props y uso

### Agregar Nueva Funcionalidad de Datos

1. Extender `masterDataService.js` con nuevos métodos
2. Actualizar `persistentStorage.js` si es necesario
3. Crear hooks personalizados si se requiere
4. Implementar validaciones en `csvUtils.js`

## 🎨 Guía de Estilos

### Colores del Tema

La aplicación usa una paleta basada en azul y naranja:

- **Primario**: Azul (#2563eb)
- **Secundario**: Naranja (#ea580c)
- **Éxito**: Verde (#16a34a)
- **Advertencia**: Amarillo/Naranja (#f59e0b)
- **Error**: Rojo (#dc2626)

### Tipografía

- **Headings**: font-bold
- **Body**: font-medium o font-normal
- **Captions**: text-sm o text-xs

### Espaciado

- Usar clases de Tailwind: p-4, m-6, gap-2, etc.
- Consistencia en márgenes y padding
- Responsive design con prefijos md:, lg:

## 🔧 Configuración de Desarrollo

### ESLint

El proyecto incluye configuración de ESLint:

```bash
# Ejecutar linter
pnpm lint

# Autofix de problemas
pnpm lint --fix
```

### Vite

Configuración en `vite.config.js`:
- Alias `@` apunta a `./src`
- Hot reload habilitado
- Optimización para producción

### Tailwind CSS

Configuración en `src/App.css`:
- Variables CSS para temas
- Componentes personalizados
- Utilidades extendidas

## 📊 Gestión de Datos

### LocalStorage

Los datos se almacenan con el prefijo `transapp_`:

```javascript
// Ejemplo de uso
import masterDataService from '@/services/masterDataService'

// Obtener trabajadores
const workers = masterDataService.getWorkers()

// Agregar trabajador
masterDataService.addWorker(newWorker)
```

### Estructura de Datos

#### Trabajador
```javascript
{
  id: number,
  name: string,
  rut: string,
  position: string,
  phone: string,
  status: "Activo" | "Inactivo",
  hireDate: string
}
```

#### Vehículo
```javascript
{
  id: number,
  plate: string,
  brand: string,
  model: string,
  year: number,
  status: "Operativo" | "Mantenimiento" | "Fuera de Servicio",
  driver: string,
  lastMaintenance: string,
  nextMaintenance: string
}
```

## 🧪 Testing

### Estructura de Testing (Futuro)

```bash
src/
├── __tests__/          # Tests generales
├── components/
│   └── __tests__/      # Tests de componentes
└── utils/
    └── __tests__/      # Tests de utilidades
```

### Herramientas Sugeridas

- **Jest**: Framework de testing
- **React Testing Library**: Testing de componentes
- **MSW**: Mock Service Worker para APIs

## 🚀 Deployment

### Build de Producción

```bash
# Crear build optimizado
pnpm build

# Previsualizar build
pnpm preview
```

### Checklist Pre-Deploy

- [ ] Tests pasando
- [ ] Lint sin errores
- [ ] Build exitoso
- [ ] Funcionalidades críticas funcionando
- [ ] Responsive design verificado

## 🐛 Debugging

### Herramientas de Debug

1. **React DevTools**: Para inspeccionar componentes
2. **Redux DevTools**: Para estado (si se implementa)
3. **Console del navegador**: Para logs y errores
4. **Network Tab**: Para peticiones HTTP

### Logs Útiles

```javascript
// Debug de datos
console.log('Workers:', masterDataService.getWorkers())

// Debug de estado
console.log('Auth state:', useAuth())
```

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Contribución

### Workflow de Desarrollo

1. Crear branch para nueva funcionalidad
2. Implementar cambios siguiendo patrones establecidos
3. Hacer commit con mensajes descriptivos
4. Crear Pull Request para revisión
5. Merger después de aprobación

### Convenciones de Código

- Usar camelCase para variables y funciones
- PascalCase para componentes
- Kebab-case para archivos CSS
- Comentarios en español para el negocio
- JSDoc para funciones complejas

---

¡Happy coding! 🚛✨
