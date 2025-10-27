# 🚀 INICIO RÁPIDO - Conectar con Supabase

## ✅ TODO ESTÁ LISTO - Solo necesitas 3 pasos

---

## PASO 1: Crear Proyecto en Supabase (2 minutos)

1. **Ir a**: https://supabase.com/dashboard
2. **Click en**: "New project"
3. **Completar**:
   - Nombre: `punta-de-lobos-kpi`
   - Database Password: (Crea una y guárdala)
   - Region: South America (Brasil es la más cercana)
4. **Click**: "Create new project"
5. **Esperar** ~2 minutos mientras se crea

---

## PASO 2: Copiar Credenciales (1 minuto)

1. **Ir a**: Settings (⚙️) → API
2. **Copiar**:
   ```
   📋 Project URL
   Ejemplo: https://abcdefgh.supabase.co
   
   🔑 Project API keys → anon/public
   Ejemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Abrir**: El archivo `.env.local` en la raíz del proyecto
4. **Reemplazar** estas líneas:
   ```bash
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co  ← PEGAR TU URL
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui            ← PEGAR TU KEY
   ```
5. **Guardar** el archivo

---

## PASO 3: Crear Tablas (2 minutos)

1. **En Supabase Dashboard**: Ir a SQL Editor
2. **Click**: "New query"
3. **Copiar** todo el contenido del archivo: `sql/puntadelobos_setup.sql`
4. **Pegar** en el editor
5. **Click**: Run (▶️)
6. **Verificar**: Debe decir "Success" con 3 tablas creadas

---

## 🎯 Probar la Conexión

### Opción A: Con pnpm (recomendado)
```powershell
pnpm install
pnpm dev
```

### Opción B: Con npm
```powershell
npm install
npm run dev
```

### Verificar
1. Abre: http://localhost:5173
2. Login: `admin` / `puntadelobos2025`
3. En el menú lateral, click en **"Test Supabase"**
4. Deberías ver: ✅ **Conectado** con estadísticas de la BD

---

## 📁 Archivos Importantes

```
✅ Ya Creados:
├── .env.local                          ← Completa tus credenciales aquí
├── sql/puntadelobos_setup.sql         ← Ejecuta esto en Supabase SQL Editor
├── src/services/supabaseClient.js     ← Cliente Supabase (singleton)
├── src/services/supabaseHelpers.js    ← Funciones CRUD completas
├── src/components/SupabaseConnectionTest.jsx  ← Test visual
├── src/pages/TestSupabase.jsx         ← Página de prueba
└── CONEXION_SUPABASE_COMPLETA.md      ← Guía detallada
```

---

## 🔥 Funciones Listas para Usar

```javascript
import { 
  getPersonas,      // Obtener personas
  createPersona,    // Crear persona
  updatePersona,    // Actualizar persona
  deletePersona,    // Eliminar persona
  searchPersonas,   // Buscar por nombre/RUT
  getRegistros,     // Obtener registros
  getEstadisticas   // Obtener estadísticas
} from '@/services/supabaseHelpers'

// Ejemplo:
const { data, error } = await getPersonas(1, 10)
```

---

## ❓ Problemas Comunes

### "Invalid API key"
- Verifica que copiaste la key completa (es muy larga)
- No debe tener espacios al inicio/final
- Debe empezar con `eyJ`

### "Failed to fetch"
- Verifica que la URL incluya `https://`
- Formato correcto: `https://tuproyecto.supabase.co`

### "relation does not exist"
- Ejecuta el script SQL: `sql/puntadelobos_setup.sql`
- En Supabase Dashboard → SQL Editor → New query → Pega → Run

---

## 🎊 ¡Listo!

Si al ir a `/test-supabase` ves:
- ✅ **Estado: Conectado**
- 📊 **Estadísticas de la base de datos**
- 📝 **Puedes crear y buscar personas**

**¡Tu app está conectada a Supabase!** 🎉

---

## 📚 Documentación Completa

- `CONEXION_SUPABASE_COMPLETA.md` - Guía detallada
- `SETUP_SUPABASE_RAPIDO.md` - Instrucciones paso a paso
- [Docs Supabase](https://supabase.com/docs)

---

**¿Necesitas ayuda?** Abre la consola del navegador (F12) y verifica los logs.
