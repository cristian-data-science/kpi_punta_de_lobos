# 🧪 Test Scripts

Esta carpeta contiene todos los scripts de prueba, verificación y utilidades de desarrollo.

## 📁 Estructura

### Scripts de Prueba
- `test-mcp.js` - Pruebas del servidor MCP
- `test_data.js` - Pruebas de datos de prueba
- `test_payments.js` - Pruebas del sistema de pagos
- `test_supabase.js` - Pruebas de conectividad Supabase
- `test_validation.js` - Pruebas de validación

### Scripts de Verificación
- `verify-table-access.cjs` - Verificación de acceso a tablas Supabase
- `verify-workers.js` - Verificación de trabajadores en BD
- `verify-supabase.js` - Verificación general de Supabase

### Scripts de Setup
- `setup-complete.js` - Script de configuración completa
- `setup-supabase.js` - Configuración inicial de Supabase
- `create-workers.js` - Creación de trabajadores de prueba

### Scripts de Utilidades
- `update-contracts-to-fijo.cjs` - Actualización masiva de contratos
- `debug_validation.js` - Debugging de validaciones
- `list-tables.js` - Listado de tablas disponibles

## 🚀 Uso

```bash
# Ejecutar desde la raíz del proyecto
node test/test-mcp.js
node test/verify-table-access.cjs
node test/setup-complete.js
```

## 📝 Notas

- Los archivos `.cjs` son para CommonJS (requiere `require()`)
- Los archivos `.js` son para ES modules (requiere `import`)
- Todos los scripts están configurados para el entorno de desarrollo
