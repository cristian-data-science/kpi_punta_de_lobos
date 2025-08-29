#!/bin/bash

# TransApp Build Script
# Script para construir la aplicación TransApp

echo "🚛 TransApp - Build Script"
echo "=========================="

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar que pnpm esté instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm no está instalado"
    echo "Instala pnpm con: npm install -g pnpm"
    exit 1
fi

echo "✅ Verificando dependencias..."

# Verificar versión de Node.js
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Verificar versión de pnpm
PNPM_VERSION=$(pnpm --version)
echo "📦 pnpm version: $PNPM_VERSION"

echo ""
echo "🔧 Instalando dependencias..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""
echo "🔍 Ejecutando linter..."
pnpm lint

if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: Se encontraron problemas en el linter"
    echo "Continuando con el build..."
fi

echo ""
echo "🏗️  Construyendo aplicación para producción..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Error durante el build"
    exit 1
fi

echo ""
echo "✅ Build completado exitosamente!"
echo "📁 Los archivos están en el directorio 'dist/'"
echo ""
echo "Para probar el build localmente:"
echo "  pnpm preview"
echo ""
echo "🚀 ¡Listo para deploy!"
