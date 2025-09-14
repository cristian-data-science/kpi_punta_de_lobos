/**
 * 🔍 Debug: Sistema de Pagos - Identificar por qué aparece $0
 * 
 * Prueba completa del flujo de cálculo de pagos para identificar
 * dónde se pierde el valor monetario.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM1NDkzMywiZXhwIjoyMDcyOTMwOTMzfQ.sKq7WvocXEyL9l5BcRsZOfJFnf9ZaRlOYL0acfUg5II'
);

(async () => {
  try {
    console.log('🔍 DEBUG COMPLETO: Sistema de Pagos - Septiembre 2025');
    console.log('='.repeat(70));
    
    console.log('\n📊 PASO 1: Verificar datos raw de Supabase');
    console.log('-'.repeat(50));
    
    const { data: turnosRaw, error } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          id,
          nombre,
          rut
        )
      `)
      .eq('estado', 'completado')
      .gte('fecha', '2025-09-01')
      .lte('fecha', '2025-09-30')
      .limit(3);
      
    if (error) throw error;
    
    console.log('Raw data muestra (3 turnos):');
    turnosRaw.forEach((turno, i) => {
      console.log(`  ${i+1}. Fecha: ${turno.fecha}`);
      console.log(`     Trabajador: ${turno.trabajador?.nombre || 'NULL'}`);
      console.log(`     Pago: $${(turno.pago || 0).toLocaleString()}`);
      console.log(`     Estado: ${turno.estado}`);
      console.log('');
    });
    
    console.log('\n🔧 PASO 2: Simular transformación del servicio');
    console.log('-'.repeat(50));
    
    const turnosTransformados = turnosRaw.map(turno => ({
      id: turno.id,
      fecha: turno.fecha,
      conductorNombre: turno.trabajador?.nombre || 'Trabajador no encontrado',
      turno: mapTurnoType(turno.turno_tipo),
      estado: turno.estado,
      pago: turno.pago || 0
    }));
    
    function mapTurnoType(turnoTipo) {
      const map = {
        'primer_turno': 'PRIMER TURNO',
        'segundo_turno': 'SEGUNDO TURNO', 
        'tercer_turno': 'TERCER TURNO'
      };
      return map[turnoTipo] || turnoTipo;
    }
    
    console.log('Turnos transformados:');
    turnosTransformados.forEach((turno, i) => {
      console.log(`  ${i+1}. ${turno.conductorNombre.substring(0, 25)}`);
      console.log(`     Fecha: ${turno.fecha}`);
      console.log(`     Pago: $${turno.pago.toLocaleString()}`);
      console.log(`     Turno: ${turno.turno}`);
      console.log('');
    });
    
    console.log('\n💰 PASO 3: Simular agrupación por trabajador');
    console.log('-'.repeat(50));
    
    const paymentCalculations = new Map();
    
    for (const turno of turnosTransformados) {
      const conductorNombre = turno.conductorNombre;
      const pago = turno.pago || 0;
      
      if (!paymentCalculations.has(conductorNombre)) {
        paymentCalculations.set(conductorNombre, {
          conductorNombre,
          totalTurnos: 0,
          totalMonto: 0,
          turnos: []
        });
      }
      
      const calculation = paymentCalculations.get(conductorNombre);
      calculation.totalTurnos++;
      calculation.totalMonto += pago;
      
      // Simular estructura de turnos individuales
      calculation.turnos.push({
        fecha: turno.fecha,
        turno: turno.turno,
        tarifa: pago  // ← ESTE ES EL CAMPO QUE LEE LA INTERFAZ
      });
    }
    
    const workers = Array.from(paymentCalculations.values());
    
    console.log('Resultado agrupado por trabajador:');
    workers.forEach((worker, i) => {
      console.log(`  ${i+1}. ${worker.conductorNombre.substring(0, 25)}`);
      console.log(`     Total turnos: ${worker.totalTurnos}`);
      console.log(`     Total monto: $${worker.totalMonto.toLocaleString()}`);
      console.log(`     Primer turno tarifa: $${worker.turnos[0]?.tarifa || 0}`);
      console.log('');
    });
    
    console.log('\n🎯 PASO 4: Simular filtro mensual de la interfaz');
    console.log('-'.repeat(50));
    
    const month = '2025-09';
    const [year, monthNum] = month.split('-');
    
    const filtered = workers.map(worker => {
      const turnosDelMes = worker.turnos.filter(turno => {
        const [year, month, day] = turno.fecha.split('-');
        const turnoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return turnoDate.getFullYear() === parseInt(year) && 
               (turnoDate.getMonth() + 1) === parseInt(monthNum);
      });
      
      if (turnosDelMes.length === 0) return null;
      
      // ← AQUÍ ESTÁ EL PROBLEMA POTENCIAL
      const totalMonto = turnosDelMes.reduce((sum, turno) => sum + (turno.tarifa || 0), 0);
      
      return {
        ...worker,
        totalMonto,
        totalTurnos: turnosDelMes.length,
        turnos: turnosDelMes
      };
    }).filter(Boolean);
    
    console.log('Resultado después del filtro mensual:');
    filtered.forEach((worker, i) => {
      console.log(`  ${i+1}. ${worker.conductorNombre.substring(0, 25)}`);
      console.log(`     Turnos filtrados: ${worker.totalTurnos}`);
      console.log(`     Total filtrado: $${worker.totalMonto.toLocaleString()}`);
      console.log('');
    });
    
    const totalFinal = filtered.reduce((sum, worker) => sum + worker.totalMonto, 0);
    
    console.log('\n🏁 RESULTADO FINAL:');
    console.log('='.repeat(50));
    console.log(`💰 TOTAL A MOSTRAR EN INTERFAZ: $${totalFinal.toLocaleString()}`);
    console.log(`👥 TRABAJADORES CON DATOS: ${filtered.length}`);
    
    if (totalFinal === 0) {
      console.log('\n❌ PROBLEMA CONFIRMADO: Total = $0');
      console.log('🔍 Revisar si turno.tarifa está llegando correctamente');
    } else {
      console.log('\n✅ CÁLCULO CORRECTO: Debería mostrar este total');
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error.message);
  }
})();