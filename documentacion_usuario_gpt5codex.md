# Manual de Usuario - TransApp

> **Versión del sistema:** v1.0.0 · **Fecha de elaboración:** 16-09-2025
>
> Este documento explica, con palabras simples, cómo administrar tu operación diaria de transporte en TransApp. Está pensado para personas que hasta ahora manejaban todo en Excel y hoy darán el salto a esta plataforma web.

## Tabla de contenidos
1. [Antes de empezar](#antes-de-empezar)
2. [Cómo está organizada la aplicación](#como-esta-organizada-la-aplicación)
3. [Acceso y seguridad](#acceso-y-seguridad)
4. [Flujo de trabajo recomendado](#flujo-de-trabajo-recomendado)
5. [Módulos paso a paso](#módulos-paso-a-paso)
   - [Dashboard](#dashboard)
   - [Trabajadores](#trabajadores)
   - [Cargar Archivos (planillas Excel)](#cargar-archivos-planillas-excel)
   - [Inconsistencias](#inconsistencias)
   - [Turnos](#turnos)
   - [Tarifas](#tarifas)
   - [Calendario (feriados y tarifas)](#calendario-feriados-y-tarifas)
   - [Cobros](#cobros)
   - [Pagos](#pagos)
   - [Vehículos](#vehículos)
   - [Rutas](#rutas)
   - [Configuración](#configuración)
6. [Flujos frecuentes](#flujos-frecuentes)
7. [Exportaciones y reportes](#exportaciónes-y-reportes)
8. [Resolución de problemas comunes](#resolucion-de-problemas-comunes)
9. [Buenas prácticas](#buenas-prácticas)
10. [Soporte y contacto](#soporte-y-contacto)

---

## Antes de empezar

- **Qué necesitas**
  - Usuario y contraseña entregados por tu administrador.
  - Tu listado actualizado de trabajadores, vehículos y rutas (puede salir de tus planillas actuales).
  - Las planillas Excel de turnos que actualmente utilizas.
  - Definición clara de cuánto se paga y cuánto se cobra por turno (tarifas vigentes).

- **Conceptos que usa la aplicación**

  | Término | Qué significa |
  | --- | --- |
  | **Turno** | Un bloque de trabajo que hace un conductor en una fecha específica. Puede ser primer, segúndo o tercer turno. |
  | **Estado del turno** | Programado (aún no se realiza), Completado (ya se ejecutó), Cancelado. Sólo los completados alimentan Cobros y Pagos. |
  | **Pago** | Lo que la empresa le paga al trabajador por un turno completado. |
  | **Cobro** | Lo que se le factura al cliente por dicho turno (si aplica). |
  | **Tarifas** | Reglas que definen cuánto pagar o cobrar según el día (lunes a sábado, domingo, feriado, tercer turno, etc.). |
  | **Semana ISO** | Forma estándar de numerar las semanas (lunes a domingo). La app la usa en el módulo Cobros. |

---

## Cómo está organizada la aplicación

- **Encabezado y menú**
  - Arriba siempre verás el logo de TransApp y un botón para abrir o cerrar el menú lateral desde el celular.
  - A la izquierda está el menú con los módulos: Dashboard, Trabajadores, Turnos, etc. Haz clic para cambiar de sección.

- **Panel central**
  - Cada módulo muestra tarjetas con indicadores, tablas y botones de acción.
  - Busca el ícono de recarga (flechas en círculo) para actualizar datos desde Supabase cuando realices cambios.

- **Supabase como base de datos**
  - Todos los datos oficiales se guardan en la nube (Supabase). Subir planillas, editar trabajadores o marcar turnos actualiza esas tablas.
  - Algunas pantallas guardan caché temporal para que todo cargue más rápido. Si cambias datos y no los ves, usa el botón Actualizar.

---

## Acceso y seguridad

1. Ingresa a la URL de TransApp y completa usuario y contraseña.
2. El sistema limita la cantidad de intentos. Si te equivocas muchas veces, verás un aviso y deberás esperar antes de volver a probar.
3. Puedes mostrar u ocultar la contraseña con el ícono de ojo.
4. Si ves un mensaje de usuario bloqueado, espera unos minutos y vuelve a intentar. Si el problema persiste, contacta a soporte.

---

## Flujo de trabajo recomendado

1. **Preparar datos maestros**
   - Actualiza trabajadores, vehículos y rutas para que coincidan con tu operación real.
   - Revisa y ajusta tarifas y feriados en los módulos Tarifas y Calendario.

2. **Cargar turnos desde Excel**
   - Usa la sección Cargar Archivos para subir tus planillas históricas o semanales.
   - Realiza el mapeo de nombres si el archivo tiene nombres distintos a los que ya existen en Supabase.

3. **Validar calidad de datos**
   - Ingresa a Inconsistencias para ver si hubo errores al procesar los Excel (nombres sin asignar, fechas vacías, etc.).
   - Corrige la planilla fuente o ajusta los datos en Turnos o Trabajadores según corresponda.

4. **Gestionar turnos diarios**
   - Desde Turnos, revisa la semana en curso, crea nuevos turnos, editalos o marcalos como completados cuando correspondan.

5. **Cerrar cobros semanales**
   - En Cobros, selecciona la semana, revisa el total a facturar y exporta el informe para tu contador o tu cliente.

6. **Cerrar pagos mensuales**
   - En Pagos, elige el mes, revisa totales por trabajador, valida alertas y genera el reporte en Excel.

7. **Monitorear operación**
   - Vuelve al Dashboard para ver indicadores generales (turnos planificados, margen, trabajadores activos, alertas) y toma decisiones.

---

## Módulos paso a paso

### Dashboard

- **Propósito:** ofrece un resumen ejecutivo con métricas de trabajadores, turnos, finanzas y alertas.
- **Lo que verás:** tarjetas con totales, gráficos de tendencia, ranking de conductores y distribución de turnos.
- **Cómo usarlo:**
  1. Revisa los indicadores para validar que la información esté completa (por ejemplo, turnos programados vs completados).
  2. Ajusta los filtros de tiempo (mes actual, mes anterior, año completo, periodos móviles) para analizar cambios.
  3. Revisa las alertas para detectar turnos en riesgo, ausencias o problemas de carga.
- **Consejo:** si un número parece incorrecto, vuelve a Turnos o Cargar Archivos para validar que los registros estén completos.

### Trabajadores

- **Propósito:** mantener actualizado el registro de conductores y su información basica.
- **Acciones principales:**
  1. Consultar: verás una lista con nombre, RUT, tipo de contrato, telefono y estado (activo o inactivo).
  2. Buscar y filtrar: usa la barra de busqueda por nombre o RUT y los filtros por contrato o estado.
  3. Crear trabajador: el botón Agregar abre un formulario. El sistema normaliza el nombre en mayúsculas y revisa si el RUT ya existe.
  4. Carga masiva: usa Carga masiva para subir varios trabajadores desde un Excel (modal especial).
  5. Editar en línea: clic en el ícono de lapiz para habilitar edicion rapida de nombre, telefono, contrato y estado.
  6. Cambiar estado: marca un trabajador como inactivo cuando ya no trabaje contigo; conservaras su historial.
- **Consejo:** asegura que el RUT tenga guion (el sistema puede agregarselo) y que el nombre coincida con el que viene en tus planillas para evitar mapeos manuales.

### Cargar Archivos (planillas Excel)

- **Propósito:** importar tus planillas de turnos desde Excel y llevar la información a Supabase.
- **Pasos recomendados:**
  1. Presiona Seleccionar archivo y elige la planilla Excel.
  2. Define el modo de validacion (por defecto es el recomendado).
  3. El sistema lee los turnos, detecta los nombres de conductores y propone sugerencias de mapeo contra tu lista oficial.
  4. Revisa el panel de Nombres encontrados. Si hay nombres que no coinciden con tus trabajadores, selecciona el correcto manualmente.
  5. Una vez mapeado todo, confirma el guardado en Supabase. El sistema te mostrara estadisticas de cuántos turnos se subiran y cuántos se omiten.
  6. Revisa el resumen final: cantidad de turnos cargados, omitidos y trabajadores no mapeados.
- **Funciones adicionales:**
  - Boton de carga de demo para probar con datos de ejemplo.
  - Posibilidad de limpiar datos previos (requiere confirmacion, usalo solo cuando estes seguro).
- **Consejo:** intenta que el Excel tenga una columna con el nombre exacto del conductor. Cuanto menor trabajo de mapeo manual, más rápido terminaras.

### Inconsistencias

- **Propósito:** revisar errores detectados durante la carga de archivos (nombres sin asignar, fechas en blanco, formatos incorrectos, etc.).
- **Cómo usarlo:**
  1. Entra después de una carga. Veras un resumen con número de archivos, cantidad de problemas y última actualizacion.
  2. Despliega cada archivo para leer los detalles (tipo de alerta, fila, sugerencia).
  3. Corrige los datos en la planilla original o en los módulos Trabajadores o Turnos según la causa.
  4. Cuando todo este resuelto, usa Limpiar todo para reiniciar el reporte de inconsistencias.
- **Consejo:** si no ves inconsistencias pero sabes que faltan datos, revisa que hayas mapeado bien los nombres en la carga o que el archivo tenga la hoja correcta.

### Turnos

- **Propósito:** administrar la programacion semanal y el seguimiento de los turnos de cada conductor.
- **Secciones clave:**
  - Vista semanal con columnas por día y filas por tipo de turno.
  - Botones para agregar (simbolo +), copiar semana anterior, refrescar datos y abrir configuraciones.
  - Filtros por trabajador, estado y buscador rápido.
- **Flujo tipico:**
  1. Navegar por semanas: usa las flechas para avanzar o retroceder. La app carga automaticamente los meses necesarios en segúndo plaño.
  2. Agregar turno: el botón Agregar turno abre un formulario para elegir trabajador, fecha, turno y vehiculo.
  3. Editar turno: haz clic en un turno existente para ajustar trabajador o tipo de turno.
  4. Marcar como completado: al finalizar la jornada cambia el estado a Completado. Esto habilita el cálculo en Cobros y Pagos.
  5. Configurar reglas: abre la configuración para definir combinaciones permitidas entre turnos, limites por día y reglas para el día siguiente (por ejemplo, si alguien hace tercer turno, al día siguiente solo puede ir al segúndo turno).
- **Consejo:** revisa los avisos en pantalla. Si la app detecta que superas el limite de trabajadores por turno o que rompes una regla de descanso, mostrara alertas.

### Tarifas

- **Propósito:** mantener las tarifas oficiales de pago al trabajador y de cobro a clientes.
- **Elementos de la pantalla:**
  - Tarjetas resumen con los valores vigentes (primer o segúndo turno, tercer turno, feriados, domingos).
  - Botones para editar Tarifas de calendario y Tarifa de cobro.
  - Registro de la última actualizacion.
- **Actualizar tarifas:**
  1. Pulsa Editar en la sección que quieras modificar.
  2. Ajusta los montos (en pesos chilenos) según corresponda.
  3. Guarda. El sistema actualiza Supabase y deja lista la nueva tarifa.
  4. Vuelve a cargar las pantallas de Cobros o Pagos para ver las nuevas cifras.
- **Consejo:** añota la fecha de vigencia en tus politicas internas. Aunque el sistema guarda el valor en la base de datos, es util tener un respaldo en PDF o correo.

### Calendario (feriados y tarifas)

- **Propósito:** administrar feriados y confirmar las tarifas que se aplicaran según el día.
- **Que puedes hacer:**
  - Revisar la semana en curso con los días destacados que son feriados.
  - Agregar o eliminar feriados (el módulo guarda la fecha y descripcion en la tabla holidays).
  - Descargar y cargar configuraciones desde o hacia un archivo para respaldo.
- **Pasos rápidos para agregar un feriado:**
  1. Abre el panel de configuración.
  2. Escribe la fecha en formato AAAA-MM-DD y una breve descripcion.
  3. Guarda. El feriado aparece inmedíatamente en tus turnos y en el cálculo de tarifas.
- **Consejo:** mantén este listado actualizado. Si en Pagos ves un turno que se pago como día normal siendo feriado, probablemente esta tabla no este al día.

### Cobros

- **Propósito:** calcular cuánto debes cobrar por los turnos completados en una semana específica.
- **Cómo se organiza:**
  - Selector de año y semana (formato AAAA-WNN). La app muestra ademas el rango de fechas real (por ejemplo 27-01 al 02-02).
  - Tarjetas de totales: cantidad de turnos, total a cobrar, cobro típico.
  - Lista de turnos de la semana, con detalles por conductor, fecha y monto.
  - Ranking de conductores con mas turnos en la semana.
- **Flujo recomendado:**
  1. Elige el año y luego la semana. La app usa caché, asi que la primera carga puede tardar unos segúndos.
  2. Revisa los turnos listados. Si falta alguno, vuelve a Turnos y confirma que este marcado como Completado y con el monto de cobro ingresado.
  3. Ajusta la tarifa de cobro desde el botón de configuración si cambio tu politica.
  4. Usa Exportar para generar un Excel con dos hojas: resumen ejecutivo y detalle por turno.
- **Consejo:** antes de cerrar la semana, asegúrate de que no queden turnos en estado Programado. Sólo los completados entran en el cálculo.

### Pagos

- **Propósito:** calcular las remuneraciones mensuales de los trabajadores según los turnos completados.
- **Componentes principales:**
  - Selectores de año y mes. La app solo carga datos del mes elegido para mantener buen rendimiento.
  - Tarjetas resumen con total a pagar, turnos contabilizados, feriados y domingos trabajados.
  - Lista por trabajador con subtotal y detalle de cada turno (se despliega al hacer clic).
  - Alertas automaticas sobre días faltantes o meses incompletos.
- **Flujo recomendado:**
  1. Selecciona año y mes. Si es la primera vez, el sistema propone el mes actual.
  2. Revisa las alertas amarillas. Si faltan días, significa que hay fechas sin turnos completados.
  3. Expande cada trabajador para ver el detalle de fechas y montos.
  4. Usa Actualizar para refrescar los datos si editaste algo en Turnos.
  5. Genera el Excel con Exportar; incluye hojas con resumen ejecutivo y detalle individuales con formato profesional listo para compartir.
- **Consejo:** el módulo usa la tarifa guardada en cada turno (campo pago). Si cambias una tarifa retroactivamente, deberás actualizar los turnos correspondientes para que se refleje.

### Vehículos

- **Propósito:** llevar un registro de los camiones o vehículos disponibles.
- **Que puedes hacer:**
  - Ver el total de vehículos, cuántos estan operativos o en mantenimiento.
  - Consultar datos clave: patente, marca y modelo, año, conductor asignado y proxima mantencion.
  - Agregar nuevos vehículos o editar los existentes (botones laterales).
- **Consejo:** aúnque no cargues turnos desde esta pantalla, mantenerla al día te ayuda a asignar correctamente en Turnos y Rutas.

### Rutas

- **Propósito:** administrar las rutas de transporte y su estado operativo.
- **Contenido:**
  - Tarjetas con totales (activas, en pausa, asignadas).
  - Tabla detallada con código, nombre, origen y destino, distancia, tiempo estimado y asignaciones.
  - Botones para crear rutas nuevas o asignarlas a vehículos y conductores.
- **Consejo:** cuando generes turnos en la semana, asegúrate de que la ruta asignada esté en estado Activa para evitar confusiones.

### Configuración

- **Propósito:** centralizar ajustes generales de la empresa y tareas administrativas.
- **Secciones disponibles:**
  - Información de la empresa (razón social, RUT, dirección).
  - Gestión de usuarios (listar administradores, cambiar contraseña, agregar usuarios).
  - Notificaciones (activar recordatorios de mantenimientos, pagos pendientes, etc.).
  - Seguridad (tiempo de sesión, segunda autenticación).
  - Gestión de datos (respaldo, exportación, limpieza total de datos; úsala con precaución).
  - Información del sistema (versión, espacio usado, estado en línea).
- **Consejo:** la opción Limpiar TODOS los Datos borra datos locales almacenados en caché. No la utilices sin estar seguro y siempre teniendo un respaldo.

---

## Flujos frecuentes

### A. Cierre semanal de cobros
1. Asegúrate de que todos los turnos de la semana estén marcados como Completado en Turnos.
2. Verifica montos de cobro en cada turno (columna cobro).
3. Abre Cobros, selecciona la semana y revisa el resumen.
4. Exporta el Excel para dejar registro o enviarlo a tu cliente.

### B. Cierre mensual de pagos
1. Revisa que todos los turnos del mes estén completados y con montos de pago correctos.
2. En Pagos, elige el mes objetivo y controla las alertas.
3. Corrige datos faltantes (por ejemplo, carga de turnos olvidada) y refresca la vista.
4. Exporta el reporte y utilizalo como base para liquidaciones o comprobantes.

### C. Actualizacion de feriados y tarifas
1. Entra a Calendario y agrega o elimina feriados según el calendario oficial.
2. Ve a Tarifas y ajusta los montos si cambio alguna condición de pago o cobro.
3. Vuelve a Turnos para refrescar y asegurar que los nuevos valores se apliquen a futuros turnos.

---

## Exportaciones y reportes

- **Cobros:** genera un libro Excel con resumen ejecutivo (totales, cobro típico, fechas) y detalle de cada turno. Ideal para facturación.
- **Pagos:** crea un Excel con resumen mensual y hojas individuales por trabajador con sus turnos, montos y recargos (feriados o domingos).
- **Descargas adicionales:** muchos módulos tienen botones de Exportar o Descargar para respaldar configuraciones. Sigue las instrucciones en pantalla.

---

## Resolución de problemas comunes

| Situación | Qué hacer |
| --- | --- |
| No veo un turno recién cargado | Usa el botón Actualizar en Turnos o cambia de semana y vuelve. Si lo importaste por Excel, revisa Inconsistencias. |
| Un conductor no aparece en la lista al crear un turno | Ve a Trabajadores y verifica que esté en estado Activo. |
| Cobros o Pagos muestran montos en cero | Revisa en Turnos que los campos cobro y pago estén completos y que el turno tenga estado Completado. |
| El Excel exportado ordena mal los nombres | Verifica que en Trabajadores los nombres estén en mayúsculas y sin espacios extra; vuelve a exportar. |
| No puedo iniciar sesión | Confirma usuario y contraseña. Si agotaste los intentos, espera unos minutos. Contacta a soporte si olvidaste la clave. |
| Falta un feriado en el cálculo | Agrega la fecha en Calendario y vuelve a calcular en Cobros o Pagos. |

---

## Buenas prácticas

- Mantén tus datos maestros (Trabajadores, Vehículos, Rutas) al día. El resto del sistema depende de ellos.
- Dedica unos minutos cada semana a revisar Inconsistencias. Es más fácil corregir pequeños errores que rehacer todo un mes.
- Marca los turnos como completados al final del día. Evita dejarlo para después.
- Guarda respaldos periódicos desde Configuración y conserva los Excel exportados.
- Usa el Dashboard como control de calidad: si ves que los turnos programados no coinciden con los completados, investiga antes del cierre.

---

## Soporte y contacto

1. Revisa este manual y los mensajes dentro de la aplicación.
2. Consulta la consola del navegador (tecla F12) sólo si soporte lo solicita.
3. Verifica tu conexión a internet.
4. Si el problema persiste, contacta al administrador de TransApp o a tu equipo de TI indicando la pantalla, el paso que estabas realizando y, si es posible, una captura.

---

TransApp - Sistema de gestión integral para transporte y logística.
