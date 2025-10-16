# 📊 Dashboard Avanzado - Métricas y KPIs

## 🎯 Descripción General

Dashboard completo con métricas avanzadas en tiempo real para la gestión de turnos y personal de Punta de Lobos. Incluye análisis estadístico, visualizaciones intuitivas y seguimiento de rendimiento.

## 🔥 Características Principales

### 1. **KPIs Principales (4 Cards Destacados)**

#### 📅 Turnos Hoy
- **Valor**: Cantidad de turnos programados para hoy
- **Badge dinámico**: Muestra turnos activos en tiempo real con icono de rayo ⚡
- **Color**: Gradiente azul a cyan
- **Utilidad**: Vista rápida de la carga de trabajo del día

#### 👥 Personal Activo
- **Valor**: Número de personas con estado "activo"
- **Detalle**: Muestra total de personas registradas
- **Color**: Gradiente verde a esmeralda
- **Utilidad**: Monitoreo de disponibilidad de personal

#### 🎯 Tasa de Asistencia
- **Valor**: Porcentaje calculado (turnos completados / turnos esperados)
- **Fórmula**: `(turnosCompletados / turnosEsperados) × 100`
- **Detalle**: Cantidad de turnos completados este mes
- **Color**: Gradiente púrpura a rosa
- **Utilidad**: Medición de confiabilidad y asistencia

#### ⏰ Promedio Diario
- **Valor**: Horas promedio trabajadas por día
- **Cálculo**: Total de horas del mes / días con turnos
- **Color**: Gradiente naranja a ámbar
- **Utilidad**: Análisis de carga laboral promedio

### 2. **Estadísticas Detalladas (5 Cards Pequeños)**

#### 📆 Esta Semana
- Turnos programados en la semana actual
- Icono: CalendarClock
- Color: Teal

#### 💼 Este Mes
- Total de turnos del mes en curso
- Icono: Briefcase
- Color: Azul

#### 📋 Programados
- Turnos con estado "programado"
- Icono: Calendar
- Color: Azul claro

#### ⚠️ Ausencias
- Turnos con estado "ausente"
- Icono: AlertTriangle
- Color: Naranja

#### ❌ Cancelados
- Turnos con estado "cancelado"
- Icono: AlertCircle
- Color: Rojo

### 3. **Próximos Turnos**

#### 📋 Características
- **Lista**: Máximo 5 turnos más próximos
- **Filtro**: Solo turnos de hoy y mañana
- **Estados**: Programado y En Curso
- **Orden**: Por fecha y hora de inicio
- **Información mostrada**:
  - Nombre de la persona
  - Fecha relativa (Hoy/Mañana)
  - Horario (inicio - fin)
  - Puesto (si aplica)
  - Badge de estado con color

#### 🎨 Diseño
- Cards individuales con hover effect
- Iconos dinámicos según estado
- Colores diferenciados por estado
- Layout responsive

### 4. **Top Personal Activo**

#### 🏆 Ranking
- **Top 5**: Personas con más turnos este mes
- **Medallería**:
  - 🥇 Oro: 1er lugar (amarillo)
  - 🥈 Plata: 2do lugar (gris)
  - 🥉 Bronce: 3er lugar (naranja)
  - Números: 4to y 5to lugar

#### 📊 Métricas por Persona
- **Nombre**: Identificación del trabajador
- **Turnos**: Cantidad de turnos realizados
- **Horas**: Total de horas trabajadas (calculado)

#### 💡 Cálculo de Horas
```javascript
horas = (hora_fin - hora_inicio) sumado por todos los turnos
```

### 5. **Distribución de Turnos por Tipo**

#### 📈 Categorías
1. **Completo** - Azul a Cyan
2. **Medio Día** - Verde a Esmeralda
3. **Parcial** - Púrpura a Rosa
4. **Nocturno** - Índigo a Azul
5. **Sin Tipo** - Gris a Slate

#### 📊 Información por Tipo
- **Cantidad**: Número de turnos
- **Porcentaje**: Del total del mes
- **Barra de progreso**: Visual con gradiente
- **Cards coloridas**: Fondo según tipo

### 6. **Resumen del Sistema**

#### 🎯 Tres Indicadores Clave

##### ✅ Sistema Activo
- Estado operativo del sistema
- Icono: CheckCircle2 verde
- Mensaje: "Operando normalmente"

##### 👤 Personal Disponible
- Cantidad de personas activas
- Icono: UserCheck azul
- Dinámico según BD

##### ⚡ Turnos en Curso
- Turnos activos en este momento
- Icono: Zap ámbar
- Actualización en tiempo real

## 🔢 Cálculos y Fórmulas

### Tasa de Asistencia
```javascript
turnosEsperados = programados + completados + ausentes + cancelados
tasaAsistencia = (completados / turnosEsperados) × 100
```

### Promedio de Horas por Día
```javascript
totalHoras = Σ(hora_fin - hora_inicio) para todos los turnos del mes
diasConTurnos = cantidad de fechas únicas con turnos
promedioHorasDia = totalHoras / diasConTurnos
```

### Top Personal
```javascript
Para cada persona:
  - Contar turnos del mes
  - Sumar horas trabajadas
  - Ordenar por cantidad de turnos descendente
  - Tomar top 5
```

### Distribución por Tipo
```javascript
Para cada tipo de turno:
  - Contar ocurrencias
  - Calcular porcentaje = (cantidad / total) × 100
```

## 🎨 Diseño y UX

### Paleta de Colores

#### Principales
- **Azul-Cyan**: Turnos, programación
- **Verde-Esmeralda**: Personal, activos
- **Púrpura-Rosa**: Métricas, análisis
- **Naranja-Ámbar**: Alertas, tiempo

#### Estados
- **Verde**: Completado, en curso, activo
- **Azul**: Programado, pendiente
- **Naranja**: Ausente, advertencia
- **Rojo**: Cancelado, error
- **Gris**: Completado, inactivo

### Efectos Visuales
- ✨ Gradientes en cards principales
- 🌊 Hover effects en listas
- 📊 Barras de progreso animadas
- 🎯 Badges con borders
- 💫 Transiciones suaves

### Responsive Design
- **Mobile**: 1 columna
- **Tablet**: 2 columnas
- **Desktop**: 4-5 columnas
- **Adaptativo**: Grids flexibles

## 🔄 Actualización de Datos

### Carga Automática
- Se carga al montar el componente
- `useEffect(() => loadDashboardData(), [])`

### Botón Manual
- Botón "Actualizar" en header
- Icono: TimerReset
- Recarga todos los datos

### Queries Optimizadas
```javascript
- getEstadisticas(): Stats generales
- getTurnos({ fecha }): Turnos hoy
- getTurnos({ fechaDesde, fechaHasta }): Turnos semana/mes
- getPersonas(): Personal completo
```

## 📱 Componentes Utilizados

### De Shadcn/ui
- `Card, CardHeader, CardTitle, CardContent, CardDescription`
- `Badge`
- `Button`

### De Lucide-react
- Layout, Calendar, Users, Clock
- TrendingUp, Activity, Target
- CheckCircle2, AlertCircle, AlertTriangle
- Zap, Award, Briefcase
- Y 15+ iconos más

## 🚀 Funcionalidades Avanzadas

### 1. **Loading State**
- Spinner animado mientras carga
- Mensaje "Cargando dashboard..."
- Previene render incompleto

### 2. **Estados Vacíos**
- Iconos grandes y mensajes claros
- "No hay turnos próximos"
- "No hay datos disponibles"

### 3. **Badges Dinámicos**
- Colores según estado
- Iconos contextuales
- Borders y backgrounds

### 4. **Formateo de Datos**
- Fechas relativas (Hoy/Mañana)
- Horas con decimales (X.Xh)
- Porcentajes con 1 decimal (XX.X%)

### 5. **Ordenamiento Inteligente**
- Próximos turnos por fecha y hora
- Personal por cantidad de turnos
- Automático y eficiente

## 💡 Casos de Uso

### Para Administradores
- ✅ Vista general del día
- ✅ Monitoreo de asistencia
- ✅ Identificación de personal clave
- ✅ Detección de ausencias
- ✅ Análisis de carga laboral

### Para Supervisores
- ✅ Verificación de turnos activos
- ✅ Seguimiento de completitud
- ✅ Control de ausencias
- ✅ Planificación semanal

### Para Reportes
- ✅ Métricas exportables
- ✅ Datos históricos (mes)
- ✅ Tendencias visibles
- ✅ KPIs claros

## 🔧 Personalización

### Agregar Nuevas Métricas
1. Crear nuevo estado en `stats`
2. Calcular en `loadDashboardData()`
3. Agregar Card en el JSX
4. Estilizar según convención

### Modificar Períodos
```javascript
// Cambiar de mes a año
const inicioAño = new Date(new Date().getFullYear(), 0, 1)
const finAño = new Date(new Date().getFullYear(), 11, 31)
```

### Ajustar Top Personal
```javascript
// Cambiar de top 5 a top 10
.slice(0, 10)
```

## 📊 Estadísticas Mostradas

| Métrica | Tipo | Período | Cálculo |
|---------|------|---------|---------|
| Turnos Hoy | Count | Hoy | Filtro por fecha |
| Personal Activo | Count | Actual | Estado = activo |
| Tasa Asistencia | % | Mes | Completados/Total |
| Promedio Horas | Decimal | Mes | Total horas/Días |
| Turnos Semana | Count | Semana | Rango fechas |
| Turnos Mes | Count | Mes | Rango fechas |
| Programados | Count | Mes | Estado = programado |
| Ausencias | Count | Mes | Estado = ausente |
| Cancelados | Count | Mes | Estado = cancelado |
| Top 5 Personal | Ranking | Mes | Ordenado por turnos |
| Distribución Tipos | % | Mes | Agrupado por tipo |

## 🎯 Métricas Clave (KPIs)

1. **Operacionales**
   - Turnos Hoy
   - Turnos En Curso
   - Personal Disponible

2. **Calidad**
   - Tasa de Asistencia
   - Ausencias
   - Cancelaciones

3. **Productividad**
   - Promedio Horas/Día
   - Turnos Completados
   - Personal Más Activo

4. **Planificación**
   - Turnos Programados
   - Próximos Turnos
   - Distribución por Tipo

## 🚨 Alertas y Notificaciones (Futuras)

### Potenciales Mejoras
- 🔴 Alerta si tasa asistencia < 80%
- 🟠 Aviso si muchos turnos cancelados
- 🟡 Recordatorio de turnos próximos
- 🟢 Feedback positivo por buena asistencia

## 📈 Beneficios del Dashboard

1. **Visibilidad Total**: Todo en un vistazo
2. **Decisiones Data-Driven**: Basadas en métricas reales
3. **Detección Temprana**: Problemas y tendencias
4. **Motivación**: Rankings y reconocimiento
5. **Eficiencia**: No buscar en múltiples páginas
6. **Profesionalismo**: Presentación ejecutiva

---

**Versión**: 2.0.0  
**Última actualización**: 16 de Octubre 2025  
**Estado**: ✅ Completado y Operativo  
**Desarrollador**: Basado en análisis de página de Turnos
