# TransApp - AI Coding Agent Instructions

## Project Overview
TransApp is a React-based transportation management system for fleet and worker administration. Built with modern React 19, Vite, and a comprehensive Radix UI + Tailwind design system.

**🚀 Production Status**: Live at https://transapp-qjloxuf0s-cris-projects-245b6b28.vercel.app
**📦 Repository**: https://github.com/cristian-data-science/transapp
**🏗️ Deployment**: Automated via Vercel CLI with manual triggers when needed

## Architecture & Data Flow

### Core Services Pattern
- **MasterDataService** (`src/services/masterDataService.js`): Central data management with localStorage persistence
- **PersistentStorage** (`src/services/persistentStorage.js`): Abstracted localStorage operations with `transapp_` prefix
- **ConfigService** (`src/services/configService.js`): Centralized configuration management with snapshot sync
- Data flows: UI Components → MasterDataService → PersistentStorage → localStorage

### Authentication System
- Fixed credentials: `admin` / `transapp123` (see `AuthContext.jsx`)
- Session persistence via `localStorage.getItem('transapp-auth')`
- AuthProvider wraps entire app - check `isAuthenticated` state for protected routes

### Component Architecture
```
Layout (Header + Sidebar + Outlet)
├── Dashboard (main metrics)
├── Workers/Vehicles/Routes/Payments (CRUD pages + Excel export)
├── UploadFiles (CSV import functionality)
├── Calendar (shift management with rate calculations)
└── Settings (configuration)
```

## Payment System Architecture

### Excel Export Functionality
- **Library**: ExcelJS (replaced basic XLSX for professional styling)
- **Location**: `src/pages/Payments.jsx` - `exportToExcel()` async function
- **Features**: 
  - Professional styling with headers, borders, and currency formatting
  - Multiple worksheets support (Summary + Individual breakdowns)
  - Automatic column width adjustment
  - Company branding and metadata

### Calendar Integration
- **Shift Rate Calculation**: Dynamic rates based on day type and shift
- **Holiday Management**: Configurable holidays with special rates
- **Rate Structure**:
  - Weekday 1st/2nd shift: $20,000
  - Weekday 3rd shift: $22,500
  - Saturday 3rd shift: $27,500
  - Holidays (any shift): $27,500
  - Sundays (any shift): $35,000

### Payment Calculation Engine
- **Source**: `calculateWorkerPayments()` in MasterDataService
- **Features**: Defensive validations, timezone-aware calculations
- **Breakdown**: Per-shift type and per-day type categorization
- **Export Ready**: Formatted for Excel with currency and totals

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
- **Excel Integration**: ExcelJS for advanced export with professional formatting

## Key Development Commands

```bash
# Development (required: Node >=18, pnpm >=9)
pnpm dev              # Starts Vite dev server on :5173
pnpm build            # Production build with terser minification
pnpm build:vercel     # Vercel deployment (install + build) - Legacy
pnpm lint             # ESLint validation

# Deployment Commands
vercel --prod         # Manual production deployment
vercel login          # Authenticate with Vercel CLI
git push origin main  # Triggers auto-deployment (when configured)
```

## Critical Integration Points

### Vercel Deployment Configuration
- **Config**: `vercel.json` with simplified build command
- **Build Command**: `pnpm build` (standard Vite build)
- **Output Directory**: `dist`
- **Framework**: Vite with automatic detection
- **Regions**: ["iad1"] for optimal performance
- **Git Integration**: Manual deployment via Vercel CLI (auto-deploy configured)

### Vite Configuration
- **Path alias**: `@/` → `./src/` (configured in `vite.config.js`)
- **Chunk splitting**: vendor, echarts, ui chunks for optimal loading
- **Tailwind**: Integrated via `@tailwindcss/vite` plugin

### Build Optimization
- Console/debugger removal in production (`drop_console: true`)
- Manual chunks: `['react', 'react-dom']`, `['echarts', 'echarts-for-react']`, ExcelJS
- Sourcemaps disabled for production builds
- Terser minification with size warnings for chunks >500KB

### Critical Constructor Fix
**⚠️ IMPORTANT**: MasterDataService constructor order is critical:
```javascript
// CORRECT (prevents forEach error on fresh browser load)
constructor() {
  this.observers = [] // Initialize FIRST
  this.initializeDefaultData() // Then initialize data
}

// INCORRECT (causes "Cannot read properties of undefined" error)
constructor() {
  this.initializeDefaultData() // ❌ This can call notifyObservers()
  this.observers = [] // ❌ Too late, observers undefined
}
```

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

## Deployment & Production

### Vercel Deployment Process
1. **Authentication**: `vercel login` (one-time setup)
2. **Manual Deploy**: `vercel --prod` (immediate deployment)
3. **Auto-Deploy**: Push to main branch (when Git integration configured)
4. **Monitoring**: Check https://vercel.com/dashboard for deployment status

### Git Configuration for Deployment
- **Critical**: Ensure Git user is configured correctly to avoid bot author issues:
  ```bash
  git config user.name "Your Name"
  git config user.email "your.email@domain.com"
  ```
- **Repository**: GitHub integration with https://github.com/cristian-data-science/transapp
- **Branch**: `main` (default branch for deployments)

### Production URLs
- **Live Application**: https://transapp-qjloxuf0s-cris-projects-245b6b28.vercel.app
- **Vercel Dashboard**: https://vercel.com/cris-projects-245b6b28/transapp
- **GitHub Repository**: https://github.com/cristian-data-science/transapp

### Production Monitoring
- **Build Status**: Monitor Vercel dashboard for deployment success/failures
- **Error Tracking**: Check browser console for any runtime errors
- **Performance**: Lighthouse scores and Core Web Vitals via Vercel Analytics

## Testing & Debugging
- Console logging is extensive in development (check AuthContext patterns)
- Data persistence debugging: Check localStorage with `transapp_` prefix
- Mobile responsiveness: Test with `use-mobile.js` hook logic
- **Production Testing**: Always test in incognito/private browsing for fresh state
- **Excel Export Testing**: Verify ExcelJS functionality in production environment

## Common Issues & Solutions

### Fresh Browser Load Error
**Symptom**: `Cannot read properties of undefined (reading 'forEach')`
**Solution**: Ensure MasterDataService constructor initializes `this.observers = []` before calling `this.initializeDefaultData()`

### Vercel Deployment Issues
**Symptom**: Build fails or shows blank page
**Solutions**: 
1. Check `vercel.json` build command is `pnpm build`
2. Verify Git author is not bot (`git config user.name/email`)
3. Force push to clean Git history if needed
4. Use `vercel --prod` for manual deployment

### Excel Export Issues
**Symptom**: Download fails or incorrect formatting
**Solutions**:
1. Verify ExcelJS dependency in package.json
2. Check browser console for export errors
3. Test with sample data first

### Calendar Rate Calculations
**Critical Rules**: 
- Sunday always pays $35,000 (any shift)
- Holidays (non-Sunday) pay $27,500 (any shift)
- Saturday 3rd shift pays $27,500
- Weekday 3rd shift pays $22,500
- All other shifts pay $20,000
