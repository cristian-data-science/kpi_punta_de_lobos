# 📋 INSTRUCCIONES PARA COMPLETAR METADATOS

## 🎯 Objetivo
Agregar campos `created_at` y `updated_at` a las tablas `trabajadores` y `turnos` para auditoría de registros.

## ✅ Estado Actual
- **trabajadores**: ✅ `created_at` + ✅ `updated_at` (COMPLETO)
- **turnos**: ✅ `created_at` + ❌ `updated_at` (FALTA)

## 🛠️ Pasos para Completar

### 1. Acceder a Supabase
- Ve a: https://supabase.com/dashboard
- Selecciona tu proyecto TransApp
- Ve a: **SQL Editor**

### 2. Ejecutar SQL
Copia y pega el contenido del archivo `sql/complete_metadata_setup.sql`:

```sql
-- AGREGAR updated_at a turnos
ALTER TABLE turnos 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- CREAR FUNCIÓN PARA AUTO-UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS PARA AUTO-ACTUALIZACIÓN
DROP TRIGGER IF EXISTS update_turnos_updated_at ON turnos;
CREATE TRIGGER update_turnos_updated_at
    BEFORE UPDATE ON turnos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trabajadores_updated_at ON trabajadores;
CREATE TRIGGER update_trabajadores_updated_at
    BEFORE UPDATE ON trabajadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Verificar Resultados
Ejecuta el script de prueba:
```bash
node test/test-metadata.cjs
```

Deberías ver:
```
✅ created_at: EXISTE
✅ updated_at: EXISTE
🎉 ¡METADATOS COMPLETOS EN AMBAS TABLAS!
```

## 🎯 Resultado Final

### 📋 Campos de Auditoría
- **`created_at`**: Timestamp de creación (automático)
- **`updated_at`**: Timestamp de actualización (automático con triggers)

### 🔄 Funcionalidad Automática
- **Al crear**: `created_at` y `updated_at` se establecen automáticamente
- **Al actualizar**: Solo `updated_at` se actualiza automáticamente
- **Timezone**: UTC con zona horaria (`TIMESTAMPTZ`)

### 💡 Beneficios
- ✅ Auditoría completa de cambios
- ✅ Rastreo temporal de registros  
- ✅ Triggers automáticos (sin intervención manual)
- ✅ Compatibilidad con MCP y aplicación React

## 📁 Archivos Relacionados
- `sql/complete_metadata_setup.sql` - Script SQL principal
- `test/test-metadata.cjs` - Prueba de funcionalidad
- `sql/add_timestamp_metadata.sql` - Script completo (alternativo)
