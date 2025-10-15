# Script de Configuracion Automatica de Supabase para Punta de Lobos
# Ejecutar en PowerShell: .\setup-supabase.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   PUNTA DE LOBOS - Setup Supabase" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que pnpm esta instalado
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: pnpm no esta instalado" -ForegroundColor Red
    Write-Host "   Instala pnpm primero: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "pnpm encontrado" -ForegroundColor Green

# Verificar si existe .env.local
Write-Host ""
Write-Host "Verificando archivo .env.local..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local no encontrado" -ForegroundColor Red
    Write-Host "   Crea el archivo .env.local en la raiz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host ".env.local encontrado" -ForegroundColor Green

# Leer variables de entorno
Write-Host ""
Write-Host "Leyendo configuracion..." -ForegroundColor Yellow

$envContent = Get-Content ".env.local" | Out-String
$supabaseUrl = ($envContent | Select-String -Pattern "VITE_SUPABASE_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$supabaseKey = ($envContent | Select-String -Pattern "VITE_SUPABASE_ANON_KEY=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

# Validar credenciales
$needsConfig = $false

if ($supabaseUrl -match "tu-proyecto" -or [string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "VITE_SUPABASE_URL no configurada" -ForegroundColor Yellow
    $needsConfig = $true
}

if ($supabaseKey -match "tu_anon_key" -or [string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "VITE_SUPABASE_ANON_KEY no configurada" -ForegroundColor Yellow
    $needsConfig = $true
}

if ($needsConfig) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "CONFIGURACION REQUERIDA" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para obtener tus credenciales de Supabase:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Ve a: https://supabase.com/dashboard" -ForegroundColor Cyan
    Write-Host "2. Crea un nuevo proyecto (si aun no tienes uno)" -ForegroundColor Cyan
    Write-Host "3. Ve a Settings > API" -ForegroundColor Cyan
    Write-Host "4. Copia: Project URL y anon/public key" -ForegroundColor Cyan
    Write-Host "5. Edita .env.local y pega tus valores" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Luego ejecuta este script nuevamente." -ForegroundColor Yellow
    Write-Host ""
    
    # Preguntar si quiere abrir el dashboard
    $response = Read-Host "Abrir Supabase Dashboard en el navegador? (s/n)"
    if ($response -eq "s" -or $response -eq "S") {
        Start-Process "https://supabase.com/dashboard"
    }
    
    exit 0
}

Write-Host "Credenciales configuradas" -ForegroundColor Green
Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray

# Verificar dependencias de Node
Write-Host ""
Write-Host "Instalando dependencias..." -ForegroundColor Yellow

# Verificar si @supabase/supabase-js esta instalado
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$hasSupabase = $packageJson.dependencies.PSObject.Properties.Name -contains "@supabase/supabase-js"

if (-not $hasSupabase) {
    Write-Host "Instalando @supabase/supabase-js..." -ForegroundColor Yellow
    pnpm add @supabase/supabase-js
} else {
    Write-Host "@supabase/supabase-js ya instalado" -ForegroundColor Green
}

# Instalar todas las dependencias
Write-Host "Verificando todas las dependencias..." -ForegroundColor Yellow
pnpm install --silent

Write-Host "Dependencias instaladas" -ForegroundColor Green

# Mostrar siguiente paso
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configurar la base de datos:" -ForegroundColor Yellow
Write-Host "   - Ve a: $supabaseUrl" -ForegroundColor White
Write-Host "   - Abre SQL Editor" -ForegroundColor White
Write-Host "   - Ejecuta el script: sql/puntadelobos_setup.sql" -ForegroundColor White
Write-Host ""
Write-Host "2. Iniciar el servidor de desarrollo:" -ForegroundColor Yellow
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Probar la conexion:" -ForegroundColor Yellow
Write-Host "   - Abre http://localhost:5173" -ForegroundColor White
Write-Host "   - Ve a la ruta /test-supabase" -ForegroundColor White
Write-Host "   - Verifica que este conectado" -ForegroundColor White
Write-Host ""
Write-Host "Documentacion completa: CONEXION_SUPABASE_COMPLETA.md" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere iniciar el servidor
$response = Read-Host "Iniciar el servidor de desarrollo ahora? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host ""
    Write-Host "Iniciando servidor..." -ForegroundColor Green
    pnpm dev
} else {
    Write-Host ""
    Write-Host "Para iniciar mas tarde, ejecuta: pnpm dev" -ForegroundColor Cyan
}
