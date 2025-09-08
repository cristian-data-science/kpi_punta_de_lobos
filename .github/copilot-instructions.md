# TransApp - AI Coding Agent Instructions

## Project Overview
TransApp is a React-based transportation management system for fleet and worker administration. Built with modern React 19, Vite, and a comprehensive Radix UI + Tailwind design system with **integrated Supabase PostgreSQL backend and Model Context Protocol (MCP) support**.

**🚀 Production Status**: Live at https://transapp-qjloxuf0s-cris-projects-245b6b28.vercel.app
**📦 Repository**: https://github.com/cristian-data-science/transapp
**🏗️ Deployment**: Automated via Vercel CLI with manual triggers when needed
**🗄️ Database**: Supabase PostgreSQL with 14+ workers and 98+ shift records
**🔌 MCP Integration**: Complete Model Context Protocol implementation for AI-database interactions

## Architecture & Data Flow

### Enhanced Services Architecture (Dual-Layer System)
- **Supabase Integration** (`src/services/supabaseService.js`): Primary database layer with PostgreSQL backend
- **SupabaseIntegrationService** (`src/services/supabaseIntegrationService.js`): Bridge between Supabase and existing system
- **MasterDataService** (`src/services/masterDataService.js`): Central data management with localStorage fallback
- **PersistentStorage** (`src/services/persistentStorage.js`): Abstracted localStorage operations with `transapp_` prefix
- **ConfigService** (`src/services/configService.js`): Centralized configuration management with snapshot sync
- **Data Flow**: UI Components → MasterDataService ↔ SupabaseIntegration ↔ Supabase PostgreSQL (localStorage fallback)

### Database Architecture
- **Primary**: Supabase PostgreSQL with real-time capabilities
- **Tables**: `trabajadores` (14 workers with "fijo" contracts), `turnos` (98+ shift records)
- **Features**: UUID PKs, RLS policies, indexed searches, foreign key relationships
- **Backup**: localStorage with `transapp_` prefix for offline functionality

### Authentication System
- Fixed credentials: `admin` / `transapp123` (see `AuthContext.jsx`)
- Session persistence via `localStorage.getItem('transapp-auth')`
- AuthProvider wraps entire app - check `isAuthenticated` state for protected routes

### Component Architecture
```
Layout (Header + Sidebar + Outlet)
├── Dashboard (main metrics)
├── Workers/Vehicles/Cobros/Payments (CRUD pages + Excel export)
│   ├── Cobros: Shift-based billing with weekly/monthly filtering and configurable rates
│   └── Payments: Total/Monthly filtering with date validation warnings
├── UploadFiles (CSV import functionality)
├── Calendar (shift management with rate calculations)
└── Settings (configuration)
```

## Model Context Protocol (MCP) Integration

### MCP Server Architecture
- **Location**: `mcp/mcp-server-simple.cjs` (active server)
- **Configuration**: `mcp.json` with environment variables
- **SDK**: `@modelcontextprotocol/sdk` v1.17.5 CommonJS implementation
- **Database Connection**: Direct Supabase PostgreSQL access via service role

### Available MCP Tools
1. **`query_workers`** - Query workers with filters (search, status, pagination)
2. **`create_worker`** - Create new worker with full validation
3. **`update_worker`** - Update existing worker by ID
4. **`query_shifts`** - Query shifts with worker relations and date filters
5. **`create_shift`** - Create new shift with worker association
6. **execute_sql`** - Execute safe SELECT queries on database
7. **`get_database_schema`** - Get complete database schema information

### MCP Server Features
- **Real-time Database Access**: Direct PostgreSQL operations via Supabase
- **Comprehensive CRUD**: Full Create, Read, Update, Delete operations
- **Relationship Queries**: Joins between trabajadores and turnos tables
- **Safe SQL Execution**: Only SELECT queries allowed for security
- **Schema Introspection**: Complete database structure access
- **Error Handling**: Robust error responses with detailed messages

### Database Schema Access via MCP
```
trabajadores table:
- id (uuid, PK)
- nombre (text)
- rut (text, unique)  
- contrato (text: 'fijo'|'eventual'|'planta') - ALL SET TO 'fijo'
- telefono (text)
- estado (text: 'activo'|'inactivo')
- created_at, updated_at (timestamps)

turnos table:
- id (uuid, PK)
- trabajador_id (uuid, FK -> trabajadores.id)
- fecha (date)
- turno_tipo (text: 'primer_turno'|'segundo_turno'|'tercer_turno')
- estado (text: 'programado'|'completado'|'cancelado')
- created_at (timestamp)
```

### Current Database State
- **14 Workers**: All with "fijo" contracts (updated from "eventual")
- **98+ Shifts**: Real shift data with proper worker relationships
- **UUID PKs**: All tables use UUID primary keys
- **RLS Enabled**: Row Level Security policies configured
- **Indexed**: Optimized queries on rut, fecha, and relationship fields

### MCP Configuration
```json
{
  "mcpServers": {
    "transapp-supabase": {
      "command": "node",
      "args": ["mcp/mcp-server-simple.cjs"],
      "env": {
        "SUPABASE_URL": "https://csqxopqlgujduhmwxixo.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[service-role-key]"
      }
    }
  }
}
```

## Cobros System Architecture

### Billing Management Module
- **Location**: `src/pages/Cobros.jsx` (689 lines) - Complete billing interface with professional Excel export
- **Purpose**: Shift-based billing calculation with configurable tariffs per shift
- **Navigation**: Replaced Routes section in sidebar with Receipt icon

### Core Features
- **Configurable Tariffs**: localStorage-persisted tariff configuration with real-time updates
- **Period Filtering**: Weekly/Monthly view modes with ISO 8601 week calculations
- **Professional Excel Export**: Enterprise-grade ExcelJS integration with advanced styling
- **Real-time Calculations**: Dynamic billing totals based on shift counts and configured rates

### Professional Excel Export Features
- **Advanced Styling**: Multi-sheet workbooks with professional formatting
- **Title Design**: Arial Black fonts with gradient backgrounds and thick borders
- **Information Sections**: Color-coded sections with gradient backgrounds
- **Data Tables**: Alternating row colors, column-specific styling, professional borders
- **Detail Sheets**: Comprehensive breakdown with visual hierarchy and color coding
- **Column Optimization**: Auto-sized columns with specific styling per data type

### Week Calculation Algorithm
- **Implementation**: `getWeekNumberForDate()` - ISO 8601 adapted for labor shifts
- **Sunday Handling**: Treats Sundays as part of following week for labor context
- **Algorithm Steps**:
  1. If Sunday, use following Monday for calculation
  2. Find Thursday of calculation week to determine ISO year
  3. Calculate weeks from first Thursday of ISO year
- **Consistency**: Unified across filtering and display functions

### Data Processing
- **Source Data**: `masterDataService.getWorkerShifts()` integration
- **Filtering Logic**: `filterTurnosByPeriod()` with period-specific algorithms
- **Worker Aggregation**: `getTurnosPorTrabajador()` with billing totals per worker
- **Currency Formatting**: Chilean peso (CLP) with proper localization

### Excel Export Specifications
- **Structure**: Multi-sheet workbook (Summary + Details)
- **Metadata**: Company branding, export date, tariff configuration
- **Professional Styling**: Headers, borders, currency formatting, column auto-sizing
- **Dynamic Naming**: Period-specific file names with sanitized labels

## Payment System Architecture

### Payment System Architecture

### Excel Export Functionality
- **Library**: ExcelJS with professional enterprise-grade styling
- **Location**: `src/pages/Payments.jsx` - `exportToExcel()` async function
- **Professional Features**: 
  - **Advanced Styling**: Arial Black titles, gradient backgrounds, sophisticated borders
  - **Multi-sheet Design**: Summary + Detailed breakdown with consistent professional formatting
  - **Column Optimization**: Automatic width adjustment and column-specific styling
  - **Enterprise Branding**: Company metadata and professional presentation
  - **Color-Coded Data**: Different colors for data types (workers: blue, amounts: green, holidays: red)
- **Sheet Structure**:
  - **Total View**: "Resumen" + "Detalles Completos" sheets with full professional styling
  - **Monthly View**: "[Month] [Year]" + "Detalles Completos" sheets
- **Removed Features**: "Promedio por trabajador" column and display completely eliminated
- **Data Validation**: Enhanced date warnings with priority system for missing days vs incomplete months

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

### Date Validation & Warning System
- **Location**: `src/pages/Payments.jsx` - `getDateWarnings()` function
- **Purpose**: Detects missing calendar dates and incomplete shift records in monthly view
- **Warning Types**:
  - 🔴 **`missing-days`**: Completely missing calendar days (no records at all)
  - 🟠 **`days-without-shifts`**: Days present in records but without shifts
  - 🟡 **`incomplete-month`**: Month completion below 80% threshold
  - ⚪ **`no-data`**: No filtered data available for selected month
- **Algorithm**: Compares all calendar days (1-31) against actual recorded dates
- **UI Features**: Color-coded warnings with specific icons and detailed messages
- **Priority System**: Missing days > Days without shifts > Incomplete month

## Development Patterns

### Date Handling & Timezone Consistency
- **Critical Fix**: All date parsing uses timezone-local creation to prevent UTC offset issues
- **Pattern**: `const [year, month, day] = dateString.split('-'); const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))`
- **Utility**: `src/utils/dateUtils.js` provides consistent date handling functions
- **Applied in**: `formatDate()` functions in Cobros.jsx, Payments.jsx, and masterDataService.js
- **Issue Fixed**: Date strings like "2025-06-02" now correctly display as "lun, 2 jun" instead of previous day

### Professional Excel Export System
- **ExcelJS Integration**: Advanced styling with enterprise-grade formatting
- **Features**:
  - **Professional Titles**: Arial Black fonts with gradient backgrounds and thick borders
  - **Section Headers**: Color-coded information sections with distinct styling
  - **Alternating Rows**: Enhanced readability with professional color schemes
  - **Column-Specific Styling**: Different colors for data types (workers: blue, amounts: green, dates: gray)
  - **Multi-Sheet Support**: Summary and detailed breakdowns with consistent styling
- **Applied to**: Both Cobros.jsx and Payments.jsx reports
- **Color Scheme**: Professional gradients (blue titles, red/green sections, alternating row backgrounds)

### File Naming & Structure
- **Pages**: PascalCase (e.g., `Workers.jsx`, `UploadFiles.jsx`)
- **Components**: PascalCase with functional components only
- **Services**: camelCase (e.g., `masterDataService.js`)
- **UI Components**: shadcn/ui pattern in `src/components/ui/`
- **Test Scripts**: Located in `test/` directory (e.g., `test/test-mcp.js`, `test/verify-table-access.cjs`)
- **Documentation**: Organized in `docs/` directory (e.g., `docs/DEVELOPMENT.md`)
- **MCP Servers**: Located in `mcp/` directory (e.g., `mcp/mcp-server-simple.cjs`)
- **SQL Scripts**: Located in `sql/` directory (e.g., `sql/supabase_setup.sql`)

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
pnmp dev              # Starts Vite dev server on :5173
pnpm build            # Production build with terser minification
pnmp build:vercel     # Vercel deployment (install + build) - Legacy
pnpm lint             # ESLint validation

# MCP & Database Commands
node mcp/mcp-server-simple.cjs     # Test MCP server functionality
node test/test-mcp.js              # Run MCP integration tests
node test/verify-table-access.cjs  # Verify Supabase database access
node test/setup-complete.js        # Complete project setup

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
**Current State - Supabase Production Data**:
- **Workers**: 14 real workers in Supabase PostgreSQL - ALL with "fijo" contracts
- **Shifts**: 98+ real shift records with proper worker relationships
- **Vehicles**: Empty array - no demo fleet data
- **Cobros & Payments**: Empty arrays - clean slate for development
- **Dual System**: MasterDataService + Supabase integration with localStorage fallback
- Use `resetAllData()` method to clear existing data during development
- Use `loadDemoData()` method to load demonstration data when needed

### Data Management Features
- **Clear All Data**: Button in Settings page to reset all application data
- **Load Demo Data**: Button in UploadFiles page to load sample data for testing
- Demo data includes 3 workers, 3 vehicles, shift records, and payment data
- **Cobros Configuration**: Tariff settings persisted in localStorage with `transapp_cobro_config` key

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

### Date Display Inconsistency (FIXED)
**Symptom**: Date field shows "2025-06-02" but formatted day shows "dom, 1 jun" (off by one day)
**Root Cause**: Using `new Date(dateString)` directly causes UTC timezone interpretation issues
**Solution**: Manual date parsing using timezone-local creation:
```javascript
const [year, month, day] = dateString.split('-')
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
```
**Applied to**: formatDate() functions in Cobros.jsx, Payments.jsx, and masterDataService.js

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

### Date Validation Warnings
**Purpose**: Detect missing calendar dates and incomplete monthly records
**Implementation**: 
- `getDateWarnings()` function iterates through all calendar days (1-31)
- Compares against actual recorded dates to find gaps
- Prioritizes missing days over incomplete shift data
- Shows color-coded warnings with specific day numbers

### Calendar Rate Calculations
**Critical Rules**: 
- Sunday always pays $35,000 (any shift)
- Holidays (non-Sunday) pay $27,500 (any shift)
- Saturday 3rd shift pays $27,500
- Weekday 3rd shift pays $22,500
- All other shifts pay $20,000

## Project Organization & Structure

### Organized Directory Structure
**Recent Update**: Project completely reorganized for better maintainability and clarity.

```
transapp/
├── 📂 src/ - Main application code
│   ├── components/, contexts/, hooks/, lib/, pages/, services/, utils/
│
├── 📚 docs/ - All documentation
│   ├── DEVELOPMENT.md, PROJECT_SUMMARY.md, TUTORIAL_PAGOS.md
│   ├── MCP_SETUP_COMPLETE.md, SUPABASE_CONFIG.md
│
├── 🧪 test/ - All testing and utility scripts  
│   ├── test-mcp.js, verify-table-access.cjs
│   ├── setup-complete.js, create-workers.js
│   ├── update-contracts-to-fijo.cjs
│
├── 🔌 mcp/ - Model Context Protocol servers
│   ├── mcp-server-simple.cjs (ACTIVE)
│   ├── mcp-server-supabase.cjs
│
├── 🗄️ sql/ - Database scripts
│   ├── supabase_setup.sql, supabase_simple.sql
│
└── 📁 excel_files/ - Data files
```

### Organizational Benefits
- **Clean Root**: Configuration files only in project root
- **Logical Grouping**: Related files grouped by function
- **Easy Navigation**: Clear directory structure with READMEs
- **Professional Structure**: Industry-standard organization
- **Maintainable**: Easy to find and update files

### Updated File Paths
- **MCP Server**: `mcp/mcp-server-simple.cjs` (updated in mcp.json)
- **Tests**: All scripts moved to `test/` directory
- **Documentation**: Centralized in `docs/` directory
- **SQL Scripts**: Organized in `sql/` directory

### README Files Added
Each major directory now contains a README.md explaining:
- Purpose and contents of the directory
- How to use files in that directory  
- Relationships to other parts of the project
- Development and testing instructions
