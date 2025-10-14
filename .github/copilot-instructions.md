# KPI Punta de Lobos - AI Coding Agent Instructions

## 🔒 CRITICAL SECURITY RULES (READ FIRST)

### **NEVER COMMIT SECRETS TO GIT - ABSOLUTE PROHIBITION**

#### ❌ **PROHIBITED PATTERNS** (Will cause security incidents):
```javascript
// ❌ NEVER hardcode credentials with fallback operator
const key = process.env.SECRET || 'hardcoded-value'
const token = process.env.TOKEN || 'eyJhbGci...'

// ❌ NEVER hardcode service_role keys
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// ❌ NEVER hardcode passwords
const password = 'admin123'

// ❌ NEVER hardcode API keys
const apiKey = 'sk_live_...'
```

#### ✅ **REQUIRED PATTERN** (Always use this):
```javascript
// ✅ ALWAYS require dotenv at the top
require('dotenv').config({ path: '.env.local' })

// ✅ ALWAYS validate environment variables exist
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY required in .env.local')
  process.exit(1)
}

// ✅ Frontend uses import.meta.env
const url = import.meta.env.VITE_SUPABASE_URL
```

#### 🛡️ **Security Checklist Before ANY Commit**:
- [ ] No JWT tokens (strings starting with `eyJ`)
- [ ] No `process.env.X || 'hardcoded'` patterns
- [ ] All credentials come from `.env.local`
- [ ] No service_role keys in code
- [ ] Test scripts use `require('dotenv').config()`
- [ ] Strict validation with `process.exit(1)` if variables missing

#### 📁 **Approved Credential Storage**:
- ✅ **`.env.local`** - Local development (protected by .gitignore)
- ✅ **Vercel Environment Variables** - Production/Preview
- ✅ **`import.meta.env`** - Vite frontend variables (VITE_ prefix)
- ❌ **NEVER in source code files** (.js, .jsx, .cjs, .ts, .tsx)

---

## Project Overview
TransApp is a React-based transportation management system for fleet and worker administration. Built with modern React 19, Vite, and a comprehensive Radix UI + Tailwind design system with **integrated Supabase PostgreSQL backend and Model Context Protocol (MCP) support**.

**🚀 Production Status**: Live at https://transapp-qjloxuf0s-cris-projects-245b6b28.vercel.app
**📦 Repository**: https://github.com/cristian-data-science/transapp
**🏗️ Deployment**: Automated via Vercel CLI with manual triggers when needed
**🗄️ Database**: Supabase PostgreSQL with 14+ workers and 98+ shift records
**🔌 MCP Integration**: Complete Model Context Protocol implementation for AI-database interactions
**🔐 Security**: Strict environment variable validation, no hardcoded credentials

## Architecture & Data Flow

### Enhanced Services Architecture (Dual-Layer System)
- **Supabase Singleton** (`src/services/supabaseClient.js`): Central Supabase client instance to prevent multiple GoTrueClient warnings
- **Supabase Integration** (`src/services/supabaseService.js`): Primary database layer with PostgreSQL backend
- **SupabaseIntegrationService** (`src/services/supabaseIntegrationService.js`): Bridge between Supabase and existing system
- **MasterDataService** (`src/services/masterDataService.js`): Central data management with localStorage fallback
- **PersistentStorage** (`src/services/persistentStorage.js`): Abstracted localStorage operations with `transapp_` prefix
- **ConfigService** (`src/services/configService.js`): Centralized configuration management with snapshot sync
- **Data Flow**: UI Components → MasterDataService ↔ SupabaseIntegration ↔ Supabase Singleton ↔ Supabase PostgreSQL

### Database Architecture
- **Primary**: Supabase PostgreSQL with real-time capabilities
- **Tables**: `trabajadores` (14 workers with "fijo" contracts), `turnos` (98+ shift records)
- **Features**: UUID PKs, RLS policies, indexed searches, foreign key relationships
- **Backup**: localStorage with `transapp_` prefix for offline functionality

### Supabase Singleton Pattern (IMPLEMENTED)
**Architecture**: `src/services/supabaseClient.js` provides centralized Supabase client management
- **Problem Solved**: Eliminates "Multiple GoTrueClient instances" warnings in browser console
- **Implementation**: Single `getSupabaseClient()` function returns cached instance
- **Usage**: All components/services now use `import { getSupabaseClient } from '../services/supabaseClient.js'`
- **Components Updated**: 10+ files including AddShiftModal, Calendar, Workers, and all service files
- **Benefits**: Better performance, consistent behavior, clean console logs, no concurrent client conflicts

### Authentication System
- Fixed credentials: `admin` / `transapp123` (see `AuthContext.jsx`)
- Session persistence via `localStorage.getItem('transapp-auth')`
- AuthProvider wraps entire app - check `isAuthenticated` state for protected routes

### Component Architecture
```
Layout (Header + Sidebar + Outlet)
├── Dashboard (main metrics with optimized filtering)
├── Workers/Vehicles/Cobros/Payments (CRUD pages + Excel export)
│   ├── Workers: Complete CRUD with RUT validation, create/edit/delete, status management
│   ├── Cobros: Shift-based billing with weekly/monthly filtering and configurable rates
│   └── Payments: Total/Monthly filtering with date validation warnings
├── UploadFiles (Excel import functionality with intelligent validation)
├── Calendar (shift management with rate calculations)
├── GuiaUso (interactive user documentation system)
└── Settings (configuration)
```

### Interactive Documentation System (NEW - COMPLETED)
**Location**: `src/pages/GuiaUso.jsx` (1035+ lines) - Complete interactive user manual for business users
**Purpose**: Replace technical documentation with user-friendly business-oriented guide

#### Core Features Implemented
- **Interactive Navigation**: Horizontal card-based navigation replacing sidebar for space optimization
- **Real-time Search**: Filter content across all sections and subsections
- **Markdown Rendering**: Custom `renderInlineText()` and `renderContent()` functions for proper **bold** text formatting
- **Responsive Accordions**: Expandable sections with visual feedback and state management
- **Professional Layout**: Optimized for business users transitioning from Excel workflows

#### Content Structure (9 Main Sections)
- **Bienvenido**: System overview and recommended workflow
- **Dashboard**: Executive metrics and intelligent filtering system
- **Trabajadores**: Worker management with RUT validation
- **Turnos**: Shift scheduling with calendar integration
- **Tarifas**: Centralized rate configuration
- **Cobros**: Weekly billing with Excel export
- **Pagos**: Monthly payroll calculations
- **Importación de Planillas Excel**: Updated Excel import process (was CSV)
- **Detección de Inconsistencias**: Automated data validation
- **Solución de Problemas**: Troubleshooting guide
- **Migración desde Excel**: Step-by-step migration planning

#### Technical Implementation
- **Layout Optimization**: Horizontal navigation maximizes content space vs previous sidebar
- **Markdown Processing**: Advanced text formatting with inline **bold** processing
- **Search Engine**: Real-time filtering across all documentation content
- **State Management**: Accordion expansion/collapse with localStorage persistence
- **Component Integration**: Seamless integration with existing TransApp navigation

#### Content Updates Made
- **Removed Sections**: Eliminated "Acceso al Sistema", "Configuración del Sistema", "Acceso Móvil"
- **Updated Import Module**: Changed from CSV to Excel import process with real validation modes
- **Business Language**: Non-technical language focused on end-user workflows
- **Updated Process Flow**: Reflects actual Excel-based import with intelligent worker mapping
├── Calendar (shift management with rate calculations)
└── Settings (configuration)
```

## Dashboard Optimization System (PERFORMANCE CRITICAL)

### Advanced Dashboard Architecture (IMPLEMENTED)
**Location**: `src/pages/Dashboard.jsx` - High-performance analytics interface with optimized filtering system
**Problem Solved**: Dashboard filters were functional but caused complete page refresh, degrading UX
**Performance Impact**: Eliminated unnecessary re-renders, maintained scroll position, smooth filter transitions

### Granular useEffect Architecture
**Before**: Single useEffect reloaded entire dashboard on any filter change
```javascript
❌ useEffect(() => {
    loadDashboardData() // Reloads ALL components
}, [timeFilters]) // Any change triggers complete refresh
```

**After**: Four specialized useEffect hooks for targeted updates
```javascript
✅ useEffect(() => loadInitialData(), [])                    // One-time initial load
✅ useEffect(() => loadFinancialData(), [financialRange])    // Financial data only  
✅ useEffect(() => loadTrendsData(), [trendsRange])          // Trends chart only
✅ useEffect(() => loadTopWorkersData(), [topWorkersRange])  // Workers ranking only
```

### Advanced Memoization Pattern
- **Chart Options**: `useMemo` with specific dependencies prevents ECharts re-initialization
- **Event Handlers**: `useCallback` for filter handlers prevents child component re-renders
- **Null Safety**: Robust validation for chart data prevents rendering errors
- **Performance**: Only affected components update, maintaining UI state and scroll position

### Optimized Filter System (ENHANCED)
**Components**:
- **Financial Filters**: Todo/Año/Mes - Updates financial cards only
- **Trends Filters**: 7d/30d/90d - Updates trend chart only  
- **Top Workers Filters**: Todo/Año/Mes anterior/Mes actual - Updates worker rankings only

**NEW: Mes Anterior Filter (September 2025)**:
- **Implementation**: Added 'prev_month' option to topWorkersRange filter
- **Logic**: Uses existing `getPreviousMonthRange()` for complete previous month calculation
- **UI**: New "Mes anterior" button between "Año" and "Mes actual" with consistent styling
- **Functionality**: Shows full previous month data (e.g., Aug 1-31 when current is Sep 15)
- **Calendar Logic**: Handles year boundaries correctly (Dec previous year when current is Jan)

**Technical Features**:
- **Independent Updates**: Each filter affects only its specific data section
- **State Preservation**: User scroll position and UI context maintained
- **Smooth Transitions**: No page flicker or component reconstruction
- **Real-time Response**: Immediate visual feedback without loading states
- **Debug Control**: DEBUG_DEFAULT now set to `false` for clean production console

### Performance Optimizations Applied
1. **Separated Data Loading**: Each useEffect handles specific dashboard section
2. **Memoized Handlers**: `useCallback` prevents unnecessary function recreation
3. **Chart Optimization**: ReactECharts components only re-render when data changes
4. **State Management**: Granular state updates instead of complete dashboard refresh
5. **Null Handling**: Robust validation prevents rendering errors during data transitions

### UX Improvements Achieved
- ✅ **No Page Refresh**: Filters update data without losing user context
- ✅ **Preserved Scroll**: User maintains their viewing position
- ✅ **Smooth Transitions**: No visual flicker or component destruction
- ✅ **Independent Filters**: Each filter works without affecting others
- ✅ **Real-time Updates**: Immediate data changes without loading delays

## Workers Management Module (COMPLETED)

### Core Features Implemented
- **Complete CRUD Operations**: Create, Read, Update, Delete workers with direct Supabase integration
- **Chilean RUT Validation**: Real-time RUT validation with proper algorithm and formatting
- **Professional UI Design**: Modern table with search, filters, and status badges
- **Safe Deletion System**: Permanent deletion only for inactive workers with confirmation dialogs
- **Direct Supabase Connection**: Bypasses service layer issues, direct database operations
- **Payroll System**: Complete salary management with automatic calculations and business rules

### Payroll Management System (NEW - COMPLETED)
**Database Fields**:
- **sueldo_base**: Base monthly salary (INTEGER, CLP)
- **dias_trabajados**: Days worked in month (INTEGER, 1-31, default 30)
- **sueldo_proporcional**: Proportional salary calculated automatically (INTEGER)

**Business Logic (Database Trigger)**:
- **Trigger Function**: `calcular_sueldo_proporcional()` - PL/pgSQL function
- **Trigger**: BEFORE INSERT OR UPDATE OF sueldo_base, dias_trabajados, contrato, estado
- **Calculation Formula**: `ROUND(sueldo_base * (dias_trabajados / 30))`
- **Contract Types**: Three options (fijo, planta, eventual)
  - **Fijo/Planta + Activo**: Calculates proportional salary automatically
  - **Eventual**: Always resets all salary fields to 0
  - **Inactivo**: Always resets all salary fields to 0
- **Automatic Reset**: When worker changes to inactive, all salary fields → 0

**UI Features (Workers.jsx)**:
- **Real-time Preview**: Instant calculation display while editing
- **Preview Display**: Shows amount + percentage (e.g., "$400.000 - 67% del base")
- **Bulk Salary Application**: "Aplicar Sueldo Base" button applies salary to all active workers only
- **Status Management**: Deactivating worker automatically resets salary fields to 0
- **Color-coded Badges**: 
  - Fijo: Blue badge (bg-blue-50 text-blue-700)
  - Planta: Green badge (bg-green-50 text-green-700)
  - Eventual: Orange badge (bg-orange-50 text-orange-700)

**Worker Creation Modal (AddWorkerModal.jsx)**:
- **Three Contract Options**: Dropdown with fijo, planta, eventual
- **Conditional Fields**: Salary fields only visible for fijo/planta (hidden for eventual)
- **Tooltip Guidance**: "💡 Fijo y Planta funcionan igual, solo cambia la etiqueta"
- **Real-time Preview**: Shows calculated proportional salary as user types
- **Eventual Warning**: Amber box explaining values will be set to 0

**SQL Migration Scripts**:
- **step_by_step_migration.sql**: Safe step-by-step migration (185 lines)
- **migration_complete.sql**: Complete migration in one execution (220 lines)
- **add_sueldo_proporcional.sql**: Standalone script for proportional salary only (140 lines)
- **Features**: ALTER TABLE, trigger creation, constraint updates, index creation, data initialization

### Worker Creation System
- **AddWorkerModal Component** (`src/components/AddWorkerModal.jsx`): Complete modal form with validation
- **RUT Utilities** (`src/utils/rutUtils.js`): Chilean RUT validation, formatting, and normalization
- **Real-time Validation**: Visual feedback with green/red indicators during form completion
- **Duplicate Prevention**: Automatic RUT uniqueness checking before database insertion

### Worker Management Features
- **Search & Filter**: Real-time search by name/RUT, filter by contract type and status
- **Inline Editing**: Direct table editing with save/cancel functionality
- **Status Management**: Activate/deactivate workers with visual status badges and automatic salary reset
- **Professional Badges**: Color-coded contract and status indicators with proper contrast
- **Safe Deletion**: Multi-layer confirmation system for permanent worker removal
- **Bulk Operations**: Apply base salary to all active workers with one click

### Technical Implementation
- **Direct Supabase Integration**: Uses `getSupabaseClient()` singleton for reliability
- **Database Trigger**: Automatic calculation and validation at DB level
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Loading States**: Visual feedback during all CRUD operations
- **Form Validation**: Complete validation for all required fields with real-time feedback
- **Modal System**: Professional modals with backdrop blur and smooth animations
- **Business Rules**: Salary management respects worker status (active/inactive) and contract type

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

## Cobros System Architecture (ENHANCED PERFORMANCE)

### Weekly On-Demand Loading System (IMPLEMENTED)
**Location**: `src/pages/Cobros.jsx` - Optimized collections interface with weekly cache system
**Problem Solved**: Previous system loaded ALL turnos data causing performance issues and 1000-record Supabase limits
**Performance Impact**: Reduced initial load time, eliminated pagination problems, smooth weekly navigation

### Enhanced Cobros Architecture
**Core Features**:
- **Weekly Cache System**: Map-based cache prevents redundant data loading for visited weeks
- **On-Demand Loading**: Only loads data for selected week, not entire dataset
- **Available Weeks API**: Lightweight query to get available weeks without loading full data
- **Supabase Pagination**: Uses service-layer pagination to handle 2000+ turnos without limits
- **React Key Optimization**: Composite keys prevent duplicate key warnings in JSX rendering

### Cobros Service Layer (OPTIMIZED)
**Location**: `src/services/cobrosSupabaseService.js` - Enhanced service with weekly loading capabilities
**New Functions**:
- **`loadTurnosForWeek(year, week)`**: Loads specific week data with date range filtering
- **`getAvailableWeeksFromSupabase()`**: Paginated query to get all available weeks efficiently  
- **`getWeekDates(year, week)`**: ISO 8601 week date calculation for accurate ranges
- **`getWeekNumberForDate(date)`**: Consistent week number calculation across system

### Technical Implementation
**Data Parsing**: Converts Supabase week strings ('2025-W45') to objects ({year: 2025, week: 45})
**Cache Management**: WeekCache Map stores loaded data with keys like '2025-W45' 
**State Optimization**: Removed filteredTurnos state, data comes pre-filtered from service
**React Performance**: Fixed duplicate key prop warnings with composite keys including year, week, and index

### Dashboard Financial Data Fix (CRITICAL ISSUE RESOLVED)

### Supabase Pagination Problem (FIXED)
**Issue**: Dashboard financial filters "Todo" and "Todo el año" showed incorrect totals due to 1000-record limit
**Root Cause**: `loadFinancialData()` used simple query `await q` which limits to 1000 records maximum
**Impact**: With 2124+ turnos in database, only first 1000 were processed, causing wrong calculations

### Solution Implementation
**Before**: Simple query without pagination
```javascript
❌ const { data, error } = await q  // Limited to 1000 records
```

**After**: Using existing `fetchPaged` helper for complete data
```javascript
✅ const { rows: data, _debug } = await fetchPaged({
    table: 'turnos',
    select: 'pago,cobro,estado,fecha',
    buildFilter
}) // Processes ALL 2124+ records
```

### Results Validation
**Expected Dashboard Results** (should now match direct Supabase query):
- **Total Turnos**: 2124 completados
- **Total Pagos (Costos)**: $216.385.000
- **Total Cobros (Ingresos)**: $474.621.000
- **Pagination Info**: Multiple pages processed automatically

### Performance Benefits
- **Complete Data**: All turnos processed, not just first 1000
- **Automatic Pagination**: Handles large datasets seamlessly  
- **Debug Information**: Added pagination metadata for monitoring
- **Minimal Changes**: Only modified loadFinancialData function, preserved all other logic

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

### Dashboard Performance Patterns (CRITICAL IMPLEMENTATION)

#### Granular useEffect Pattern (PERFORMANCE BREAKTHROUGH)
```javascript
// ✅ CORRECTO: Efectos separados y específicos
useEffect(() => loadInitialData(), [])                    // Solo carga inicial
useEffect(() => loadFinancialData(), [financialRange])    // Solo datos financieros
useEffect(() => loadTrendsData(), [trendsRange])          // Solo gráfico tendencias
useEffect(() => loadTopWorkersData(), [topWorkersRange])  // Solo ranking trabajadores

// ❌ INCORRECTO: Efecto monolítico
useEffect(() => {
    loadDashboardData() // Recarga TODO el dashboard
}, [timeFilters]) // Cualquier cambio -> refresco completo
```

#### Advanced Memoization Pattern (PERFORMANCE CRITICAL)
```javascript
// ✅ CORRECTO: Memoización con dependencias específicas
const getTrendsChartOption = useMemo(() => {
    if (!dashboardData.trends.daily?.length) return null
    return { /* configuración del gráfico */ }
}, [dashboardData.trends.daily]) // Solo recalcula cuando cambian tendencias

const handleFinancialFilter = useCallback((newFilter) => {
    setTimeFilters(prev => ({ ...prev, financialRange: newFilter }))
}, []) // Handler estable, previene re-renders

// ❌ INCORRECTO: Sin memoización
const chartOption = { /* se recalcula en cada render */ }
const handler = (filter) => { /* nueva función en cada render */ }
```

#### Optimized Filter Handlers Pattern
```javascript
// ✅ CORRECTO: Handlers simples y directos
<button onClick={() => handleFinancialFilter('month')}>
  Mes
</button>

// ❌ INCORRECTO: Handlers complejos innecesarios
<button onClick={(e) => {
    e.preventDefault()
    e.stopPropagation() 
    setTimeFilters(prev => ({ ...prev, financialRange: 'month' }))
}}>
```

#### Chart Rendering Optimization
```javascript
// ✅ CORRECTO: Validación robusta antes de renderizar
{dashboardData.trends.daily.length > 0 && getTrendsChartOption ? (
  <ReactECharts option={getTrendsChartOption} />
) : (
  <EmptyState />
)}

// ❌ INCORRECTO: Sin validación, puede causar errores
<ReactECharts option={chartOption} />
```

### Date Handling & Timezone Consistency
- **Critical Fix**: All date parsing uses timezone-local creation to prevent UTC offset issues
- **Pattern**: `const [year, month, day] = dateString.split('-'); const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))`
- **Utility**: `src/utils/dateUtils.js` provides consistent date handling functions
- **Applied in**: `formatDate()` functions in Cobros.jsx, Payments.jsx, and masterDataService.js
- **Issue Fixed**: Date strings like "2025-06-02" now correctly display as "lun, 2 jun" instead of previous day

### Supabase Singleton Pattern (CRITICAL)
- **Implementation**: `src/services/supabaseClient.js` provides centralized client management
- **Usage Pattern**: Always use `import { getSupabaseClient } from '../services/supabaseClient.js'`
- **Never Use**: `import { createClient } from '@supabase/supabase-js'` directly in components
- **Benefits**: Eliminates "Multiple GoTrueClient instances" warnings, better performance, consistent behavior
- **Applied To**: All components, services, and pages (10+ files updated)
- **Critical Rule**: ONE client instance per application, managed centrally

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

### React Keys Best Practices (IMPLEMENTED)
- **Problem Solved**: "Encountered two children with the same key" warnings in AddShiftModal
- **Solution**: Composite keys for unique identification: `${selectedDate}-${turno.id}-${index}`
- **Pattern**: Always include context (date, parent ID, index) for uniqueness
- **Applied To**: AddShiftModal.jsx (3 key locations fixed)
- **Benefits**: Prevents React rendering conflicts, better performance, stable component identity

### Component Interaction Patterns (IMPLEMENTED)
- **Smart Disabling Logic**: Components can be disabled for new selection but enabled for deselection
- **Contextual Cursors**: `cursor-not-allowed` only when truly blocked, not for editable items
- **Flexible State Management**: Allow deselection even when components appear "disabled"
- **Applied To**: AddShiftModal worker selection system

### Styling Conventions
- **Tailwind CSS 4.1.7** with Vite plugin (`@tailwindcss/vite`)
- **Design tokens**: Blue/orange gradient theme (`from-blue-600 to-orange-600`)
- **Responsive**: Mobile-first with `use-mobile.js` hook
- **shadcn/ui**: Pre-built components in `src/components/ui/`

### Data Validation & Excel Import
- **Excel Processing**: XLSX.js for reading Excel files (.xlsx, .xls) in `src/pages/UploadFiles.jsx`
- **Intelligent Validation**: `excelValidationService.js` with 4 modes (standard, permissive, strict, legacy)
- **Worker Mapping**: Automatic name similarity matching with manual override capabilities  
- **Real-time Processing**: Validates dates, formats, and worker assignments during import
- **Smart Error Handling**: Provides detailed feedback and correction suggestions
- **ExcelJS Integration**: Advanced export functionality with professional formatting

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

## Sistema Financiero Histórico (IMPLEMENTED)

### Arquitectura de Valores Guardados
- **Principio Fundamental**: Los pagos/cobros usan valores históricos guardados en BD, NO recálculos
- **Campos Críticos**: `turnos.pago` y `turnos.cobro` - valores inmutables una vez guardados
- **Integridad Financiera**: Cambios futuros de tarifas NO afectan turnos completados anteriormente
- **Servicios Especializados**: `paymentsSupabaseService.js` y `cobrosSupabaseService.js` optimizados para valores históricos

### Sistema de Filtros Funcionales
- **Pagos**: Filtros año/mes con inicialización automática período actual
- **Cobros**: Filtros año/semana con rangos fechas visibles ("Semana 37 (9 sept - 15 sept)")
- **Estados Separados**: `selectedYear`, `selectedMonth`/`selectedWeek` para navegación independiente
- **Lógica Inteligente**: Datos filtrados vs datos totales según selección usuario

### Carga Inteligente de Datos (PERFORMANCE CRÍTICO)
- **Cache por Mes**: No recarga meses ya visitados, optimización memory/network
- **Paginación Automática**: Supera limitación 1000 registros Supabase, carga 2,205+ turnos
- **Detección Multi-Mes**: Semanas que cruzan meses (28jul-3ago) cargan ambos automáticamente
- **Refresco Inteligente**: Post-CRUD actualización automática sin refresh manual

## Sistema de Reglas de Turnos Configurables (ADVANCED BUSINESS LOGIC)

### Modal de Configuración de Reglas
- **Ubicación**: Componente integrado en Turnos.jsx con botón "Configurar Reglas"
- **Reglas de Solapamiento**: Control granular de combinaciones permitidas (1º+2º, 1º+3º, 2º+3º)
- **Reglas Día Siguiente**: "Si hace 3º turno hoy, mañana solo 2º turno" - lógica empresarial
- **Límites por Turno**: Cantidad máxima trabajadores por tipo turno (primer_turno, segundo_turno, tercer_turno)
- **Persistencia**: Configuración guardada en localStorage con key `transapp_turnos_rules`

### Validación en Tiempo Real
- **Eliminación Validación Hardcodeada**: Sistema anterior reemplazado por configuración dinámica
- **Alertas Visuales**: Feedback inmediato durante asignación trabajadores
- **Prevención Conflictos**: Detección automática violaciones reglas antes de guardar
- **UX Inteligente**: Workers bloqueados con explicación clara del motivo

### Arquitectura de Reglas
```javascript
const rulesConfig = {
  solapamiento: {
    'primer_segundo': true,    // Permite 1º + 2º mismo día
    'primer_tercero': false,   // Prohíbe 1º + 3º mismo día  
    'segundo_tercero': true    // Permite 2º + 3º mismo día
  },
  diaSiguiente: {
    'tercer_turno': ['segundo_turno']  // Si 3º hoy → solo 2º mañana
  },
  limites: {
    'primer_turno': 3,   // Máx 3 trabajadores en 1º turno
    'segundo_turno': 4,  // Máx 4 trabajadores en 2º turno
    'tercer_turno': 2    // Máx 2 trabajadores en 3º turno
  }
}
```

## Visualización de Tarifas Pagadas (DYNAMIC UI)

### Sistema de Tarifas Dinámico
- **Aparición Condicional**: Solo visible cuando hay turnos completados en semana actual
- **Valores Históricos**: Muestra tarifas reales del campo `pago` (inmutables)
- **Categorización Inteligente**: Agrupa por tipo turno y día especial automáticamente
- **Diseño Minimalista**: Cards horizontales con información concisa y profesional

### Implementación Técnica
- **Función `getTarifasPagadas()`**: Procesa turnos completados y extrae tarifas únicas
- **Lógica de Categorías**: Clasifica automáticamente (normales, sábados, domingos, feriados)
- **Update Automático**: Se actualiza en tiempo real con cambios de semana/datos

## Sección de Tarifas Centralizada (NEW MODULE)

### Arquitectura de Gestión Unificada
- **Ubicación**: `src/pages/Tarifas.jsx` - Sección independiente reemplaza Vehicles
- **Gestión Dual**: Tarifas de Calendario (5 tipos) + Tarifa de Cobros (1 tipo)
- **Persistencia**: Tabla `shift_rates` Supabase con `rate_name` como clave única
- **Patrón Upsert**: Actualización/inserción inteligente sin conflictos

### Interfaz Especializada
- **Modales Separados**: Configuración Calendario vs Configuración Cobros
- **Validación Numérica**: Inputs con steps apropiados y feedback visual
- **Estados Profesionales**: Loading, éxito, error con manejo robusto
- **Navegación Actualizada**: Sidebar con ícono DollarSign y ruta `/tarifas`

### Integración Sistema Existente
- **Compatibilidad Total**: Usa mismas tablas BD (`shift_rates`) sin ruptura
- **Formato Consistente**: Compatible con servicios existentes Calendario/Cobros
- **Fallback Robusto**: Manejo errores con valores por defecto apropiados

## Data Architecture Enhancements (PERFORMANCE & SCALABILITY)

### Paginación Inteligente de Turnos
- **Problema Resuelto**: Limitación 1000 registros Supabase
- **Implementación**: Loop automático con `range()` para cargar TODOS los turnos
- **Resultado**: 2,205+ turnos históricos (mayo-octubre 2025) completamente accesibles
- **Performance**: Carga inicial optimizada, cache inteligente post-carga

### Cache System por Demanda
```javascript
// Ejemplo de implementación cache inteligente
const monthCache = new Map()
const loadTurnosForMonth = async (year, month) => {
  const cacheKey = `${year}-${month}`
  if (monthCache.has(cacheKey)) {
    return monthCache.get(cacheKey) // ⚡ Cache hit
  }
  
  const data = await supabaseService.getTurnosMonth(year, month)
  monthCache.set(cacheKey, data) // 💾 Cache store
  return data
}
```

### Detección Automática Multi-Mes
- **Semanas Cruzadas**: Detecta automáticamente semanas que cruzan meses (ej: 28jul-3ago)
- **Carga Inteligente**: Fetch automático de ambos meses sin intervención usuario
- **UX Seamless**: Usuario no percibe complejidad técnica, datos siempre completos

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

## Development Patterns Actualizados (CRITICAL)

### Uso de Valores Históricos (CRITICAL PATTERN)
```javascript
// ✅ CORRECTO: Usar valores históricos guardados
const totalPagos = turnos.reduce((sum, turno) => sum + (turno.pago || 0), 0)
const totalCobros = turnos.reduce((sum, turno) => sum + (turno.cobro || 0), 0)

// ❌ INCORRECTO: Recalcular usando tarifas actuales
const totalPagos = turnos.reduce((sum, turno) => {
  const tarifa = getCurrentRate(turno.tipo) // NO hacer esto
  return sum + tarifa
}, 0)
```

### Patrón de Filtros Separados
- **Estados Independientes**: `selectedYear` + `selectedMonth/Week` por separado
- **Sincronización**: useEffect para combinar en `selectedPeriod` cuando sea necesario
- **Inicialización**: Siempre comenzar con período actual (año y mes/semana actuales)
- **Navegación**: Cambio independiente de año no afecta mes/semana si existe en nuevo año

### Sistema de Reglas Configurables
- **Eliminación Hardcode**: Nunca validaciones fijas en código, usar configuración dinámica
- **Persistencia localStorage**: Configuraciones de reglas con prefix `transapp_` apropiado
- **Validación Tiempo Real**: Evaluar reglas durante asignación, no después
- **UX Explicativo**: Siempre explicar por qué algo está bloqueado/permitido

### Cache Inteligente por Demanda
```javascript
// Patrón de cache mensual
const monthCache = new Map()
const loadIfNotCached = async (year, month) => {
  const key = `${year}-${month}`
  if (!monthCache.has(key)) {
    const data = await fetchDataFromSupabase(year, month)
    monthCache.set(key, data)
  }
  return monthCache.get(key)
}
```

### Enhanced UI/UX Patterns (PROFESSIONAL)

#### Modales Profesionales Optimizados
- **Z-index Correcto**: Evitar conflictos superposición con otros elementos
- **Área Selección Ampliada**: Más trabajadores visibles sin scroll excesivo
- **Posicionamiento Inteligente**: Centrado responsive en todas las resoluciones
- **Estados de Carga**: Feedback visual inmediato en todas las operaciones

#### Headers Contextuales
- **Información Relevante**: Período actual, tarifas aplicables, última actualización
- **Botones Accesibles**: Configuración, refresh, export siempre visibles
- **Espaciado Profesional**: Layout equilibrado sin sobrecarga visual

#### Sistema de Estados Sincronizado
- **Actualización Automática**: BD ↔ UI sin refreshes manuales
- **Feedback Inmediato**: Loading, success, error states bien definidos
- **Manejo Errores**: Fallbacks graceful con mensajes usuarios apropiados

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

## Turnos (Shifts) Management System

### Comprehensive Turnos Module (COMPLETED)
**Location**: `src/pages/Turnos.jsx` (710+ lines) - Complete shift management interface with calendar and table views

### Core Features Implemented
- **Full CRUD Operations**: Create, Read, Update, Delete shifts with complete validation
- **Dual View System**: Calendar view (grid) and Table view (list) with toggle button
- **Date Restrictions**: Only allow editing yesterday, today, and future dates
- **Name Formatting**: Chilean naming convention (primer nombre + primer apellido)
- **Bulk Operations**: Select all, copy week functionality, delete multiple shifts
- **Status Management**: Visual check marks for "programado" status instead of badges
- **Rate Integration**: Dynamic tariff calculation based on shift type and date

### Turnos Components Architecture
- **Turnos.jsx**: Main interface with calendar/table toggle and CRUD operations
- **AddShiftModal.jsx**: Worker assignment modal with date restrictions and validation
- **CopyShiftModal.jsx**: Weekly shift copying system (lunes to domingo)
- **Badge Component**: UI component for status display (`src/components/ui/badge.jsx`)
- **Checkbox Component**: Selection controls (`src/components/ui/checkbox.jsx`)

### Key Technical Features
- **Calendar Integration**: 7-day week view with proper date handling
- **Week Number Display**: ISO 8601 week number in header (e.g., "Semana 37 (9 sept - 15 sept 2025)")
  - Function: `getWeekNumber()` calculates week according to international standard
  - Memoized: `weekNumber` variable optimized with useMemo for performance
  - Format: Seamlessly integrated into `weekRange` variable
- **Worker Selection**: Dropdown with formatted names and availability checking
- **Shift Types**: primer_turno, segundo_turno, tercer_turno with rate calculations
- **State Management**: Real-time UI updates with optimistic rendering
- **Supabase Singleton Integration**: Uses getSupabaseClient() for reliable database operations
- **Validation System**: Date restrictions, worker availability, required fields
- **Unique React Keys**: Composite keys prevent duplicate key errors (`${selectedDate}-${turno.id}-${index}`)
- **Smart Worker Blocking**: Allows deselection of assigned workers while preventing double-assignment

### Modal Editing Enhancements (IMPLEMENTED)
- **Flexible Worker Management**: Workers can be deselected from any turn, eliminating "blocked worker" issues
- **Intelligent Cursor States**: Cursor shows "not-allowed" only for true restrictions, not for deselectable workers
- **Contextual Disabling**: Checkboxes disabled only for non-selected workers in conflicts
- **React Key Optimization**: Eliminates "Encountered two children with the same key" warnings

### Advanced Functionality
- **Weekly Copy System**: Copy entire weeks from lunes to domingo
- **Format Worker Names**: `formatWorkerName()` function shows "Juan López" format
- **Date Editing Rules**: `isDateEditable()` prevents editing past dates (except yesterday)
- **Bulk Selection**: Checkbox system for multiple shift operations
- **Dynamic Rates**: Integration with tariff system from Calendar/Cobros modules

### UI/UX Features
- **View Toggle**: Switch between Calendar (grid) and Table (list) views
- **Professional Design**: Consistent with TransApp theme (blue/orange gradients)
- **Loading States**: Visual feedback during all operations
- **Error Handling**: Comprehensive error messages and validation
- **Responsive Design**: Mobile-friendly interface with proper breakpoints

## Login Security System

### Login Attempt Limiting System (NEW)
**Configuration**: `src/config/loginConfig.js` - Central security configuration file

### Core Security Features
- **Max Attempts Limit**: Configurable maximum login attempts (default: 3)
- **Account Lockout**: Temporary user lockout after exceeding attempts
- **Lockout Duration**: Configurable lockout time (default: 15 minutes)
- **Easy Toggle**: Simple true/false to enable/disable entire system
- **Visual Feedback**: Progressive warnings and attempt counters

### Login Security Configuration
```javascript
// src/config/loginConfig.js
export const LOGIN_CONFIG = {
  loginAttemptsEnabled: true,    // Easy on/off toggle
  maxLoginAttempts: 3,           // Maximum attempts allowed
  lockoutDuration: 15,           // Minutes of lockout
  resetAttemptsOnSuccess: true,  // Reset counter on successful login
  showAttemptsRemaining: true    // Show remaining attempts to user
}
```

### Enhanced Authentication System
- **AuthContext Enhanced**: Extended with attempt tracking and lockout logic
- **Login Component Updated**: Progressive UI feedback and lockout display
- **Persistent Storage**: localStorage-based attempt tracking and lockout data
- **Automatic Recovery**: Lockout expires automatically after configured time
- **Security Documentation**: Complete guide in `docs/LOGIN_SECURITY.md`

### User Experience Features
- **Progressive Warnings**: "Te quedan X intentos" with visual indicators
- **Lockout Notification**: Clear messaging during account lockout
- **Disabled UI**: Button becomes disabled and shows lockout status
- **Color-coded Alerts**: Orange for warnings, red for lockout, green for success
- **Attempt Counter**: Real-time display of remaining attempts

### Technical Implementation
- **Enhanced AuthContext**: `src/contexts/AuthContext.jsx` with attempt tracking
- **Updated Login Page**: `src/pages/Login.jsx` with security UI elements
- **Configuration System**: Centralized config with easy enable/disable
- **Data Persistence**: Uses localStorage with `transapp-` prefixed keys
- **Automatic Cleanup**: Expired lockouts automatically cleared on app load

### Quick Configuration Changes
**To Disable System**:
```javascript
loginAttemptsEnabled: false,  // No limits, normal login
```

**To Enable System**:
```javascript
loginAttemptsEnabled: true,   // Full security system active
```

**Custom Limits**:
```javascript
maxLoginAttempts: 5,          // Allow 5 attempts instead of 3
lockoutDuration: 30,          // 30-minute lockout instead of 15
```

---

## 🔐 SECURITY DEVELOPMENT PATTERNS (MANDATORY)

### Environment Variables Pattern (ALWAYS USE)

#### ✅ **Node.js/CommonJS Scripts** (test files, MCP servers)
```javascript
// ALWAYS start with dotenv configuration
require('dotenv').config({ path: '.env.local' })

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// STRICT validation - NEVER skip this
if (!supabaseUrl || !serviceKey) {
  console.error('❌ ERROR: Required environment variables missing')
  console.error('Configure in .env.local:')
  console.error('  - VITE_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)  // Force exit, don't continue
}

// Now safe to use
const supabase = createClient(supabaseUrl, serviceKey)
```

#### ✅ **Frontend/Vite** (React components, services)
```javascript
// Use import.meta.env for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validation in critical paths
if (!supabaseUrl || !anonKey) {
  throw new Error('Missing Supabase configuration')
}
```

---

### ❌ **NEVER DO THIS** - Prohibited Patterns

#### 🚫 **Fallback with Hardcoded Values**
```javascript
// ❌ NEVER - Security incident waiting to happen
const key = process.env.SECRET || 'hardcoded-secret-value'
const token = process.env.TOKEN || 'eyJhbGci...'
```

#### 🚫 **Direct Hardcoding**
```javascript
// ❌ NEVER - Immediate security breach
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
const password = 'mypassword123'
```

#### 🚫 **Placeholder Fallbacks**
```javascript
// ❌ AVOID - Still promotes bad patterns
const key = process.env.KEY || 'your-key-here'
const key = process.env.KEY || 'tu_clave_aqui'
```

---

### Pre-Commit Security Checklist

Before ANY `git add` or `git commit`:

```bash
# 1. Search for JWT tokens
grep -r "eyJ" --include="*.js" --include="*.jsx" --include="*.cjs" --exclude-dir=node_modules

# 2. Search for service_role mentions
grep -r "service_role.*eyJ" --include="*.js" --include="*.cjs"

# 3. Search for fallback operators with values
grep -r "process\.env\.\w\+\s*||.*['\"]" --include="*.js" --include="*.cjs"

# 4. Check for passwords
grep -ri "password.*=.*['\"][^'\"]\+['\"]" --include="*.js" --include="*.jsx"
```

**If ANY of these return results outside `.env.local`, STOP and fix before committing.**

---

### Files That Should NEVER Be Committed

**Already Protected by .gitignore** ✅:
```
.env
.env.local
.env.development.local
.env.test.local  
.env.production.local
mcp.json
```

**Always Verify**: Before committing, run:
```bash
git status
git diff --cached
```

Look for:
- ❌ Any file containing `eyJ` (JWT tokens)
- ❌ Service role keys
- ❌ Passwords or API keys
- ❌ Database credentials

---

### Secure Development Workflow

#### 1. **Creating New Scripts**
```javascript
// Template for new Node.js scripts:
#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })

// Get and validate ALL required env vars
const REQUIRED_VARS = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = REQUIRED_VARS.filter(v => !process.env[v])

if (missing.length > 0) {
  console.error('❌ Missing required variables:', missing.join(', '))
  console.error('Add them to .env.local')
  process.exit(1)
}

// Rest of your script...
```

#### 2. **Code Review Process**
When reviewing PRs or your own code:
- ✅ All credentials from `.env.local`
- ✅ No `||` fallbacks with hardcoded values
- ✅ Strict validation with `process.exit(1)`
- ✅ Error messages guide to `.env.local`
- ✅ No JWT tokens in code

#### 3. **Testing Locally**
```bash
# Before testing new scripts:
# 1. Verify .env.local exists
ls -la .env.local

# 2. Verify it has required variables
cat .env.local | grep SUPABASE

# 3. Test the script
node test/your-new-script.cjs
```

---

### Environment Variable Reference

#### **`.env.local`** (Local Development)
```bash
# Frontend variables (VITE_ prefix required)
VITE_SUPABASE_URL=https://csqxopqlgujduhmwxixo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (public key, safe)
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=transapp123

# Backend/Script variables (NO VITE_ prefix)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (SECRET - admin access)
```

#### **Vercel** (Production/Preview)
Set in Dashboard: https://vercel.com/cris-projects-245b6b28/transapp/settings/environment-variables
- All variables from `.env.local`
- Scope: Production, Preview, Development (as needed)

---

### Emergency Response Plan

**If you accidentally commit secrets**:

1. **STOP immediately** - Don't push if not pushed yet
2. **Remove from staging**: `git reset HEAD <file>`
3. **If already pushed**: Follow incident response in `SECURITY_AUDIT_2025-10-01.md`
4. **Rotate compromised keys** immediately in respective services
5. **Update `.env.local`** with new keys
6. **Update Vercel** environment variables
7. **Document incident** in `docs/SECURITY_IMPROVEMENTS.md`

---

### Security Resources

- 📄 **Full Audit**: `SECURITY_AUDIT_2025-10-01.md` (root directory)
- 📄 **Incident History**: `docs/SECURITY_IMPROVEMENTS.md`
- 📄 **Login Security**: `docs/LOGIN_SECURITY.md`
- 🔗 **Supabase Dashboard**: https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo
- 🔗 **Vercel Env Vars**: https://vercel.com/cris-projects-245b6b28/transapp/settings/environment-variables

---

### Remember

> **"If you're not sure whether to hardcode it, DON'T."**
> 
> **"Environment variables exist for a reason - USE THEM."**
>
> **"5 minutes to use dotenv, 5 hours to fix a security breach."**
