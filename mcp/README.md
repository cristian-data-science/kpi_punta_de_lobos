# 🔌 MCP Server (Desarrollo Completo)

Servidor único del Model Context Protocol (MCP) para TransApp con **permisos completos de desarrollo**.

## 🚀 Servidor Único

**`mcp-server-simple.cjs`** - **ÚNICO SERVIDOR FUNCIONAL**
- ✅ Permisos completos (Service Role)
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Operaciones DDL (Data Definition Language)
- ✅ Eliminación masiva segura
- ✅ Metadatos de auditoría integrados

## 🔧 Herramientas Completas

### CRUD Operations
1. `query_workers` - Consultar trabajadores con filtros avanzados
2. `create_worker` - Crear nuevos trabajadores
3. `update_worker` - Actualizar trabajadores existentes
4. `delete_worker` - Eliminar trabajadores por ID
5. `query_shifts` - Consultar turnos con relaciones
6. `create_shift` - Crear nuevos turnos
7. `update_shift` - Actualizar turnos existentes
8. `delete_shift` - Eliminar turnos por ID

### Advanced Operations
9. `execute_sql` - Ejecutar cualquier SQL (SELECT/INSERT/UPDATE/DELETE)
10. `execute_ddl` - Ejecutar DDL (CREATE/ALTER/DROP)
11. `bulk_delete` - Eliminación masiva con condiciones
12. `get_database_schema` - Esquema completo con metadatos

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
