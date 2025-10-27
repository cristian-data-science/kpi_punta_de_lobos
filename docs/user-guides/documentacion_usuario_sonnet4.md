# TransApp - Guía de Usuario Completa
## Sistema de Gestión de Transporte Empresarial

---

### 📌 Introducción a TransApp

**TransApp** es su nueva plataforma web para gestionar todas las operaciones de transporte de manera digital y automatizada. Diseñada especialmente para reemplazar las planillas Excel tradicionales, TransApp ofrece:

- **Gestión de trabajadores** con validación automática de RUT chileno
- **Programación de turnos** con calendario visual intuitivo  
- **Cálculo automático de pagos** según tarifas configurables
- **Generación de cobros semanales** con exportación a Excel profesional
- **Dashboard ejecutivo** con métricas financieras en tiempo real
- **Reportes automáticos** eliminando errores manuales de cálculo

### 🔐 Acceso al Sistema

**URL de acceso**: https://transapp-qjloxuf0s-cris-projects-245b6b28.vercel.app

**Credenciales de acceso**:
- **Usuario**: `admin`
- **Contraseña**: `transapp123`

**Sistema de seguridad**:
- Máximo 3 intentos de login
- Bloqueo temporal de 15 minutos tras exceder intentos
- Sesión persistente - no necesita re-autenticarse constantemente

---

## 🏠 Dashboard Principal - Vista Ejecutiva

El **Dashboard** es su centro de control con información financiera actualizada en tiempo real.

### Métricas Principales

**Tarjetas de Resumen**:
- **Ingresos Totales**: Suma de todos los cobros completados
- **Costos Totales**: Suma de todos los pagos a trabajadores  
- **Ganancia Neta**: Diferencia entre ingresos y costos
- **Turnos Completados**: Cantidad total de servicios realizados

### Filtros Inteligentes

**Filtros Financieros** (tarjetas superiores):
- **Todo**: Todas las operaciones históricas
- **Año**: Datos del año actual completo
- **Mes**: Solo el mes actual

**Filtros de Tendencias** (gráfico central):
- **7d**: Últimos 7 días de actividad
- **30d**: Último mes de operaciones  
- **90d**: Últimos 3 meses para análisis de tendencias

**Filtros Top Trabajadores** (ranking):
- **Todo**: Ranking histórico completo
- **Año**: Mejores trabajadores del año
- **Mes anterior**: Rendimiento del mes pasado
- **Mes actual**: Desempeño en curso

### 📊 Gráficos y Análisis

**Gráfico de Tendencias**:
- Líneas de ingresos y costos diarios
- Identificación de patrones y picos de actividad
- Análisis visual de rentabilidad por período

**Top 5 Trabajadores**:
- Ranking por cantidad de turnos completados
- Identificación de personal más productivo
- Datos para incentivos y reconocimientos

---

## 👥 Gestión de Trabajadores

### Funciones Principales

**Crear Nuevo Trabajador**:
1. Clic en botón **"Agregar Trabajador"** 
2. Completar formulario con datos requeridos:
   - **Nombre completo** (primer nombre + primer apellido para turnos)
   - **RUT** con validación automática chilena
   - **Tipo de contrato**: Fijo/Eventual/Planta
   - **Teléfono** de contacto
3. Sistema valida RUT y previene duplicados
4. Confirmación automática de registro exitoso

**Buscar y Filtrar**:
- **Barra de búsqueda**: Por nombre o RUT
- **Filtro por contrato**: Ver solo tipo específico
- **Filtro por estado**: Activos/Inactivos/Todos

**Editar Trabajador**:
1. Clic en ícono **editar** (lápiz) en la fila del trabajador
2. Campos se vuelven editables directamente en la tabla
3. Botones **Guardar** (✓) / **Cancelar** (✗) aparecen
4. Cambios se sincronizan automáticamente con la base de datos

**Gestionar Estados**:
- **Activar/Desactivar**: Botón de estado en cada fila
- **Trabajadores inactivos**: No aparecen en programación de turnos
- **Eliminación**: Solo permitida para trabajadores inactivos con confirmación

### 📋 Carga Masiva de Trabajadores

**Función de Importación CSV**:
1. Preparar archivo CSV con columnas: `nombre,rut,contrato,telefono`
2. Clic en **"Carga Masiva"**
3. Seleccionar archivo CSV preparado
4. Sistema procesa y valida cada registro
5. Reporte de éxitos y errores al finalizar

---

## 🕐 Programación de Turnos

### Interface de Turnos

**Vistas Disponibles**:
- **Vista Calendario**: Cuadrícula semanal visual (predeterminada)
- **Vista Tabla**: Lista detallada con filtros avanzados

### Gestión de Turnos Semanal

**Navegación de Semanas**:
- Botones **anterior/siguiente** para navegar
- **Botón "Hoy"** para volver a semana actual
- Visualización **"Semana del [fecha] al [fecha]"**

**Tipos de Turno**:
- **Primer Turno**: Horario matutino estándar
- **Segundo Turno**: Horario vespertino  
- **Tercer Turno**: Horario nocturno (mayor pago)

### Asignar Trabajadores a Turnos

**Proceso de Asignación**:
1. **Seleccionar fecha**: Clic en cualquier día de la semana
2. **Elegir tipo de turno**: Primer/Segundo/Tercer turno
3. **Asignar trabajadores**: 
   - Lista desplegable con trabajadores activos
   - Formato: "Juan López" (primer nombre + apellido)
   - Validación automática de disponibilidad
4. **Confirmar asignación**: Botón **"Agregar Turno"**

**Reglas de Validación**:
- No se puede asignar el mismo trabajador a múltiples turnos el mismo día
- Restricciones configurables de solapamiento de turnos
- Límites máximos de trabajadores por tipo de turno
- Reglas de día siguiente (ej: después del 3º turno, solo 2º turno al día siguiente)

### Funciones Avanzadas

**Copiar Semana Completa**:
1. Programar completamente una semana de referencia
2. Botón **"Copiar Semana"** en la semana origen
3. Seleccionar semana destino en modal
4. Sistema replica toda la programación automáticamente

**Edición de Turnos Existentes**:
- **Editar**: Cambiar trabajadores asignados o tipo de turno
- **Eliminar**: Quitar turno específico con confirmación
- **Cambio de estado**: Marcar turnos como completados

**Restricciones de Fechas**:
- Solo se pueden editar: **ayer**, **hoy** y **fechas futuras**
- Fechas pasadas (más de 1 día) son de solo lectura
- Protección de datos históricos para informes financieros

### ⚙️ Configuración de Reglas de Turnos

**Acceso**: Botón **"Configurar Reglas"** en la parte superior del módulo

**Reglas Configurables**:

1. **Solapamientos Permitidos**:
   - ¿Puede un trabajador hacer 1º + 2º turno el mismo día?
   - ¿Puede un trabajador hacer 1º + 3º turno el mismo día?
   - ¿Puede un trabajador hacer 2º + 3º turno el mismo día?

2. **Reglas de Día Siguiente**:
   - Si hace 3º turno hoy → solo puede hacer 2º turno mañana
   - Configuración activada/desactivada por regla

3. **Límites por Turno**:
   - Máximo trabajadores permitidos en primer turno
   - Máximo trabajadores permitidos en segundo turno  
   - Máximo trabajadores permitidos en tercer turno

**Configuración se guarda automáticamente** y aplica en tiempo real a todas las asignaciones futuras.

---

## 💰 Gestión de Tarifas

### Configuración Centralizada de Tarifas

**Acceso**: Sección **"Tarifas"** en el menú lateral

### Tarifas de Calendario (Pagos a Trabajadores)

**Tipos de Tarifas Configurables**:

1. **Primer y Segundo Turno** (días laborales): 
   - Tarifa estándar para horarios diurnos y vespertinos
   - Aplica lunes a viernes en días normales

2. **Tercer Turno Días Laborales**:
   - Mayor pago por horario nocturno
   - Aplica lunes a viernes en la noche

3. **Tercer Turno Sábados**:
   - Tarifa especial para trabajo nocturno de fin de semana
   - Solo aplica sábados en la noche

4. **Feriados** (cualquier turno):
   - Tarifa premium para días festivos oficiales
   - Se aplica automáticamente según calendario de feriados

5. **Domingos** (cualquier turno):
   - Máxima tarifa por trabajo dominical
   - Aplica a todos los turnos realizados en domingo

**Modificación de Tarifas**:
1. Clic en **"Configurar Tarifas de Calendario"**
2. Ajustar valores según necesidades empresariales
3. **Guardar cambios** - aplican a turnos futuros
4. **Importante**: Turnos ya completados mantienen su valor histórico

### Tarifas de Cobros (Ingresos por Cliente)

**Configuración de Cobro**:
- **Tarifa única por turno completado** que se cobra al cliente
- Independiente del número de trabajadores asignados
- Valor configurable según acuerdos comerciales

**Aplicación**:
1. Clic en **"Configurar Tarifa de Cobros"**  
2. Establecer monto por turno realizado
3. **Guardar** - aplica a futuros cobros generados

---

## 📅 Calendario y Feriados

### Gestión del Calendario Empresarial

**Funciones del Calendario**:
- **Vista semanal** de lunes a domingo
- **Navegación** por semanas con botones anterior/siguiente
- **Identificación visual** de días especiales:
  - **Domingos**: Fondo distintivo (máxima tarifa)
  - **Feriados**: Marcados visualmente (tarifa premium)
  - **Sábados**: Diferenciados para 3º turno especial

### Configuración de Feriados

**Gestión de Días Festivos**:
1. **Agregar Feriado**:
   - Seleccionar fecha en calendario
   - Ingresar descripción opcional
   - Confirmar adición

2. **Eliminar Feriado**:
   - Clic en fecha marcada como feriado
   - Confirmación de eliminación

3. **Feriados Preconfigurados**:
   - Año Nuevo, Viernes Santo, Sábado Santo
   - Día del Trabajo, Glorias Navales
   - Fiestas Patrias, Navidad
   - Posibilidad de agregar feriados regionales

**Impacto Automático**:
- Feriados aplicán automáticamente tarifa premium
- Cálculos de pago se ajustan sin intervención manual
- Reportes reflejan diferencias de tarifas por tipo de día

---

## 💵 Sistema de Cobros

### Generación de Cobros Semanales

**Concepto**: Los cobros representan los **ingresos** que la empresa factura a sus clientes por los servicios de transporte realizados.

### Navegación y Filtros

**Selección de Período**:
- **Filtro por Año**: Selector de año (2024, 2025, etc.)
- **Filtro por Semana**: Lista de semanas disponibles con fechas
  - Formato: "Semana 45 (4 nov - 10 nov)"
  - Solo muestra semanas con turnos completados

**Sistema de Cache Inteligente**:
- Semanas visitadas se guardan en memoria
- No recarga datos innecesariamente
- Navegación fluida entre períodos

### Visualización de Cobros

**Información por Semana**:
- **Total de cobros** de la semana seleccionada
- **Desglose por día** con turnos facturables
- **Detalle por turno**: trabajadores, tipo, monto cobrado
- **Subtotales diarios** para control

**Datos Históricos Inmutables**:
- Cobros utilizan **valores guardados** en la base de datos
- Cambios futuros de tarifas **NO afectan** cobros pasados
- Garantiza integridad financiera y contable

### 📊 Exportación de Reportes de Cobros

**Generar Reporte Excel**:
1. Seleccionar semana a reportar
2. Clic en botón **"Exportar a Excel"**
3. Sistema genera archivo profesional automáticamente

**Características del Reporte**:
- **Dos pestañas**: Resumen semanal + Detalles completos
- **Formato empresarial**: Títulos, colores, bordes profesionales
- **Información completa**:
  - Resumen ejecutivo de la semana
  - Detalle día por día
  - Trabajadores por turno
  - Montos individuales y totales
  - Metadatos de empresa y fecha de generación

---

## 💳 Sistema de Pagos

### Cálculo de Pagos a Trabajadores

**Concepto**: Los pagos representan los **costos** que la empresa paga a sus trabajadores por los turnos realizados.

### Navegación de Períodos

**Filtros Disponibles**:
- **Filtro por Año**: Selector de año fiscal
- **Filtro por Mes**: Lista desplegable de meses con datos
  - Solo muestra meses con registros de turnos
  - Formato: "Enero 2025", "Febrero 2025", etc.

**Vista Automática**:
- Al acceder, muestra automáticamente el **mes actual**
- Navegación intuitiva entre diferentes períodos
- Cache inteligente evita recargas innecesarias

### Desglose de Pagos

**Información por Trabajador**:
- **Nombre del trabajador** (formato: Juan López)
- **Total a pagar** en el período seleccionado
- **Desglose por tipo de turno**:
  - Primer Turno: cantidad y monto
  - Segundo Turno: cantidad y monto  
  - Tercer Turno: cantidad y monto
- **Desglose por tipo de día**:
  - Días laborales normales
  - Sábados (3º turno especial)
  - Domingos (tarifa máxima)
  - Feriados (tarifa premium)

**Función Expandir/Contraer**:
- Clic en nombre del trabajador para ver detalle completo
- Vista resumida para navegación rápida
- Vista expandida para análisis detallado

### 🚨 Sistema de Alertas y Validaciones

**Alertas de Integridad de Datos**:
- **🔴 Días Faltantes**: Días del mes sin ningún registro
- **🟠 Días Sin Turnos**: Días presentes pero sin turnos asignados  
- **🟡 Mes Incompleto**: Cuando el mes tiene menos del 80% de datos
- **⚪ Sin Datos**: No hay información para el período seleccionado

**Propósito**:
- Identificar posibles omisiones en la programación
- Alertar sobre períodos con datos incompletos
- Ayudar a mantener registros completos y consistentes

### 📈 Reportes de Pagos

**Exportación a Excel**:
1. **Botón "Exportar a Excel"** en la parte superior
2. **Selección automática** del período filtrado
3. **Generación inmediata** de archivo profesional

**Contenido del Reporte**:
- **Pestaña Resumen**: Totales por trabajador y gran total
- **Pestaña Detalles**: Desglose completo por trabajador
  - Turnos por tipo y día
  - Cálculos detallados
  - Subtotales por categoría
- **Formato Profesional**: Colores empresariales, tipografía clara, bordes
- **Metadatos**: Fecha de generación, período reportado, información de empresa

---

## 📤 Carga Masiva de Datos

### Importación de Archivos CSV

**Propósito**: Migración masiva desde planillas Excel existentes o carga inicial de datos.

**Acceso**: Sección **"Subir Archivos"** en el menú lateral

### Tipos de Importación

**1. Trabajadores**:
- **Formato requerido**: `nombre,rut,contrato,telefono`
- **Ejemplo**: `Juan López,12345678-9,fijo,+56912345678`
- **Validaciones**: RUT chileno válido, no duplicados

**2. Vehículos** (si aplica):
- **Formato requerido**: `patente,marca,modelo,año`
- **Ejemplo**: `ABC123,Toyota,Hiace,2020`

**3. Rutas** (si aplica):
- **Formato requerido**: `nombre,origen,destino,distancia`
- **Ejemplo**: `Ruta Centro,Santiago,Valparaíso,120`

### Proceso de Carga

**Pasos de Importación**:
1. **Preparar archivo CSV** con formato correcto y codificación UTF-8
2. **Seleccionar tipo de entidad** a importar
3. **Arrastrar archivo** o usar botón "Seleccionar Archivo"
4. **Revisión automática** de formato y validaciones
5. **Reporte de resultados**:
   - Registros importados exitosamente
   - Errores encontrados con descripción
   - Duplicados omitidos

**Validaciones Automáticas**:
- **Campos obligatorios**: No pueden estar vacíos
- **Formatos**: RUT, teléfono, email según estándares chilenos
- **Duplicados**: Prevención automática basada en campo único (RUT)
- **Integridad**: Verificación de tipos de datos

### 📊 Datos de Demostración

**Carga de Datos de Prueba**:
- **Botón "Cargar Datos Demo"** para testing
- **Incluye**: 3 trabajadores, 3 vehículos, registros de turnos
- **Útil para**: Capacitación, pruebas de concepto, familiarización

**Reseteo de Datos**:
- **Función "Limpiar Todos los Datos"** en Configuración
- **Uso cuidadoso**: Elimina TODA la información del sistema
- **Confirmación múltiple** antes de ejecutar

---

## 📊 Detección de Inconsistencias

### Sistema de Auditoría Automática

**Propósito**: Identificar y reportar problemas de integridad en los datos del sistema.

### Tipos de Inconsistencias Detectadas

**1. Trabajadores con Problemas**:
- RUTs duplicados o con formato incorrecto
- Información faltante o incompleta
- Estados contradictorios

**2. Turnos con Errores**:
- Turnos sin trabajador asignado
- Fechas inválidas o fuera de rango
- Estados inconsistentes (programado pero sin fecha futura)

**3. Problemas Financieros**:
- Turnos completados sin valor de pago calculado
- Discrepancias entre pagos y cobros esperados
- Tarifas faltantes o incorrectas

### Acceso y Resolución

**Visualización de Inconsistencias**:
1. **Indicador en menú lateral**: Número rojo cuando hay problemas
2. **Sección "Inconsistencias"**: Lista detallada de todos los problemas
3. **Descripción clara** de cada problema encontrado
4. **Sugerencias de resolución** para cada tipo de error

**Resolución de Problemas**:
- **Enlaces directos** a las secciones correspondientes para corrección
- **Actualización automática** después de corregir datos
- **Re-verificación** periódica para mantener integridad

---

## ⚙️ Configuración del Sistema

### Configuraciones Centralizadas

**Acceso**: Sección **"Configuración"** en el menú lateral

### Configuraciones Disponibles

**1. Gestión de Datos**:
- **Limpiar Todos los Datos**: Reseteo completo del sistema
- **Exportar Configuración**: Backup de configuraciones actuales
- **Importar Configuración**: Restaurar desde backup

**2. Configuraciones de Negocio**:
- **Tarifas**: Acceso rápido a configuración de precios
- **Feriados**: Gestión del calendario empresarial
- **Reglas de Turnos**: Configuración de validaciones y límites

**3. Configuraciones de Sistema**:
- **Timezone**: Configuración de zona horaria
- **Formato de fechas**: Formato chileno estándar (DD/MM/YYYY)
- **Moneda**: Pesos chilenos (CLP)

### Gestión de Backups

**Backup Automático**:
- Sistema guarda automáticamente en localStorage del navegador
- Sincronización con base de datos Supabase
- Recuperación automática ante errores

**Backup Manual**:
- **Exportar datos**: Descarga archivo de respaldo completo
- **Importar datos**: Restaurar desde archivo de backup
- **Formato JSON**: Compatible con sistemas externos

---

## 🔧 Solución de Problemas Comunes

### Problemas de Conectividad

**Síntoma**: "Error de conexión" o datos no se actualizan
**Solución**:
1. Verificar conexión a internet
2. Refrescar la página (F5 o Ctrl+R)
3. Cerrar y volver a abrir el navegador
4. Verificar que la URL sea correcta

### Problemas de Login

**Síntoma**: No puede acceder al sistema
**Soluciones**:
1. **Credenciales incorrectas**: Verificar usuario `admin` y contraseña `transapp123`
2. **Cuenta bloqueada**: Esperar 15 minutos si excedió intentos
3. **Navegador**: Limpiar cache y cookies del sitio
4. **Modo incógnito**: Probar en ventana privada/incógnito

### Problemas de Exportación Excel

**Síntoma**: No se descarga el archivo Excel
**Soluciones**:
1. **Bloqueador de pop-ups**: Permitir descargas en el navegador
2. **Antivirus**: Verificar que no esté bloqueando descargas
3. **Espacio en disco**: Verificar espacio disponible
4. **Navegador compatible**: Chrome, Firefox, Edge actualizados

### Datos No Se Guardan

**Síntoma**: Cambios no persisten después de refrescar
**Soluciones**:
1. **Conexión**: Verificar que hay internet estable
2. **Tiempo de espera**: Permitir que operación complete antes de navegar
3. **Navegador**: Habilitar JavaScript y localStorage
4. **Cache**: Limpiar cache del navegador

---

## 📱 Optimización para Dispositivos Móviles

### Acceso Móvil

**Compatibilidad**: TransApp funciona en tablets y smartphones modernos

**Recomendaciones**:
- **Navegadores**: Chrome, Safari, Firefox en versiones recientes
- **Orientación**: Horizontal (landscape) para mejor experiencia
- **Conexión**: WiFi estable recomendada para operaciones masivas

### Funciones Móviles

**Funciones Completas Disponibles**:
- ✅ Login y navegación
- ✅ Consulta de dashboards y reportes
- ✅ Visualización de turnos programados
- ✅ Consulta de pagos y cobros

**Funciones con Experiencia Limitada**:
- ⚠️ Edición masiva de datos (mejor en desktop)
- ⚠️ Exportación Excel (puede requerir app específica)
- ⚠️ Importación CSV (mejor en computadora)

---

## 📞 Soporte y Recursos Adicionales

### Contacto Técnico

Para soporte técnico y consultas sobre el sistema:
- **Desarrollador**: Cristian Gutiérrez
- **Sistema**: TransApp v2025
- **Tecnología**: React + Supabase

### Recursos de Aprendizaje

**Migración desde Excel**:
1. **Identificar datos actuales**: Trabajadores, turnos, tarifas en Excel
2. **Cargar trabajadores**: Usar importación CSV desde Excel
3. **Configurar tarifas**: Establecer precios según acuerdos actuales
4. **Programar turnos**: Migrar gradualmente desde planillas
5. **Generar reportes**: Comparar con Excel para validar

**Mejores Prácticas**:
- **Backup regular**: Exportar datos periódicamente
- **Revisión semanal**: Verificar inconsistencias
- **Capacitación continua**: Familiarizar al equipo con nuevas funciones
- **Validación cruzada**: Comparar reportes iniciales con Excel

### Actualizaciones del Sistema

**Versionado**:
- Sistema se actualiza automáticamente
- Nuevas funciones se anuncian en la interfaz
- Datos siempre están protegidos durante actualizaciones

**Changelog**:
- Nuevas funciones se documentan automáticamente
- Mejoras de rendimiento transparentes al usuario
- Corrección de bugs sin interrupción de servicio

---

## 🚀 Próximos Pasos Recomendados

### Fase 1: Implementación Inicial (Semana 1-2)

1. **Configuración Inicial**:
   - [ ] Acceder al sistema con credenciales proporcionadas
   - [ ] Configurar tarifas actuales del negocio
   - [ ] Cargar trabajadores existentes (CSV o manual)
   - [ ] Establecer feriados del año fiscal

2. **Migración de Datos**:
   - [ ] Exportar trabajadores desde Excel actual
   - [ ] Importar vía CSV a TransApp
   - [ ] Validar que toda la información esté correcta
   - [ ] Configurar reglas de turnos según operación actual

### Fase 2: Operación Paralela (Semana 3-4)

1. **Doble Validación**:
   - [ ] Programar turnos tanto en Excel como en TransApp
   - [ ] Comparar cálculos de pagos entre ambos sistemas
   - [ ] Validar reportes de cobros
   - [ ] Identificar y resolver discrepancias

2. **Capacitación de Equipo**:
   - [ ] Entrenar usuarios en navegación básica
   - [ ] Practicar programación de turnos
   - [ ] Generar primeros reportes oficiales
   - [ ] Establecer flujos de trabajo internos

### Fase 3: Transición Completa (Semana 5-6)

1. **Migración Total**:
   - [ ] Usar TransApp como fuente única de verdad
   - [ ] Generar reportes oficiales solo desde TransApp
   - [ ] Establecer rutinas de backup y mantenimiento
   - [ ] Documentar procesos internos específicos

2. **Optimización**:
   - [ ] Revisar y ajustar tarifas según necesidades
   - [ ] Configurar alertas y validaciones específicas
   - [ ] Establecer métricas de éxito y KPIs
   - [ ] Planificar mejoras adicionales

---

**¡Bienvenido a TransApp!** Su socio digital para una gestión eficiente del transporte empresarial. 

🌟 *Transformando planillas Excel en inteligencia empresarial desde 2025*