import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Search,
  Users,
  Clock,
  DollarSign,
  Receipt,
  Calendar,
  BarChart3,
  Upload,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Home,
  ArrowRight,
  CheckCircle,
  Info,
  Lightbulb,
  AlertCircle,
  Star,
  Download,
  Eye
} from 'lucide-react'

const GuiaUso = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState('inicio')
  const [expandedAccordions, setExpandedAccordions] = useState({})

  // Datos de las secciones de la guía
  const guiaSections = {
    inicio: {
      title: 'Bienvenido a TransApp',
      icon: Home,
      color: 'blue',
      content: {
        intro: {
          title: '¿Qué es TransApp?',
          content: `TransApp es su nueva plataforma web para gestionar todas las operaciones de transporte de manera digital y automatizada. Diseñada especialmente para reemplazar las planillas Excel tradicionales, TransApp ofrece:

• **Gestión de trabajadores** con validación automática de RUT chileno
• **Programación de turnos** con calendario visual intuitivo  
• **Cálculo automático de pagos** según tarifas configurables
• **Generación de cobros semanales** con exportación a Excel profesional
• **Dashboard ejecutivo** con métricas financieras en tiempo real
• **Reportes automáticos** eliminando errores manuales de cálculo`
        },
        flujo: {
          title: 'Flujo de Trabajo Recomendado',
          content: `1. **Preparar datos maestros** - Actualizar trabajadores y configurar tarifas
2. **Cargar turnos** - Importar planillas Excel históricas o crear turnos nuevos
3. **Validar datos** - Revisar inconsistencias y corregir errores
4. **Gestionar turnos** - Programación semanal y seguimiento diario
5. **Generar cobros** - Facturación semanal con reportes Excel
6. **Calcular pagos** - Remuneraciones mensuales por trabajador
7. **Monitorear operación** - Dashboard ejecutivo con métricas clave`
        }
      }
    },
    dashboard: {
      title: 'Dashboard - Vista Ejecutiva',
      icon: BarChart3,
      color: 'green',
      content: {
        metricas: {
          title: 'Métricas Principales',
          content: `El Dashboard es su centro de control con información financiera actualizada en tiempo real.

**Tarjetas de Resumen**:
- **Ingresos Totales**: Suma de todos los cobros completados
- **Costos Totales**: Suma de todos los pagos a trabajadores  
- **Ganancia Neta**: Diferencia entre ingresos y costos
- **Turnos Completados**: Cantidad total de servicios realizados`
        },
        filtros: {
          title: 'Filtros Inteligentes',
          content: `**Filtros Financieros** (tarjetas superiores):
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
- **Mes actual**: Desempeño en curso`
        },
        graficos: {
          title: 'Gráficos y Análisis',
          content: `**Gráfico de Tendencias**:
- Líneas de ingresos y costos diarios
- Identificación de patrones y picos de actividad
- Análisis visual de rentabilidad por período

**Top 5 Trabajadores**:
- Ranking por cantidad de turnos completados
- Identificación de personal más productivo
- Datos para incentivos y reconocimientos`
        }
      }
    },
    trabajadores: {
      title: 'Gestión de Trabajadores',
      icon: Users,
      color: 'purple',
      content: {
        crear: {
          title: 'Crear Nuevo Trabajador',
          content: `1. Clic en botón **"Agregar Trabajador"** 
2. Completar formulario con datos requeridos:
   - **Nombre completo** (primer nombre + primer apellido para turnos)
   - **RUT** con validación automática chilena
   - **Tipo de contrato**: Fijo/Eventual/Planta
   - **Teléfono** de contacto
3. Sistema valida RUT y previene duplicados
4. Confirmación automática de registro exitoso`
        },
        buscar: {
          title: 'Buscar y Filtrar',
          content: `- **Barra de búsqueda**: Por nombre o RUT
- **Filtro por contrato**: Ver solo tipo específico
- **Filtro por estado**: Activos/Inactivos/Todos`
        },
        editar: {
          title: 'Editar Trabajador',
          content: `1. Clic en ícono **editar** (lápiz) en la fila del trabajador
2. Campos se vuelven editables directamente en la tabla
3. Botones **Guardar** (✓) / **Cancelar** (✗) aparecen
4. Cambios se sincronizan automáticamente con la base de datos`
        },
        estados: {
          title: 'Gestionar Estados',
          content: `- **Activar/Desactivar**: Botón de estado en cada fila
- **Trabajadores inactivos**: No aparecen en programación de turnos
- **Eliminación**: Solo permitida para trabajadores inactivos con confirmación`
        },
        cargaMasiva: {
          title: 'Carga Masiva de Trabajadores',
          content: `**Función de Importación CSV**:
1. Preparar archivo CSV con columnas: nombre,rut,contrato,telefono
2. Clic en **"Carga Masiva"**
3. Seleccionar archivo CSV preparado
4. Sistema procesa y valida cada registro
5. Reporte de éxitos y errores al finalizar`
        }
      }
    },
    turnos: {
      title: 'Programación de Turnos',
      icon: Clock,
      color: 'orange',
      content: {
        interface: {
          title: 'Interface de Turnos',
          content: `**Vistas Disponibles**:
- **Vista Calendario**: Cuadrícula semanal visual (predeterminada)
- **Vista Tabla**: Lista detallada con filtros avanzados

**Navegación de Semanas**:
- Botones **anterior/siguiente** para navegar
- **Botón "Hoy"** para volver a semana actual
- Visualización **"Semana del [fecha] al [fecha]"**

**Tipos de Turno**:
- **Primer Turno**: Horario matutino estándar
- **Segundo Turno**: Horario vespertino  
- **Tercer Turno**: Horario nocturno (mayor pago)`
        },
        asignar: {
          title: 'Asignar Trabajadores a Turnos',
          content: `**Proceso de Asignación**:
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
- Reglas de día siguiente (ej: después del 3º turno, solo 2º turno al día siguiente)`
        },
        funciones: {
          title: 'Funciones Avanzadas',
          content: `**Copiar Semana Completa**:
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
- Protección de datos históricos para informes financieros`
        },
        reglas: {
          title: 'Configuración de Reglas de Turnos',
          content: `**Acceso**: Botón **"Configurar Reglas"** en la parte superior del módulo

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

**Configuración se guarda automáticamente** y aplica en tiempo real a todas las asignaciones futuras.`
        }
      }
    },
    tarifas: {
      title: 'Gestión de Tarifas',
      icon: DollarSign,
      color: 'emerald',
      content: {
        centralizadas: {
          title: 'Configuración Centralizada de Tarifas',
          content: `**Acceso**: Sección **"Tarifas"** en el menú lateral

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
   - Aplica a todos los turnos realizados en domingo`
        },
        modificar: {
          title: 'Modificación de Tarifas',
          content: `1. Clic en **"Configurar Tarifas de Calendario"**
2. Ajustar valores según necesidades empresariales
3. **Guardar cambios** - aplican a turnos futuros
4. **Importante**: Turnos ya completados mantienen su valor histórico`
        },
        cobros: {
          title: 'Tarifas de Cobros (Ingresos por Cliente)',
          content: `**Configuración de Cobro**:
- **Tarifa única por turno completado** que se cobra al cliente
- Independiente del número de trabajadores asignados
- Valor configurable según acuerdos comerciales

**Aplicación**:
1. Clic en **"Configurar Tarifa de Cobros"**  
2. Establecer monto por turno realizado
3. **Guardar** - aplica a futuros cobros generados`
        }
      }
    },
    calendario: {
      title: 'Calendario y Feriados',
      icon: Calendar,
      color: 'indigo',
      content: {
        gestion: {
          title: 'Gestión del Calendario Empresarial',
          content: `**Funciones del Calendario**:
- **Vista semanal** de lunes a domingo
- **Navegación** por semanas con botones anterior/siguiente
- **Identificación visual** de días especiales:
  - **Domingos**: Fondo distintivo (máxima tarifa)
  - **Feriados**: Marcados visualmente (tarifa premium)
  - **Sábados**: Diferenciados para 3º turno especial`
        },
        feriados: {
          title: 'Configuración de Feriados',
          content: `**Gestión de Días Festivos**:
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
- Reportes reflejan diferencias de tarifas por tipo de día`
        }
      }
    },
    cobros: {
      title: 'Sistema de Cobros',
      icon: Receipt,
      color: 'teal',
      content: {
        generacion: {
          title: 'Generación de Cobros Semanales',
          content: `**Concepto**: Los cobros representan los **ingresos** que la empresa factura a sus clientes por los servicios de transporte realizados.

**Selección de Período**:
- **Filtro por Año**: Selector de año (2024, 2025, etc.)
- **Filtro por Semana**: Lista de semanas disponibles con fechas
  - Formato: "Semana 45 (4 nov - 10 nov)"
  - Solo muestra semanas con turnos completados

**Sistema de Cache Inteligente**:
- Semanas visitadas se guardan en memoria
- No recarga datos innecesariamente
- Navegación fluida entre períodos`
        },
        visualizacion: {
          title: 'Visualización de Cobros',
          content: `**Información por Semana**:
- **Total de cobros** de la semana seleccionada
- **Desglose por día** con turnos facturables
- **Detalle por turno**: trabajadores, tipo, monto cobrado
- **Subtotales diarios** para control

**Datos Históricos Inmutables**:
- Cobros utilizan **valores guardados** en la base de datos
- Cambios futuros de tarifas **NO afectan** cobros pasados
- Garantiza integridad financiera y contable`
        },
        exportacion: {
          title: 'Exportación de Reportes de Cobros',
          content: `**Generar Reporte Excel**:
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
  - Metadatos de empresa y fecha de generación`
        }
      }
    },
    pagos: {
      title: 'Sistema de Pagos',
      icon: DollarSign,
      color: 'rose',
      content: {
        calculo: {
          title: 'Cálculo de Pagos a Trabajadores',
          content: `**Concepto**: Los pagos representan los **costos** que la empresa paga a sus trabajadores por los turnos realizados.

**Filtros Disponibles**:
- **Filtro por Año**: Selector de año fiscal
- **Filtro por Mes**: Lista desplegable de meses con datos
  - Solo muestra meses con registros de turnos
  - Formato: "Enero 2025", "Febrero 2025", etc.

**Vista Automática**:
- Al acceder, muestra automáticamente el **mes actual**
- Navegación intuitiva entre diferentes períodos
- Cache inteligente evita recargas innecesarias`
        },
        desglose: {
          title: 'Desglose de Pagos',
          content: `**Información por Trabajador**:
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
- Vista expandida para análisis detallado`
        },
        alertas: {
          title: 'Sistema de Alertas y Validaciones',
          content: `**Alertas de Integridad de Datos**:
- **🔴 Días Faltantes**: Días del mes sin ningún registro
- **🟠 Días Sin Turnos**: Días presentes pero sin turnos asignados  
- **🟡 Mes Incompleto**: Cuando el mes tiene menos del 80% de datos
- **⚪ Sin Datos**: No hay información para el período seleccionado

**Propósito**:
- Identificar posibles omisiones en la programación
- Alertar sobre períodos con datos incompletos
- Ayudar a mantener registros completos y consistentes`
        },
        reportes: {
          title: 'Reportes de Pagos',
          content: `**Exportación a Excel**:
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
- **Metadatos**: Fecha de generación, período reportado, información de empresa`
        }
      }
    },
    cargaMasiva: {
      title: 'Importación de Planillas Excel',
      icon: Upload,
      color: 'cyan',
      content: {
        importacion: {
          title: 'Carga de Planillas de Turnos Excel',
          content: `**¿Para qué sirve?**: Migrar todas sus planillas Excel históricas al sistema digital de una sola vez, sin perder información.

**¿Qué archivos acepta?**: Archivos Excel (.xlsx, .xls) con planillas de turnos como las que ya maneja habitualmente.

**¿Cómo acceder?**: Vaya a la sección **"Subir Archivos"** en el menú lateral.

**¿Qué información extrae?**:
• **Trabajadores**: Nombres automáticos desde las planillas
• **Turnos programados**: Fechas, horarios y asignaciones
• **Tipos de turno**: Primer turno, segundo turno, tercer turno
• **Estados**: Detecta turnos completados o programados automáticamente`
        },
        proceso: {
          title: 'Cómo Subir sus Planillas Excel',
          content: `**Paso 1 - Seleccionar Modo de Validación**:
• **Estándar**: Recomendado para la mayoría de planillas
• **Permisivo**: Si sus planillas tienen pequeñas diferencias de formato
• **Estricto**: Solo para planillas con formato perfecto y consistente
• **Planillas Antiguas**: Para planillas con formatos muy diferentes

**Paso 2 - Subir Archivos**:
• Haga clic en "Seleccionar Archivos" o arrastre sus planillas Excel
• Puede subir múltiples archivos a la vez
• El sistema procesa automáticamente cada planilla

**Paso 3 - Revisión Automática**:
• El sistema lee toda la información de sus planillas
• Detecta trabajadores, fechas, turnos y horarios
• Le muestra un resumen completo antes de guardar`
        },
        validacion: {
          title: 'Sistema Inteligente de Validación',
          content: `**Detección de Trabajadores**:
• El sistema identifica automáticamente los nombres de trabajadores
• Sugiere conexiones con trabajadores ya registrados en el sistema
• Puede vincular manualmente si los nombres no coinciden exactamente

**Correcciones Automáticas**:
• **Fechas**: Convierte fechas de Excel al formato del sistema
• **Nombres**: Normaliza mayúsculas y espacios extra
• **Turnos duplicados**: Detecta y avisa sobre posibles duplicaciones
• **Datos faltantes**: Identifica información incompleta para revisión

**Reporte de Resultados**:
Después del procesamiento verá:
• ✅ **Registros importados exitosamente** - Cuántos turnos se guardaron
• ⚠️ **Advertencias** - Datos que necesitan revisión manual
• ❌ **Errores** - Problemas que impidieron importar ciertos registros`
        },
        recomendaciones: {
          title: 'Consejos para una Importación Exitosa',
          content: `**Antes de importar**:
• **Organice sus planillas**: Una planilla por semana funciona mejor
• **Revise nombres**: Verifique que los nombres de trabajadores estén escritos consistentemente
• **Fechas claras**: Asegúrese que las fechas estén en formato reconocible

**Durante la importación**:
• **Revise las sugerencias**: El sistema le sugerirá conexiones entre trabajadores
• **Valide el resumen**: Revise el resumen antes de confirmar
• **Corrija errores**: Si hay errores, puede corregir las planillas y volver a intentar

**Después de importar**:
• **Verifique en Turnos**: Vaya a la sección Turnos para ver sus datos importados
• **Revise Inconsistencias**: Si hay problemas, aparecerán en la sección de alertas
• **Genere reportes**: Pruebe generar cobros o pagos para verificar que todo funciona`
        }
      }
    },
    inconsistencias: {
      title: 'Detección de Inconsistencias',
      icon: AlertTriangle,
      color: 'amber',
      content: {
        auditoria: {
          title: 'Sistema de Auditoría Automática',
          content: `**Propósito**: Identificar y reportar problemas de integridad en los datos del sistema.

**Tipos de Inconsistencias Detectadas**:

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
- Tarifas faltantes o incorrectas`
        },
        resolucion: {
          title: 'Acceso y Resolución',
          content: `**Visualización de Inconsistencias**:
1. **Indicador en menú lateral**: Número rojo cuando hay problemas
2. **Sección "Inconsistencias"**: Lista detallada de todos los problemas
3. **Descripción clara** de cada problema encontrado
4. **Sugerencias de resolución** para cada tipo de error

**Resolución de Problemas**:
- **Enlaces directos** a las secciones correspondientes para corrección
- **Actualización automática** después de corregir datos
- **Re-verificación** periódica para mantener integridad`
        }
      }
    },
    solucionProblemas: {
      title: 'Solución de Problemas',
      icon: AlertCircle,
      color: 'red',
      content: {
        conectividad: {
          title: 'Problemas de Conectividad',
          content: `**Síntoma**: "Error de conexión" o datos no se actualizan
**Solución**:
1. Verificar conexión a internet
2. Refrescar la página (F5 o Ctrl+R)
3. Cerrar y volver a abrir el navegador
4. Verificar que la URL sea correcta`
        },
        login: {
          title: 'Problemas de Login',
          content: `**Síntoma**: No puede acceder al sistema
**Soluciones**:
1. **Credenciales incorrectas**: Verificar usuario admin y contraseña transapp123
2. **Cuenta bloqueada**: Esperar 15 minutos si excedió intentos
3. **Navegador**: Limpiar cache y cookies del sitio
4. **Modo incógnito**: Probar en ventana privada/incógnito`
        },
        excel: {
          title: 'Problemas de Exportación Excel',
          content: `**Síntoma**: No se descarga el archivo Excel
**Soluciones**:
1. **Bloqueador de pop-ups**: Permitir descargas en el navegador
2. **Antivirus**: Verificar que no esté bloqueando descargas
3. **Espacio en disco**: Verificar espacio disponible
4. **Navegador compatible**: Chrome, Firefox, Edge actualizados`
        },
        datos: {
          title: 'Datos No Se Guardan',
          content: `**Síntoma**: Cambios no persisten después de refrescar
**Soluciones**:
1. **Conexión**: Verificar que hay internet estable
2. **Tiempo de espera**: Permitir que operación complete antes de navegar
3. **Navegador**: Habilitar JavaScript y localStorage
4. **Cache**: Limpiar cache del navegador`
        }
      }
    },
    mejoresPracticas: {
      title: 'Mejores Prácticas',
      icon: Lightbulb,
      color: 'yellow',
      content: {
        recomendaciones: {
          title: 'Recomendaciones Generales',
          content: `- Mantén tus datos maestros (Trabajadores, Vehículos, Rutas) al día. El resto del sistema depende de ellos.
- Dedica unos minutos cada semana a revisar Inconsistencias. Es más fácil corregir pequeños errores que rehacer todo un mes.
- Marca los turnos como completados al final del día. Evita dejarlo para después.
- Guarda respaldos periódicos desde Configuración y conserva los Excel exportados.
- Usa el Dashboard como control de calidad: si ves que los turnos programados no coinciden con los completados, investiga antes del cierre.`
        },
        cierres: {
          title: 'Cierres Semanales y Mensuales',
          content: `**Cierre semanal de cobros**:
1. Asegúrate de que todos los turnos de la semana estén marcados como Completado en Turnos.
2. Verifica montos de cobro en cada turno (columna cobro).
3. Abre Cobros, selecciona la semana y revisa el resumen.
4. Exporta el Excel para dejar registro o enviarlo a tu cliente.

**Cierre mensual de pagos**:
1. Revisa que todos los turnos del mes estén completados y con montos de pago correctos.
2. En Pagos, elige el mes objetivo y controla las alertas.
3. Corrige datos faltantes (por ejemplo, carga de turnos olvidada) y refresca la vista.
4. Exporta el reporte y utilizalo como base para liquidaciones o comprobantes.`
        },
        implementacion: {
          title: 'Plan de Implementación',
          content: `**Fase 1: Implementación Inicial (Semana 1-2)**
- [ ] Acceder al sistema con credenciales proporcionadas
- [ ] Configurar tarifas actuales del negocio
- [ ] Cargar trabajadores existentes (CSV o manual)
- [ ] Establecer feriados del año fiscal

**Fase 2: Operación Paralela (Semana 3-4)**
- [ ] Programar turnos tanto en Excel como en TransApp
- [ ] Comparar cálculos de pagos entre ambos sistemas
- [ ] Validar reportes de cobros
- [ ] Identificar y resolver discrepancias

**Fase 3: Transición Completa (Semana 5-6)**
- [ ] Usar TransApp como fuente única de verdad
- [ ] Generar reportes oficiales solo desde TransApp
- [ ] Establecer rutinas de backup y mantenimiento
- [ ] Documentar procesos internos específicos`
        }
      }
    }
  }

  // Función para toggle accordions
  const toggleAccordion = (sectionKey, accordionKey) => {
    const key = `${sectionKey}_${accordionKey}`
    setExpandedAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Filtrar secciones basado en búsqueda
  const filteredSections = Object.entries(guiaSections).filter(([key, section]) => {
    const searchLower = searchTerm.toLowerCase()
    const titleMatch = section.title.toLowerCase().includes(searchLower)
    const contentMatch = Object.values(section.content).some(item => 
      item.title.toLowerCase().includes(searchLower) ||
      item.content.toLowerCase().includes(searchLower)
    )
    return titleMatch || contentMatch
  })

  // Función para renderizar texto inline con formato markdown
  const renderInlineText = (text) => {
    if (!text) return null
    
    // Procesar texto en negrita **texto**
    const parts = text.split(/(\*\*[^*]*\*\*)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  // Función para renderizar contenido con formato markdown básico
  const renderContent = (content) => {
    if (!content) return null
    
    const lines = content.split('\n').filter(line => line.trim() !== '')
    const elements = []
    let listItems = []
    let currentListType = null
    
    const flushList = () => {
      if (listItems.length > 0) {
        if (currentListType === 'ul') {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc ml-6 mb-4 space-y-1">
              {listItems}
            </ul>
          )
        } else if (currentListType === 'ol') {
          elements.push(
            <ol key={`list-${elements.length}`} className="list-decimal ml-6 mb-4 space-y-1">
              {listItems}
            </ol>
          )
        }
        listItems = []
        currentListType = null
      }
    }
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // Headers (líneas que empiezan y terminan con ** y tienen más de 4 caracteres)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        flushList()
        elements.push(
          <h4 key={`header-${index}`} className="font-bold text-gray-900 mt-6 mb-3 first:mt-0">
            {trimmedLine.slice(2, -2)}
          </h4>
        )
        return
      }
      
      // Lista items con bullet points
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        if (currentListType !== 'ul') {
          flushList()
          currentListType = 'ul'
        }
        listItems.push(
          <li key={`li-${index}`} className="text-gray-700">
            {renderInlineText(trimmedLine.slice(2).trim())}
          </li>
        )
        return
      }
      
      // Lista numerada
      if (/^\d+\./.test(trimmedLine)) {
        if (currentListType !== 'ol') {
          flushList()
          currentListType = 'ol'
        }
        listItems.push(
          <li key={`li-${index}`} className="text-gray-700">
            {renderInlineText(trimmedLine.replace(/^\d+\.\s*/, '').trim())}
          </li>
        )
        return
      }
      
      // Checkboxes
      if (trimmedLine.includes('- [ ]')) {
        flushList()
        elements.push(
          <div key={`checkbox-${index}`} className="flex items-center gap-2 mb-2">
            <input type="checkbox" className="rounded" />
            <span className="text-gray-700">{renderInlineText(trimmedLine.replace('- [ ]', '').trim())}</span>
          </div>
        )
        return
      }
      
      // Texto regular
      if (trimmedLine) {
        flushList()
        elements.push(
          <p key={`p-${index}`} className="mb-3 text-gray-700 leading-relaxed">
            {renderInlineText(trimmedLine)}
          </p>
        )
      }
    })
    
    // Flush any remaining list items
    flushList()
    
    return elements
  }

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      purple: 'text-purple-600 bg-purple-50',
      orange: 'text-orange-600 bg-orange-50',
      emerald: 'text-emerald-600 bg-emerald-50',
      indigo: 'text-indigo-600 bg-indigo-50',
      teal: 'text-teal-600 bg-teal-50',
      rose: 'text-rose-600 bg-rose-50',
      cyan: 'text-cyan-600 bg-cyan-50',
      amber: 'text-amber-600 bg-amber-50',
      slate: 'text-slate-600 bg-slate-50',
      red: 'text-red-600 bg-red-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      sky: 'text-sky-600 bg-sky-50'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-orange-600 rounded-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guía de Uso TransApp</h1>
            <p className="text-gray-600">Manual interactivo del sistema</p>
          </div>
        </div>
        
        {/* Búsqueda */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar en la guía..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Navegación horizontal compacta */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(guiaSections).map(([key, section]) => {
              const Icon = section.icon
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSection(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSection === key
                      ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal - ahora ocupa todo el ancho */}
      <div className="space-y-6">
          {searchTerm ? (
            // Mostrar resultados de búsqueda
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Resultados de búsqueda para "{searchTerm}"
                  </CardTitle>
                  <CardDescription>
                    {filteredSections.length} sección(es) encontrada(s)
                  </CardDescription>
                </CardHeader>
              </Card>
              
              {filteredSections.map(([key, section]) => {
                const Icon = section.icon
                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getIconColor(section.color)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(section.content).map(([contentKey, item]) => (
                        <div key={contentKey} className="border-l-2 border-gray-100 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                          <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                            {renderContent(item.content)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          ) : (
            // Mostrar sección seleccionada
            (() => {
              const section = guiaSections[selectedSection]
              if (!section) return null
              
              const Icon = section.icon
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getIconColor(section.color)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(section.content).map(([contentKey, item]) => {
                      const isExpanded = expandedAccordions[`${selectedSection}_${contentKey}`]
                      return (
                        <div key={contentKey} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleAccordion(selectedSection, contentKey)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1 bg-white rounded">
                                {contentKey === 'intro' && <Info className="h-4 w-4 text-blue-600" />}
                                {contentKey === 'acceso' && <Eye className="h-4 w-4 text-green-600" />}
                                {contentKey === 'flujo' && <ArrowRight className="h-4 w-4 text-orange-600" />}
                                {contentKey === 'metricas' && <BarChart3 className="h-4 w-4 text-purple-600" />}
                                {contentKey === 'filtros' && <Search className="h-4 w-4 text-indigo-600" />}
                                {contentKey === 'graficos' && <BarChart3 className="h-4 w-4 text-teal-600" />}
                                {contentKey === 'crear' && <Users className="h-4 w-4 text-blue-600" />}
                                {contentKey === 'buscar' && <Search className="h-4 w-4 text-green-600" />}
                                {contentKey === 'editar' && <Users className="h-4 w-4 text-orange-600" />}
                                {contentKey === 'estados' && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                                {contentKey === 'cargaMasiva' && <Upload className="h-4 w-4 text-purple-600" />}
                                {contentKey === 'interface' && <Calendar className="h-4 w-4 text-blue-600" />}
                                {contentKey === 'asignar' && <Clock className="h-4 w-4 text-green-600" />}
                                {contentKey === 'funciones' && <Clock className="h-4 w-4 text-orange-600" />}
                                {contentKey === 'reglas' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                                {contentKey === 'centralizadas' && <DollarSign className="h-4 w-4 text-emerald-600" />}
                                {contentKey === 'modificar' && <DollarSign className="h-4 w-4 text-blue-600" />}
                                {contentKey === 'cobros' && <Receipt className="h-4 w-4 text-teal-600" />}
                                {contentKey === 'gestion' && <Calendar className="h-4 w-4 text-indigo-600" />}
                                {contentKey === 'feriados' && <Star className="h-4 w-4 text-amber-600" />}
                                {contentKey === 'generacion' && <Receipt className="h-4 w-4 text-teal-600" />}
                                {contentKey === 'visualizacion' && <Eye className="h-4 w-4 text-blue-600" />}
                                {contentKey === 'exportacion' && <Download className="h-4 w-4 text-green-600" />}
                                {contentKey === 'calculo' && <DollarSign className="h-4 w-4 text-rose-600" />}
                                {contentKey === 'desglose' && <BarChart3 className="h-4 w-4 text-purple-600" />}
                                {contentKey === 'alertas' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                                {contentKey === 'reportes' && <Download className="h-4 w-4 text-green-600" />}
                                {contentKey === 'importacion' && <Upload className="h-4 w-4 text-cyan-600" />}
                                {contentKey === 'proceso' && <Upload className="h-4 w-4 text-cyan-600" />}
                                {contentKey === 'validacion' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {contentKey === 'recomendaciones' && <Lightbulb className="h-4 w-4 text-yellow-600" />}
                                {contentKey === 'auditoria' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                                {contentKey === 'resolucion' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {contentKey === 'conectividad' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                {contentKey === 'login' && <Eye className="h-4 w-4 text-orange-600" />}
                                {contentKey === 'datos' && <AlertTriangle className="h-4 w-4 text-blue-600" />}
                                {contentKey === 'recomendaciones' && <Lightbulb className="h-4 w-4 text-yellow-600" />}
                                {contentKey === 'cierres' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {contentKey === 'implementacion' && <ArrowRight className="h-4 w-4 text-blue-600" />}
                                {!['intro', 'acceso', 'flujo', 'metricas', 'filtros', 'graficos', 'crear', 'buscar', 'editar', 'estados', 'cargaMasiva', 'interface', 'asignar', 'funciones', 'reglas', 'centralizadas', 'modificar', 'cobros', 'gestion', 'feriados', 'generacion', 'visualizacion', 'exportacion', 'calculo', 'desglose', 'alertas', 'reportes', 'importacion', 'proceso', 'validacion', 'auditoria', 'resolucion', 'conectividad', 'login', 'datos', 'recomendaciones', 'cierres', 'implementacion'].includes(contentKey) && 
                                  <Info className="h-4 w-4 text-gray-600" />}
                              </div>
                              <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            </div>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          
                          {isExpanded && (
                            <div className="p-4 bg-white">
                              <div className="prose prose-sm max-w-none text-gray-700">
                                {renderContent(item.content)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })()
          )}

        {/* Footer con información adicional */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-1 bg-gradient-to-br from-blue-600 to-orange-600 rounded">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">TransApp - Sistema de Gestión de Transporte</span>
              </div>
              <p className="text-sm text-gray-600">
                🌟 Transformando planillas Excel en inteligencia empresarial desde 2025
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                <span>🔐 Sistema Seguro</span>
                <span>📊 Reportes Automáticos</span>
                <span>💼 Gestión Profesional</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default GuiaUso