/**
 * ✅ TEST FINAL: Verificar que los filtros del dashboard funcionen correctamente
 * después de la corrección de la lógica temporal
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (USAR CREDENCIALES CORRECTAS)
const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'; // CLAVE ACTUALIZADA
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFiltrosDashboard() {
    console.log('🔄 INICIANDO TEST FINAL: Filtros del Dashboard Corregidos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // 1. Obtener información de los datos disponibles
        console.log('\n📊 1. ANÁLISIS DE DATOS DISPONIBLES');
        const { data: todosLosTurnos, error: errorTodos } = await supabase
            .from('turnos')
            .select('fecha, pago, cobro')
            .eq('estado', 'completado')
            .order('fecha', { ascending: true });
        
        if (errorTodos) {
            console.error('❌ Error al obtener turnos:', errorTodos);
            return;
        }
        
        const fechaMin = todosLosTurnos[0]?.fecha;
        const fechaMax = todosLosTurnos[todosLosTurnos.length - 1]?.fecha;
        
        console.log(`📅 Rango de datos: ${fechaMin} → ${fechaMax}`);
        console.log(`📊 Total de registros: ${todosLosTurnos.length}`);
        
        // 2. Test FILTRO FINANCIERO con lógica corregida (últimos 30 días de datos)
        console.log('\n💰 2. TEST FILTRO FINANCIERO (Últimos 30 días de datos)');
        
        // Obtener fecha más reciente
        const fechaReciente = new Date(fechaMax);
        fechaReciente.setDate(fechaReciente.getDate() - 30);
        const filtroFinanciero = fechaReciente.toISOString().split('T')[0];
        
        console.log(`🔍 Filtro aplicado: fecha >= ${filtroFinanciero}`);
        
        const { data: datosFinancieros, error: errorFinanciero } = await supabase
            .from('turnos')
            .select('pago, cobro')
            .gte('fecha', filtroFinanciero)
            .eq('estado', 'completado');
        
        if (errorFinanciero) {
            console.error('❌ Error filtro financiero:', errorFinanciero);
        } else {
            const totalIngresos = datosFinancieros.reduce((sum, t) => sum + (t.cobro || 0), 0);
            const totalCostos = datosFinancieros.reduce((sum, t) => sum + (t.pago || 0), 0);
            
            console.log(`📈 Registros filtrados: ${datosFinancieros.length}`);
            console.log(`💰 Total Ingresos: ${totalIngresos.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}`);
            console.log(`💸 Total Costos: ${totalCostos.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}`);
        }
        
        // 3. Test FILTRO TENDENCIAS con lógica corregida (últimos 7 días de datos)
        console.log('\n📈 3. TEST FILTRO TENDENCIAS (Últimos 7 días de datos)');
        
        const fechaRecienteTendencias = new Date(fechaMax);
        fechaRecienteTendencias.setDate(fechaRecienteTendencias.getDate() - 7);
        const filtroTendencias = fechaRecienteTendencias.toISOString().split('T')[0];
        
        console.log(`🔍 Filtro aplicado: fecha >= ${filtroTendencias}`);
        
        const { data: datosTendencias, error: errorTendencias } = await supabase
            .from('turnos')
            .select('fecha, pago, cobro')
            .gte('fecha', filtroTendencias)
            .eq('estado', 'completado')
            .order('fecha', { ascending: true });
        
        if (errorTendencias) {
            console.error('❌ Error filtro tendencias:', errorTendencias);
        } else {
            console.log(`📊 Registros filtrados: ${datosTendencias.length}`);
            
            // Agrupar por fecha para mostrar tendencia
            const porFecha = {};
            datosTendencias.forEach(turno => {
                const fecha = turno.fecha;
                if (!porFecha[fecha]) {
                    porFecha[fecha] = { ingresos: 0, costos: 0, turnos: 0 };
                }
                porFecha[fecha].ingresos += (turno.cobro || 0);
                porFecha[fecha].costos += (turno.pago || 0);
                porFecha[fecha].turnos += 1;
            });
            
            console.log('📅 Distribución por fecha:');
            Object.entries(porFecha).forEach(([fecha, datos]) => {
                console.log(`  ${fecha}: ${datos.turnos} turnos, Ingresos: ${datos.ingresos.toLocaleString('es-CL')} CLP`);
            });
        }
        
        // 4. Test FILTRO TOP TRABAJADORES con lógica corregida (mes)
        console.log('\n👥 4. TEST FILTRO TOP TRABAJADORES (Último mes de datos)');
        
        const fechaRecienteTrabajadores = new Date(fechaMax);
        fechaRecienteTrabajadores.setDate(fechaRecienteTrabajadores.getDate() - 30);
        const filtroTrabajadores = fechaRecienteTrabajadores.toISOString().split('T')[0];
        
        console.log(`🔍 Filtro aplicado: fecha >= ${filtroTrabajadores}`);
        
        const { data: datosTrabajadores, error: errorTrabajadores } = await supabase
            .from('turnos')
            .select(`
                trabajador_id,
                pago,
                fecha,
                trabajador:trabajador_id (
                    nombre
                )
            `)
            .gte('fecha', filtroTrabajadores)
            .eq('estado', 'completado');
        
        if (errorTrabajadores) {
            console.error('❌ Error filtro trabajadores:', errorTrabajadores);
        } else {
            console.log(`👤 Registros filtrados: ${datosTrabajadores.length}`);
            
            // Agrupar por trabajador
            const porTrabajador = {};
            datosTrabajadores.forEach(turno => {
                const trabajadorId = turno.trabajador_id;
                const nombre = turno.trabajador?.nombre || 'Sin nombre';
                
                if (!porTrabajador[trabajadorId]) {
                    porTrabajador[trabajadorId] = { nombre, turnos: 0, pago: 0 };
                }
                porTrabajador[trabajadorId].turnos += 1;
                porTrabajador[trabajadorId].pago += (turno.pago || 0);
            });
            
            const topTrabajadores = Object.values(porTrabajador)
                .sort((a, b) => b.turnos - a.turnos)
                .slice(0, 5);
            
            console.log('🏆 Top 5 Trabajadores:');
            topTrabajadores.forEach((trabajador, index) => {
                console.log(`  ${index + 1}. ${trabajador.nombre}: ${trabajador.turnos} turnos, ${trabajador.pago.toLocaleString('es-CL')} CLP`);
            });
        }
        
        // 5. COMPARACIÓN DE FILTROS (verificar que den resultados diferentes)
        console.log('\n🔍 5. COMPARACIÓN DE FILTROS (Diferentes períodos)');
        
        // Filtro últimos 15 días vs últimos 60 días
        const fecha15dias = new Date(fechaMax);
        fecha15dias.setDate(fecha15dias.getDate() - 15);
        const filtro15dias = fecha15dias.toISOString().split('T')[0];
        
        const fecha60dias = new Date(fechaMax);
        fecha60dias.setDate(fecha60dias.getDate() - 60);
        const filtro60dias = fecha60dias.toISOString().split('T')[0];
        
        const [datos15dias, datos60dias] = await Promise.all([
            supabase.from('turnos').select('pago, cobro').gte('fecha', filtro15dias).eq('estado', 'completado'),
            supabase.from('turnos').select('pago, cobro').gte('fecha', filtro60dias).eq('estado', 'completado')
        ]);
        
        if (datos15dias.data && datos60dias.data) {
            const ingresos15 = datos15dias.data.reduce((sum, t) => sum + (t.cobro || 0), 0);
            const ingresos60 = datos60dias.data.reduce((sum, t) => sum + (t.cobro || 0), 0);
            
            console.log(`📊 Últimos 15 días: ${datos15dias.data.length} registros, ${ingresos15.toLocaleString('es-CL')} CLP`);
            console.log(`📊 Últimos 60 días: ${datos60dias.data.length} registros, ${ingresos60.toLocaleString('es-CL')} CLP`);
            
            if (datos15dias.data.length !== datos60dias.data.length) {
                console.log('✅ ÉXITO: Los filtros devuelven resultados DIFERENTES');
            } else {
                console.log('⚠️  ADVERTENCIA: Los filtros aún devuelven la misma cantidad de registros');
            }
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ TEST COMPLETADO: Verificar resultados en el dashboard');
        console.log('📱 URL: http://localhost:5173/ (asegúrate de que el servidor esté corriendo)');
        
    } catch (error) {
        console.error('❌ Error en el test:', error);
    }
}

// Ejecutar el test
testFiltrosDashboard();
