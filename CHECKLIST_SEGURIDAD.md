# ✅ CHECKLIST DE SEGURIDAD - ANTES DE HACER PUSH

## 🔴 ACCIÓN CRÍTICA REQUERIDA

Este checklist DEBE completarse **ANTES** de hacer push al repositorio público.

---

## 📋 PASO A PASO

### 1️⃣ REGENERAR CREDENCIALES DE SUPABASE (CRÍTICO)

**⚠️ RAZÓN:** Se encontró el archivo `mcp.json` con una SERVICE_ROLE_KEY expuesta que da acceso total a tu base de datos.

**Pasos:**

```bash
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: Settings > API
4. En la sección "Service Role Key":
   - Clic en "Reset service role key"
   - Confirma la acción
   - COPIA la nueva key
5. En la sección "Project API keys" (opcional pero recomendado):
   - Clic en "Generate new anon key"
   - COPIA la nueva key
```

**Actualiza tu `.env.local`:**

```env
# Actualiza con las NUEVAS credenciales
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=<NUEVA_ANON_KEY>
```

**Actualiza tu `mcp.json` local (si lo usas):**

```json
{
  "mcpServers": {
    "transapp-supabase": {
      "env": {
        "SUPABASE_URL": "https://tu-proyecto.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "<NUEVA_SERVICE_ROLE_KEY>"
      }
    }
  }
}
```

- [ ] ✅ Service Role Key regenerada
- [ ] ✅ Anon Key regenerada (opcional)
- [ ] ✅ `.env.local` actualizado
- [ ] ✅ `mcp.json` local actualizado (si aplica)

---

### 2️⃣ CAMBIAR CONTRASEÑA DE ADMIN

**⚠️ RAZÓN:** Había una contraseña por defecto hardcodeada (`transapp123`) que fue eliminada.

**Edita tu `.env.local`:**

```env
# Cambia por una contraseña SEGURA
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=<TU_CONTRASEÑA_SEGURA>
```

**Recomendaciones para contraseña segura:**
- Mínimo 12 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- No usar palabras comunes
- Ejemplo: `P@ssW0rd!2025#Lobos`

- [ ] ✅ Contraseña cambiada en `.env.local`
- [ ] ✅ Contraseña cumple requisitos de seguridad

---

### 3️⃣ VERIFICAR ARCHIVOS SENSIBLES NO ESTÁN EN GIT

**Ejecuta estos comandos y verifica que la salida esté VACÍA:**

```bash
# PowerShell
cd c:\Users\patag\git_provisorio\kpi\kpi

# Verificar .env.local (debe estar vacío)
git ls-files .env.local

# Verificar mcp.json (debe estar vacío)
git ls-files mcp.json

# Verificar que no hay JWTs en código fuente (no debe encontrar nada)
grep -r "eyJ" src/
```

**Resultados esperados:**
- `git ls-files .env.local` → **(vacío)**
- `git ls-files mcp.json` → **(vacío)**
- `grep -r "eyJ" src/` → **(sin resultados)**

- [ ] ✅ `.env.local` NO está en Git
- [ ] ✅ `mcp.json` NO está en Git
- [ ] ✅ No hay JWTs en el código fuente

---

### 4️⃣ VERIFICAR .GITIGNORE

**Abre `.gitignore` y confirma que incluye:**

```gitignore
# Archivos con credenciales
.env
.env.local
.env.*.local
mcp.json

# Archivos de debug
config_snapshot.json
debug_*.cjs
test_*.cjs
```

- [ ] ✅ `.gitignore` incluye todos los archivos sensibles

---

### 5️⃣ REVISAR EL CÓDIGO FUENTE

**Busca posibles credenciales hardcodeadas:**

```bash
# Buscar contraseñas
grep -r "password.*=" src/ | grep -v "password:"

# Buscar API keys
grep -r "api.*key" src/ -i

# Buscar URLs de Supabase hardcodeadas
grep -r "supabase.co" src/
```

**Resultado esperado:**
- Solo deben aparecer referencias a `import.meta.env.VITE_*`
- NO deben aparecer valores hardcodeados

- [ ] ✅ No hay credenciales hardcodeadas en código
- [ ] ✅ Solo referencias a variables de entorno

---

### 6️⃣ PROBAR LA APLICACIÓN LOCALMENTE

**Verifica que todo funciona después de los cambios:**

```bash
# Instalar dependencias (si es necesario)
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Abrir http://localhost:5173
```

**Prueba:**
- [ ] ✅ La app inicia sin errores
- [ ] ✅ Login funciona con nuevas credenciales
- [ ] ✅ Conexión a Supabase funciona
- [ ] ✅ Funcionalidades principales funcionan

---

### 7️⃣ REVISAR CAMBIOS DE GIT

```bash
# Ver todos los cambios que se van a commitear
git status

# Ver el diff de archivos modificados
git diff src/config/loginConfig.js
git diff README.md
```

**Confirma que:**
- [ ] ✅ `mcp.json` aparece como "deleted" (D)
- [ ] ✅ Archivos reorganizados correctamente
- [ ] ✅ No hay archivos sensibles en staging

---

### 8️⃣ HACER COMMIT

**Si TODO está ✅, crea el commit:**

```bash
git commit -m "🔒 Reorganización del proyecto y corrección de seguridad

- Organizada estructura de carpetas (docs/, scripts/, config/)
- Removido mcp.json del tracking (contenía credenciales)
- Eliminadas contraseñas hardcodeadas
- Nuevo README.md limpio y profesional
- Creado reporte de auditoría de seguridad

IMPORTANTE: Credenciales de Supabase regeneradas"
```

- [ ] ✅ Commit creado exitosamente

---

### 9️⃣ (OPCIONAL) LIMPIAR HISTORIAL DE GIT

**⚠️ Solo si el repositorio YA era público con credenciales expuestas:**

```bash
# Opción 1: BFG Repo-Cleaner (recomendado)
# Descargar de: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files mcp.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Opción 2: git filter-branch (más complejo)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch mcp.json" \
  --prune-empty --tag-name-filter cat -- --all
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**⚠️ ADVERTENCIA:** Esto reescribe el historial. Si otros tienen clones del repo, necesitarán hacer `git clone` nuevamente.

- [ ] ✅ Historial limpiado (si aplica)

---

### 🔟 PUSH AL REPOSITORIO

```bash
# Push normal
git push origin master

# Si limpiaste el historial, necesitarás force push
git push --force origin master
```

- [ ] ✅ Push realizado exitosamente

---

## 📊 RESUMEN FINAL

Marca todas las tareas completadas:

### Seguridad Crítica
- [ ] Service Role Key regenerada
- [ ] Anon Key regenerada (opcional)
- [ ] Contraseña de admin cambiada
- [ ] `.env.local` actualizado con nuevas credenciales

### Verificaciones
- [ ] `.env.local` NO está en Git
- [ ] `mcp.json` NO está en Git
- [ ] No hay JWTs en código fuente
- [ ] `.gitignore` correcto
- [ ] Código sin credenciales hardcodeadas

### Testing
- [ ] App funciona localmente
- [ ] Login funciona
- [ ] Conexión Supabase funciona

### Git
- [ ] Cambios revisados
- [ ] Commit creado
- [ ] Push realizado

---

## ✅ PROYECTO LISTO PARA SER PÚBLICO

Una vez completado TODO el checklist, tu proyecto estará **seguro** para ser un repositorio público.

---

## 🆘 AYUDA

Si encuentras problemas:

1. **Lee el reporte completo:** `SECURITY_AUDIT_REPORT.md`
2. **Revisa la reorganización:** `REORGANIZACION_RESUMEN.md`
3. **Consulta la documentación:** `docs/README.md`

---

## 📞 RECURSOS ADICIONALES

- [Supabase Security Docs](https://supabase.com/docs/guides/platform/security)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Git Filter-Branch Documentation](https://git-scm.com/docs/git-filter-branch)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

**Última actualización:** 27 de octubre de 2025  
**Versión:** 1.0.0
