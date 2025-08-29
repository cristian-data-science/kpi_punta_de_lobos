# TransApp - AI Coding Agent Instructions

## Project Overview
TransApp is a React-based transportation management system for fleet and worker administration. Built with modern React 19, Vite, and a comprehensive Radix UI + Tailwind design system.

## Architecture & Data Flow

### Core Services Pattern
- **MasterDataService** (`src/services/masterDataService.js`): Central data management with localStorage persistence
- **PersistentStorage** (`src/services/persistentStorage.js`): Abstracted localStorage operations with `transapp_` prefix
- Data flows: UI Components → MasterDataService → PersistentStorage → localStorage

### Authentication System
- Fixed credentials: `admin` / `transapp123` (see `AuthContext.jsx`)
- Session persistence via `localStorage.getItem('transapp-auth')`
- AuthProvider wraps entire app - check `isAuthenticated` state for protected routes

### Component Architecture
```
Layout (Header + Sidebar + Outlet)
├── Dashboard (main metrics)
├── Workers/Vehicles/Routes/Payments (CRUD pages)
├── UploadFiles (CSV import functionality)
└── Settings (configuration)
```

## Development Patterns

### File Naming & Structure
- **Pages**: PascalCase (e.g., `Workers.jsx`, `UploadFiles.jsx`)
- **Components**: PascalCase with functional components only
- **Services**: camelCase (e.g., `masterDataService.js`)
- **UI Components**: shadcn/ui pattern in `src/components/ui/`

### State Management
- Local state with `useState` for UI state
- AuthContext for authentication state
- MasterDataService singleton for business data
- No Redux/Zustand - keep it simple with React patterns

### Styling Conventions
- **Tailwind CSS 4.1.7** with Vite plugin (`@tailwindcss/vite`)
- **Design tokens**: Blue/orange gradient theme (`from-blue-600 to-orange-600`)
- **Responsive**: Mobile-first with `use-mobile.js` hook
- **shadcn/ui**: Pre-built components in `src/components/ui/`

### Data Validation & CSV Import
- CSV parsing in `src/utils/csvUtils.js` with specific validators
- Required fields per entity type (workers, vehicles, routes)
- Example: Workers CSV needs `['nombre', 'rut', 'cargo', 'telefono']`

## Key Development Commands

```bash
# Development (required: Node >=18, pnpm >=9)
pnpm dev              # Starts Vite dev server on :5173
pnpm build            # Production build with terser minification
pnpm build:vercel     # Vercel deployment (install + build)
pnpm lint             # ESLint validation
```

## Critical Integration Points

### Vite Configuration
- **Path alias**: `@/` → `./src/` (configured in `vite.config.js`)
- **Chunk splitting**: vendor, echarts, ui chunks for optimal loading
- **Tailwind**: Integrated via `@tailwindcss/vite` plugin

### Build Optimization
- Console/debugger removal in production (`drop_console: true`)
- Manual chunks: `['react', 'react-dom']`, `['echarts', 'echarts-for-react']`
- Sourcemaps disabled for production builds

### Data Initialization
MasterDataService initializes with empty arrays on first load:
- Workers: Empty array - ready for real data input
- Vehicles: Empty array - no demo fleet data
- Routes & Payments: Empty arrays - clean slate for development
- Use `resetAllData()` method to clear existing data during development
- Use `loadDemoData()` method to load demonstration data when needed

### Data Management Features
- **Clear All Data**: Button in Settings page to reset all application data
- **Load Demo Data**: Button in UploadFiles page to load sample data for testing
- Demo data includes 3 workers, 3 vehicles, 2 routes, and 3 payment records

## Component Extension Guidelines

### Adding New Pages
1. Create in `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx` within `<Routes>`
3. Add navigation item in `src/components/Sidebar.jsx`
4. Use MasterDataService for data operations

### UI Components
- Extend shadcn/ui components in `src/components/ui/`
- Follow Radix UI accessibility patterns
- Use `class-variance-authority` for component variants
- Import icons from `lucide-react`

### Service Extensions
- Add new methods to MasterDataService for business logic
- Use PersistentStorage for any localStorage operations
- Maintain the singleton pattern for consistency

## Testing & Debugging
- Console logging is extensive in development (check AuthContext patterns)
- Data persistence debugging: Check localStorage with `transapp_` prefix
- Mobile responsiveness: Test with `use-mobile.js` hook logic
