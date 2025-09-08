# 🔌 MCP Servers

Esta carpeta contiene los servidores del Model Context Protocol (MCP) para TransApp.

## 📁 Estructura

### Servidores MCP
- `mcp-server-simple.cjs` - Servidor MCP simplificado (ACTIVO)
- `mcp-server-simple.js` - Versión ES modules del servidor simple
- `mcp-server-supabase.cjs` - Servidor MCP avanzado con SDK completo
- `mcp-server-supabase.js` - Versión ES modules del servidor avanzado

## 🚀 Servidor Activo

**`mcp-server-simple.cjs`** es el servidor actualmente configurado en `../mcp.json`

### Herramientas Disponibles
1. `query_workers` - Consultar trabajadores con filtros
2. `create_worker` - Crear nuevos trabajadores
3. `update_worker` - Actualizar trabajadores existentes
4. `query_shifts` - Consultar turnos con relaciones
5. `create_shift` - Crear nuevos turnos
6. `execute_sql` - Ejecutar consultas SQL seguras
7. `get_database_schema` - Obtener esquema de base de datos

## 🔧 Configuración

El servidor MCP está configurado en `../mcp.json`:
```json
{
  "mcpServers": {
    "transapp-supabase": {
      "command": "node",
      "args": ["mcp/mcp-server-simple.cjs"]
    }
  }
}
```

## 🧪 Pruebas

```bash
# Desde la raíz del proyecto
node mcp/mcp-server-simple.cjs

# O usar el script de pruebas
node test/test-mcp.js
```

## 🔗 Integración

- **Supabase**: Conexión directa a PostgreSQL
- **TransApp**: Integrado con sistema existente
- **Claude Desktop**: Compatible con MCP protocol

## 📝 Desarrollo

Para desarrollar nuevas herramientas MCP:
1. Editar `mcp-server-simple.cjs`
2. Agregar nueva herramienta en `tools` object
3. Probar con `node mcp/mcp-server-simple.cjs`
4. Verificar integración con `test/test-mcp.js`
