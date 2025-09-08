# 🗄️ SQL Scripts

Esta carpeta contiene todos los scripts SQL para la configuración de la base de datos Supabase.

## 📁 Estructura

### Scripts de Configuración
- `supabase_setup.sql` - Script completo de configuración inicial
- `supabase_simple.sql` - Script simplificado para desarrollo

## 📋 Contenido de los Scripts

### supabase_setup.sql
- ✅ Creación de tablas (`trabajadores`, `turnos`)
- ✅ Configuración de UUID como PK
- ✅ Índices para optimización
- ✅ Políticas RLS (Row Level Security)
- ✅ Inserción de 14 trabajadores reales
- ✅ Datos de prueba de turnos

### supabase_simple.sql
- ✅ Versión minimalista para tests
- ✅ Estructura básica de tablas
- ✅ Sin datos de prueba

## 🚀 Uso

### Configuración Inicial
```sql
-- Ejecutar en Supabase SQL Editor
\i supabase_setup.sql
```

### Verificación
```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Contar registros
SELECT 'trabajadores' as tabla, count(*) FROM trabajadores
UNION ALL
SELECT 'turnos' as tabla, count(*) FROM turnos;
```

## 🔧 Estructura de Tablas

### trabajadores
```sql
- id (uuid, PK)
- nombre (text)
- rut (text, unique)
- contrato (text: 'fijo'|'eventual'|'planta')
- telefono (text)
- estado (text: 'activo'|'inactivo')
- created_at (timestamp)
- updated_at (timestamp)
```

### turnos
```sql
- id (uuid, PK)
- trabajador_id (uuid, FK -> trabajadores.id)
- fecha (date)
- turno_tipo (text: 'primer_turno'|'segundo_turno'|'tercer_turno')
- estado (text: 'programado'|'completado'|'cancelado')
- created_at (timestamp)
```

## 📝 Notas

- Todos los IDs son UUID v4 generados automáticamente
- RLS habilitado para seguridad
- Índices en campos de búsqueda frecuente (rut, fecha)
- Políticas de acceso configuradas para operaciones CRUD
