# 📘 Manual de Usuario - Punta de Lobos

**Sistema de Gestión Integral**

*Versión 3.1 - Octubre 2025*

---

## 📑 Índice

1. [Introducción](#-introducción)
2. [Acceso al Sistema](#-acceso-al-sistema)
3. [Dashboard Principal](#-dashboard-principal)
4. [Módulo de Personas](#-módulo-de-personas)
5. [Módulo de Turnos](#-módulo-de-turnos)
6. [Módulo de Roadmap](#-módulo-de-roadmap)
7. [Módulo de Registros](#-módulo-de-registros)
8. [Módulo de Pagos y Cobros](#-módulo-de-pagos-y-cobros)
9. [Módulo de Reportes](#-módulo-de-reportes)
10. [Módulo de Configuración](#-módulo-de-configuración)
11. [Portal de Trabajadores](#-portal-de-trabajadores)
12. [Funcionalidades Pendientes](#-funcionalidades-pendientes)
13. [Oportunidades de Implementación](#-oportunidades-de-implementación)
14. [Preguntas Frecuentes](#-preguntas-frecuentes)
15. [Soporte](#-soporte)

---

## 🎯 Introducción

### ¿Qué es el Sistema Punta de Lobos?

El Sistema de Gestión Punta de Lobos es una plataforma web moderna diseñada para facilitar la administración completa de personas, turnos, pagos y operaciones diarias. Desarrollado con tecnología de última generación, ofrece una experiencia intuitiva y eficiente para todos los usuarios.

### Principales Beneficios

- ✅ **Centralización**: Toda la información en un solo lugar
- ✅ **Automatización**: Reduce tareas manuales repetitivas
- ✅ **Visibilidad**: Métricas y reportes en tiempo real
- ✅ **Accesibilidad**: Disponible 24/7 desde cualquier dispositivo
- ✅ **Seguridad**: Protección de datos con autenticación robusta

### Tipos de Usuarios

1. **Administradores**: Acceso completo a todas las funcionalidades
2. **Trabajadores**: Acceso al portal de visualización de turnos

---

## 🔐 Acceso al Sistema

### Login Administrativo

#### Paso 1: Acceder a la URL
Ingrese a la dirección web del sistema proporcionada por su organización.

#### Paso 2: Ingresar Credenciales
- **Correo electrónico**: Su email registrado
- **Contraseña**: Su contraseña segura

#### Paso 3: Iniciar Sesión
Haga clic en el botón "Iniciar Sesión" para acceder al sistema.

#### 🔒 Seguridad
- El sistema cuenta con control de intentos fallidos
- Después de varios intentos incorrectos, la cuenta se bloquea temporalmente
- Use siempre contraseñas seguras con mayúsculas, minúsculas y números

### Portal de Trabajadores

#### Acceso con RUT
Los trabajadores pueden acceder a su portal personal utilizando:
- **RUT**: Sin puntos ni guión (ej: 12345678K)
- El sistema valida automáticamente el formato

#### ¿Qué pueden ver los trabajadores?
- Sus turnos asignados
- Calendario semanal personal
- Horarios y bloques de trabajo
- Estado de sus actividades

---

## 📊 Dashboard Principal

El Dashboard es la página de inicio que muestra una vista general del sistema.

### Métricas Principales

#### 🏃 Personas Activas
- **Qué muestra**: Número total de personas registradas y activas
- **Utilidad**: Monitor rápido del volumen de personal

#### 📅 Turnos del Día
- **Qué muestra**: Cantidad de turnos programados para hoy
- **Utilidad**: Planificación diaria y asignación de recursos

#### 💰 Ingresos del Mes
- **Qué muestra**: Total de ingresos acumulados en el mes actual
- **Utilidad**: Seguimiento financiero en tiempo real

#### 📈 Tendencia Semanal
- **Qué muestra**: Comparación de actividad respecto a la semana anterior
- **Utilidad**: Identificar patrones y tendencias

### Visualizaciones

#### Gráfico de Turnos por Día
- Muestra la distribución de turnos durante la semana
- Ayuda a identificar días con mayor/menor actividad
- Facilita la planificación de recursos

#### Actividad Reciente
- Lista cronológica de las últimas acciones en el sistema
- Incluye fecha, hora y tipo de actividad
- Útil para auditorías y seguimiento

### Cómo Interpretar las Métricas

**🟢 Indicadores Verdes**: Rendimiento positivo o estable
**🔴 Indicadores Rojos**: Requieren atención o están por debajo del objetivo
**⚪ Indicadores Neutros**: Sin cambios significativos

---

## 👥 Módulo de Personas

El módulo de personas es el corazón del sistema, donde se gestiona toda la información del personal.

### Tipos de Personas

El sistema soporta cuatro tipos de personas:

1. **Visitantes** 👤
   - Personas que visitan ocasionalmente
   - Requieren registro básico

2. **Guías** 🧭
   - Personal especializado en guiar actividades
   - Tienen tarifas específicas

3. **Staff** 👔
   - Personal administrativo y de soporte
   - Roles variados en la organización

4. **Instructores** 🎓
   - Profesionales especializados
   - Tarifas diferenciadas por expertise

### Registrar una Nueva Persona

#### Paso a Paso

1. **Acceder al Módulo**
   - Clic en "Personas" en el menú lateral

2. **Abrir Formulario**
   - Clic en el botón "+ Agregar Persona"

3. **Completar Información Básica**
   - **Nombre**: Nombre completo de la persona
   - **RUT**: Identificación única (sin puntos, con guión)
   - **Email**: Correo electrónico de contacto
   - **Teléfono**: Número de contacto

4. **Seleccionar Tipo**
   - Elija el tipo apropiado (Visitante, Guía, Staff, Instructor)

5. **Configurar Tarifa (Opcional)**
   - Active "Tarifa personalizada" si aplica
   - Ingrese el monto específico para esta persona
   - Útil para casos especiales o negociaciones individuales

6. **Guardar**
   - Clic en "Guardar" para registrar la persona

### Buscar y Filtrar Personas

#### Búsqueda Rápida
- Use la barra de búsqueda en la parte superior
- Busca por nombre, RUT o email
- Los resultados se actualizan en tiempo real

#### Filtros Avanzados
- **Por Tipo**: Filtre por Visitante, Guía, Staff o Instructor
- **Por Estado**: Activos o Inactivos
- **Por Tarifa**: Con o sin tarifa personalizada

### Editar Información de una Persona

1. Localice la persona en la lista
2. Clic en el ícono de edición (✏️)
3. Modifique los campos necesarios
4. Guarde los cambios

### Sistema de Tarifas Personalizadas

#### ¿Qué son las Tarifas Personalizadas?

Las tarifas personalizadas permiten asignar un valor específico a cada persona, sobrescribiendo las tarifas generales del sistema.

#### Casos de Uso

- Trabajadores con contratos especiales
- Expertos con tarifas premium
- Descuentos o promociones individuales
- Acuerdos comerciales específicos

#### Cómo Funcionan

1. **Sin Tarifa Personalizada**: Se usa la tarifa general del sistema según el tipo
2. **Con Tarifa Personalizada**: Se usa el valor específico asignado a esa persona
3. **Visibilidad**: La tarifa se muestra claramente en el perfil de la persona

### Eliminar una Persona

⚠️ **Precaución**: Esta acción puede ser irreversible dependiendo de la configuración.

1. Seleccione la persona a eliminar
2. Clic en el ícono de eliminar (🗑️)
3. Confirme la acción en el diálogo de confirmación

---

## 📅 Módulo de Turnos

El módulo de turnos es una herramienta poderosa para la gestión de horarios y asignaciones.

### Vista de Calendario

#### Calendario Semanal Interactivo

El calendario muestra:
- **Días de la semana**: De Lunes a Domingo
- **Bloques horarios**: Divididos en períodos de 4 horas
- **Turnos asignados**: Con códigos de color
- **Hora de almuerzo**: Marcada visualmente en cada turno

#### Bloques Horarios Estándar

- **Bloque 1**: 08:00 - 12:00
- **Bloque 2**: 12:00 - 16:00
- **Bloque 3**: 16:00 - 20:00
- **Bloque 4**: 20:00 - 00:00

### Crear un Turno Individual

#### Método Rápido

1. **Seleccionar Día y Bloque**
   - Haga clic en el día y bloque horario deseado

2. **Completar Formulario**
   - **Trabajador**: Seleccione de la lista desplegable
   - **Bloque**: Confirme o modifique el bloque horario
   - **Fecha**: Se completa automáticamente, pero puede modificarse
   - **Hora de almuerzo**: Ingrese en formato HH:MM (ej: 14:30)

3. **Guardar**
   - Clic en "Guardar Turno"
   - El turno aparecerá inmediatamente en el calendario

### Programación Masiva de Turnos

#### Planificación Bimensual

Una de las funcionalidades más potentes del sistema.

**¿Qué hace?**
- Genera turnos para múltiples semanas simultáneamente
- Distribuye automáticamente los trabajadores
- Respeta configuraciones de bloques y horarios
- Evita duplicados y conflictos

#### Paso a Paso: Programación Masiva

1. **Acceder a Programación**
   - Clic en "Programación de Turnos" en el menú

2. **Configurar Período**
   - **Fecha de inicio**: Seleccione el primer día
   - **Número de semanas**: Ingrese cantidad (típicamente 4-8 semanas)

3. **Seleccionar Trabajadores**
   - Marque los trabajadores que participarán
   - Puede seleccionar todos o solo algunos

4. **Configurar Bloques**
   - Active/desactive bloques horarios según necesidad
   - Configure rotaciones si es necesario

5. **Generar**
   - Clic en "Generar Turnos"
   - El sistema crea automáticamente todos los turnos

6. **Revisar y Ajustar**
   - Revise los turnos generados
   - Realice ajustes manuales si es necesario

#### Ventajas de la Programación Masiva

- ⏱️ **Ahorro de tiempo**: Minutos vs. horas de trabajo manual
- 📊 **Distribución equitativa**: Algoritmo balanceado
- 🔄 **Flexibilidad**: Puede modificarse después
- 📝 **Trazabilidad**: Registro de quién programó y cuándo

### Editar un Turno Existente

1. Haga clic sobre el turno en el calendario
2. Se abrirá el formulario de edición
3. Modifique los campos necesarios
4. Guarde los cambios

### Eliminar un Turno

1. Abra el turno a eliminar
2. Clic en el botón "Eliminar Turno"
3. Confirme la acción

⚠️ **Nota**: Los turnos eliminados no se pueden recuperar fácilmente.

### Configuración de Hora de Almuerzo

#### ¿Por qué es importante?

La hora de almuerzo afecta:
- Cálculos de jornada laboral
- Reportes de tiempo efectivo
- Cumplimiento normativo

#### Cómo Configurar

1. Al crear/editar un turno
2. Campo "Hora de almuerzo"
3. Ingrese en formato 24 horas (ej: 13:00, 14:30)
4. El sistema valida el formato automáticamente

#### Visualización

- La hora de almuerzo se muestra en el turno
- Aparece en reportes detallados
- Se incluye en exportaciones

### Reportes de Turnos

#### Acceder a Reportes

- Clic en "Reporte de Turnos" en el menú

#### Información Disponible

- **Turnos por trabajador**: Cantidad y distribución
- **Horas trabajadas**: Total por período
- **Bloques más usados**: Análisis de horarios
- **Cumplimiento**: Comparación plan vs. real

#### Exportar Reportes

1. Configure el período a reportar
2. Seleccione filtros si es necesario
3. Clic en "Exportar"
4. Descargue en el formato deseado (Excel, PDF próximamente)

---

## 🗺️ Módulo de Roadmap

El Roadmap es una herramienta de gestión de proyectos integrada en el sistema.

### ¿Para qué sirve?

- Planificar mejoras del sistema
- Seguimiento de tareas pendientes
- Priorización de funcionalidades
- Comunicación con el equipo de desarrollo

### Visualizar el Roadmap

#### Acceso
- Menú lateral > "Roadmap"

#### Elementos del Roadmap

Cada hito incluye:
- **Título**: Nombre de la funcionalidad o mejora
- **Descripción**: Detalles de qué se trata
- **Estado**: En Progreso, Completado, Pendiente
- **Prioridad**: Alta, Media, Baja
- **Fecha estimada**: Cuándo se espera completar

### Crear un Nuevo Hito

1. **Abrir Formulario**
   - Clic en "+ Nuevo Hito"

2. **Completar Información**
   - **Título**: Nombre descriptivo
   - **Descripción**: Detalles completos
   - **Prioridad**: Seleccione importancia
   - **Fecha objetivo**: Cuándo debe estar listo

3. **Guardar**
   - El hito aparece en el roadmap

### Actualizar Estado de Hitos

1. Localice el hito
2. Clic en el estado actual
3. Seleccione el nuevo estado
4. Se actualiza automáticamente

### Casos de Uso

- **Solicitudes de usuarios**: Convertir ideas en tareas
- **Bugs encontrados**: Registro y seguimiento
- **Mejoras planificadas**: Visibilidad del plan
- **Comunicación**: Todos saben qué viene

---

## 📋 Módulo de Registros

El módulo de registros mantiene una bitácora completa de todas las actividades del sistema.

### ¿Qué se Registra?

- ✅ Creación de personas
- ✅ Modificación de datos
- ✅ Creación y edición de turnos
- ✅ Eliminaciones
- ✅ Cambios en configuración
- ✅ Accesos al sistema

### Ver Registros

#### Acceso
- Menú lateral > "Registros"

#### Vista de Lista

Cada registro muestra:
- **Fecha y hora**: Cuándo ocurrió
- **Usuario**: Quién realizó la acción
- **Acción**: Qué se hizo (crear, editar, eliminar)
- **Módulo**: Dónde se hizo (personas, turnos, etc.)
- **Detalles**: Información adicional

### Filtrar Registros

#### Por Fecha
- Seleccione rango de fechas
- Útil para auditorías de períodos específicos

#### Por Usuario
- Vea las acciones de un usuario particular
- Ideal para supervisión y capacitación

#### Por Módulo
- Filtre por área del sistema
- Ejemplo: solo cambios en "Personas"

#### Por Tipo de Acción
- Crear, Editar, Eliminar, Acceso
- Útil para detectar patrones

### Casos de Uso

1. **Auditoría**: Cumplimiento y control
2. **Resolución de problemas**: Identificar qué cambió
3. **Capacitación**: Aprender de las acciones
4. **Seguridad**: Detectar accesos no autorizados

---

## 💰 Módulo de Pagos y Cobros

### Gestión de Pagos

#### Registrar un Pago

1. **Acceder al Módulo**
   - Menú lateral > "Pagos"

2. **Nuevo Pago**
   - Clic en "+ Registrar Pago"

3. **Completar Información**
   - **Trabajador**: Seleccione de la lista
   - **Monto**: Ingrese cantidad
   - **Fecha**: Fecha del pago
   - **Concepto**: Descripción (ej: "Quincena Junio")
   - **Método**: Efectivo, Transferencia, etc.

4. **Guardar**
   - El pago se registra en el sistema

#### Consultar Pagos Históricos

- Lista completa de todos los pagos
- Filtros por trabajador, fecha, monto
- Búsqueda rápida

### Gestión de Cobros

Similar al módulo de pagos, pero para ingresos.

#### Registrar un Cobro

1. Acceso: "Cobros" en el menú
2. Completar formulario con datos del ingreso
3. Guardar registro

### Resúmenes Mensuales

#### Vista de Resumen

- **Total pagado**: Suma de pagos del mes
- **Total cobrado**: Suma de ingresos del mes
- **Balance**: Diferencia entre cobros y pagos
- **Gráficos**: Visualización de tendencias

#### Exportar Resumen

- Genere reportes mensuales
- Útil para contabilidad y finanzas
- Formato Excel (próximamente PDF)

---

## 📈 Módulo de Reportes

### Tipos de Reportes Disponibles

#### 1. Reporte de Turnos
- Detalle completo de turnos por período
- Incluye horas, bloques, trabajadores
- Exportable a Excel

#### 2. Reporte de Personas
- Lista de todo el personal
- Con tarifas y tipos
- Estadísticas de actividad

#### 3. Reporte Financiero
- Pagos y cobros detallados
- Balances mensuales
- Proyecciones

#### 4. Reporte de Actividad
- Basado en el módulo de registros
- Uso del sistema por usuarios
- Métricas de rendimiento

### Generar un Reporte

#### Proceso General

1. **Seleccionar Tipo**
   - Elija el reporte que necesita

2. **Configurar Parámetros**
   - Rango de fechas
   - Filtros específicos
   - Nivel de detalle

3. **Vista Previa**
   - Revise antes de exportar

4. **Exportar**
   - Descargue en formato deseado

### Análisis de Datos

El módulo incluye herramientas de análisis:
- **Gráficos dinámicos**: Barras, líneas, tortas
- **Tablas pivote**: Resúmenes cruzados
- **Comparaciones**: Período actual vs. anterior
- **Tendencias**: Identificación de patrones

---

## ⚙️ Módulo de Configuración

### Acceso a Configuración

- Menú lateral > "Configuración"
- Requiere permisos de administrador

### Ajustes del Sistema

#### Configuración General

1. **Nombre de la Organización**
   - Personalice el nombre que aparece en el sistema

2. **Logo**
   - Suba su logo personalizado
   - Se mostrará en todas las páginas

3. **Zona Horaria**
   - Configure según su ubicación
   - Afecta reportes y registros

#### Configuración de Turnos

1. **Bloques Horarios**
   - Personalice los bloques predeterminados
   - Defina inicio y fin de cada bloque

2. **Duración de Almuerzo**
   - Configure tiempo estándar de almuerzo
   - Aplica a todos los turnos por defecto

3. **Días Laborables**
   - Active/desactive días de la semana
   - Define calendario laboral

#### Configuración de Tarifas

1. **Tarifas por Tipo**
   - Defina tarifa base para Visitantes
   - Defina tarifa para Guías
   - Defina tarifa para Staff
   - Defina tarifa para Instructores

2. **Multiplicadores**
   - Tarifa día domingo (ej: 1.5x)
   - Tarifa día feriado (ej: 2x)
   - Tarifa nocturna (ej: 1.3x)

### Estado de Servicios

#### Conexión a Base de Datos
- Indicador de estado de Supabase
- 🟢 Verde: Conectado correctamente
- 🔴 Rojo: Problemas de conexión

#### Estado de Servicios Externos
- Verificación de APIs
- Monitoreo de rendimiento

### Respaldos y Seguridad

⚠️ **Importante**: Configure respaldos periódicos

#### Configurar Respaldos Automáticos

1. Frecuencia: Diaria, Semanal, Mensual
2. Hora: Horario de menor actividad
3. Destino: Ubicación de almacenamiento

---

## 👷 Portal de Trabajadores

### Acceso al Portal

#### URL Específica
El portal de trabajadores tiene una URL dedicada:
`https://tu-sistema.com/trabajador`

#### Login con RUT

1. Ingrese su RUT sin puntos ni guión
2. Ejemplo: 12345678K
3. El sistema valida automáticamente
4. Acceso inmediato si el RUT está registrado

### Vista del Trabajador

#### Calendario Personal

Cada trabajador ve:
- **Sus turnos únicamente**: No ve turnos de otros
- **Calendario semanal**: Vista clara y simple
- **Detalles de turnos**: Fecha, horario, bloque
- **Hora de almuerzo**: Cuándo corresponde su descanso

#### Información Disponible

- ✅ Turnos de la semana actual
- ✅ Turnos de semanas futuras (próximos 2 meses)
- ✅ Horarios específicos
- ✅ Bloques asignados
- ❌ No puede editar ni eliminar turnos

### Características del Portal

#### Diseño Simple
- Interfaz limpia y fácil de usar
- Optimizado para móviles
- Sin menús complejos

#### Actualización Automática
- Los cambios se reflejan inmediatamente
- No requiere recargar la página
- Sincronización en tiempo real

#### Privacidad
- Cada trabajador solo ve su información
- No acceso a datos de otros trabajadores
- Seguro y privado

---

## 🔮 Funcionalidades Pendientes

### En Desarrollo Activo

#### 1. Auto Cierre de Sesión por Seguridad
**Estado**: En planificación  
**Descripción**: Cierre automático de sesión después de período de inactividad  
**Beneficio**: Mayor seguridad y protección de datos  
**Estimado**: Q1 2026

#### 2. Alertas Automáticas de Conflictos de Horarios
**Estado**: En análisis  
**Descripción**: Notificaciones cuando se detectan traslapes de turnos  
**Beneficio**: Evita errores de programación  
**Estimado**: Q1 2026

#### 3. Importación Masiva de Personas desde Planilla
**Estado**: Diseño completado  
**Descripción**: Carga de múltiples personas desde archivo Excel/CSV  
**Beneficio**: Ahorro masivo de tiempo en configuración inicial  
**Estimado**: Q2 2026

#### 4. Exportación de Reportes en XLSX y PDF
**Estado**: En desarrollo  
**Descripción**: Exportar todos los reportes en formato Excel y PDF  
**Beneficio**: Compatibilidad con sistemas contables y presentaciones  
**Estimado**: Q2 2026  
**Nota**: Excel ya disponible, PDF en progreso

#### 5. Alertas Automáticas Basadas en KPIs Críticos
**Estado**: Especificación  
**Descripción**: Notificaciones cuando métricas importantes requieren atención  
**Beneficio**: Gestión proactiva y prevención de problemas  
**Estimado**: Q2 2026

#### 6. Integración de Cobros Reales
**Estado**: Análisis de requerimientos  
**Descripción**: Conexión con sistemas de pago y facturación  
**Beneficio**: Automatización completa del ciclo financiero  
**Estimado**: Q3 2026

#### 7. Selector de Temas y Personalización Visual
**Estado**: Diseño UI/UX  
**Descripción**: Modo oscuro, modo claro y temas personalizados  
**Beneficio**: Mejor experiencia de usuario y accesibilidad  
**Estimado**: Q3 2026

### Próximamente

- **Notificaciones Push**: Alertas en tiempo real
- **App Móvil Nativa**: iOS y Android
- **Integración con Google Calendar**: Sincronización de turnos
- **API Pública**: Para integraciones personalizadas
- **Dashboard Personalizable**: Widgets configurables
- **Modo Offline**: Trabajar sin conexión

---

## 💡 Oportunidades de Implementación

### Para Usuarios Avanzados

Estas son funcionalidades que los usuarios con conocimientos técnicos pueden implementar por su cuenta:

#### 1. Integraciones con Sistemas Externos

**Casos de Uso**:
- Conectar con sistema de contabilidad existente
- Sincronizar con sistema de RRHH
- Integrar con sistema de control de acceso

**Tecnologías**:
- API REST de Supabase
- Webhooks para eventos
- Consultas SQL personalizadas

**Documentación**: Disponible en `docs/API.md` (próximamente)

#### 2. Reportes Personalizados Específicos del Negocio

**Qué Pueden Hacer**:
- Crear reportes con métricas únicas de su negocio
- Dashboards personalizados con indicadores específicos
- Alertas basadas en reglas de negocio propias

**Herramientas**:
- Acceso directo a la base de datos
- Vistas SQL personalizadas
- Herramientas de BI externas (Power BI, Tableau)

#### 3. Automatizaciones Adicionales

**Ideas**:
- Scripts para generar turnos con lógica específica
- Automatización de correos a trabajadores
- Sincronización con sistemas de comunicación (Slack, WhatsApp)
- Recordatorios automáticos de turnos

**Tecnologías**:
- Supabase Functions
- Triggers de base de datos
- Cron jobs personalizados

#### 4. Extensiones del Sistema de Tarifas

**Posibilidades**:
- Tarifas variables por hora del día
- Descuentos por volumen
- Bonificaciones por desempeño
- Comisiones complejas

**Implementación**:
- Funciones SQL personalizadas
- Lógica en triggers
- Vistas calculadas

#### 5. Notificaciones Personalizadas

**Ejemplos**:
- SMS a trabajadores cuando se asigna turno
- Email automático con resumen semanal
- WhatsApp para cambios urgentes
- Notificaciones a supervisores

**Herramientas**:
- Twilio para SMS
- SendGrid para emails
- Webhooks de WhatsApp Business
- Supabase Realtime

### Recursos para Implementadores

#### Documentación Técnica
- Base de datos: Ver esquema en `sql/schema.sql`
- API: Documentación de Supabase REST API
- Funciones: Ver `sql/functions.sql`

#### Comunidad
- Issues en GitHub para preguntas técnicas
- Ejemplos de código en `/examples` (próximamente)
- Foro de discusión (en planificación)

#### Soporte Técnico
Para implementaciones avanzadas, contáctese con el equipo técnico.

---

## ❓ Preguntas Frecuentes

### Generales

**P: ¿Puedo acceder desde mi celular?**  
R: Sí, el sistema es completamente responsive y funciona en cualquier dispositivo móvil.

**P: ¿Los datos están seguros?**  
R: Sí, utilizamos Supabase con PostgreSQL, encriptación y respaldos automáticos.

**P: ¿Cuántos usuarios pueden usar el sistema simultáneamente?**  
R: No hay límite práctico, el sistema escala automáticamente.

### Personas

**P: ¿Puedo tener el mismo RUT registrado dos veces?**  
R: No, el RUT es único en el sistema para evitar duplicados.

**P: ¿Qué pasa si elimino una persona por error?**  
R: Dependiendo de la configuración, puede estar en estado "eliminado" y ser recuperable por un administrador.

**P: ¿Las tarifas personalizadas afectan reportes?**  
R: Sí, los reportes financieros usarán siempre la tarifa personalizada si existe.

### Turnos

**P: ¿Puedo programar turnos para meses en el futuro?**  
R: Sí, no hay límite de fecha futura para programación.

**P: ¿Qué pasa si programo un turno para alguien que ya tiene otro turno?**  
R: El sistema lo permite actualmente, pero alertas de conflictos están en desarrollo.

**P: ¿Puedo cambiar un turno después de crearlo?**  
R: Sí, completamente. Edite cualquier campo del turno en cualquier momento.

**P: ¿Los trabajadores pueden ver cambios en sus turnos inmediatamente?**  
R: Sí, el portal de trabajadores se actualiza en tiempo real.

### Reportes

**P: ¿Puedo exportar reportes históricos de hace meses?**  
R: Sí, no hay límite temporal para generar reportes.

**P: ¿Los reportes incluyen datos de personas eliminadas?**  
R: Depende del filtro aplicado, puede incluirlas o excluirlas.

### Técnicas

**P: ¿Qué navegadores son compatibles?**  
R: Chrome, Firefox, Safari, Edge (versiones modernas).

**P: ¿Necesito instalar algo en mi computador?**  
R: No, es 100% web. Solo necesita un navegador.

**P: ¿Funciona sin internet?**  
R: No actualmente, requiere conexión. Modo offline está en desarrollo.

---

## 📞 Soporte

### Canales de Soporte

#### Soporte Técnico
- **Email**: soporte@puntadelobos.com
- **Horario**: Lunes a Viernes, 9:00 - 18:00
- **Tiempo de respuesta**: 24-48 horas

#### Reportar Bugs
- **GitHub Issues**: [github.com/cristian-data-science/transapp/issues](https://github.com/cristian-data-science/transapp/issues)
- **Incluya**: Capturas de pantalla, descripción detallada, pasos para reproducir

#### Solicitudes de Nuevas Funcionalidades
- **GitHub Issues**: Use label "enhancement"
- **Roadmap**: Revise primero si ya está planificado

### Documentación Adicional

- **Guía de Inicio Rápido**: `/docs/INICIO_RAPIDO.md`
- **Documentación Técnica**: `/docs/DEVELOPMENT.md`
- **Guía de Calendario**: `/GUIA_USUARIO_CALENDARIO_V3.md`
- **FAQ Programación**: `/FAQ_PROGRAMACION_TURNOS.md`

### Actualizaciones del Sistema

El sistema se actualiza regularmente. Las notas de versión están en:
- **Changelog**: `/CHANGELOG.md`
- **Cambios de Turnos**: `/CHANGELOG_TURNOS.md`
- **Cambios de Calendario**: `/CHANGELOG_CALENDARIO_V3.md`

### Capacitación

Si su organización requiere capacitación personalizada:
- Sesiones en línea disponibles
- Capacitación presencial (bajo consulta)
- Videos tutoriales en producción

---

## 📚 Recursos Adicionales

### Documentos Relacionados

1. **Guías de Usuario Específicas**
   - [Guía Visual del Calendario](../GUIA_VISUAL_CALENDARIO.md)
   - [Instrucciones de Programación de Turnos](../INSTRUCCIONES_PROGRAMACION_TURNOS.md)
   - [Guía Rápida del Visualizador](../GUIA_RAPIDA_VISUALIZADOR.md)

2. **Documentación Técnica**
   - [README Principal](../README.md)
   - [Documentación de Desarrollo](./README.md)
   - [Orden de Ejecución de Scripts](../ORDEN_EJECUCION_SCRIPTS.md)

3. **Tutoriales**
   - [Cómo Probar el Visualizador](../COMO_PROBAR_VISUALIZADOR.md)
   - [Pruebas Rápidas de Turnos](../PRUEBAS_TURNOS_RAPIDAS.md)

### Videos y Tutoriales

*Próximamente*: Canal de YouTube con tutoriales paso a paso

### Glosario

- **Bloque**: Período de 4 horas dentro de un día laboral
- **Tarifa Personalizada**: Precio específico asignado a una persona
- **Turno**: Asignación de un trabajador a un bloque horario específico
- **Dashboard**: Panel de control con métricas y visualizaciones
- **KPI**: Key Performance Indicator (Indicador Clave de Rendimiento)
- **RUT**: Rol Único Tributario, identificador único en Chile

---

## 📝 Notas de Versión

**Versión Actual**: 3.1  
**Fecha**: Octubre 2025

### Funcionalidades Principales en esta Versión

- ✅ Sistema de autenticación dual (Admin y Trabajadores)
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión completa de personas con tarifas personalizadas
- ✅ Calendario de turnos interactivo
- ✅ Programación masiva bimensual
- ✅ Portal de trabajadores con visualización de turnos
- ✅ Sistema de registros y bitácora
- ✅ Módulo de roadmap
- ✅ Reportes exportables
- ✅ Configuración flexible del sistema

### Mejoras Recientes

- 🎨 UI/UX mejorada con TailwindCSS 4
- 🚀 Rendimiento optimizado
- 📱 Mejor soporte móvil
- 🔒 Seguridad mejorada
- 📊 Nuevas visualizaciones en dashboard

---

## 🎓 Conclusión

Este manual cubre todas las funcionalidades actuales del Sistema de Gestión Punta de Lobos. El sistema está en constante evolución, con nuevas funcionalidades agregándose regularmente basadas en feedback de usuarios.

**Recuerde**:
- ✅ Explore cada módulo sin miedo, el sistema guarda registros de todo
- ✅ Use los reportes para tomar decisiones basadas en datos
- ✅ Consulte este manual cuando tenga dudas
- ✅ Reporte bugs y sugerencias para mejorar el sistema
- ✅ Manténgase actualizado con las notas de versión

**¡Gracias por usar el Sistema Punta de Lobos!**

---

*Última actualización: Octubre 2025*  
*Versión del documento: 1.0*  
*Desarrollado con ❤️ para Punta de Lobos*
