/**
 * 🔧 REPARACIÓN: Recalcular pagos faltantes en turnos c    // 2. Buscar turnos completados con pago = NULL
    cons    // 4. Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    const { data: verificacion, error: verifyError } = await supabase
      .from('turnos')
      .select('id', { count: 'exact' })
      .eq('estado', 'completado')
      .is('pago', null);  // 🔧 CAMBIAR: Verificar NULL
      
    if (verifyError) throw verifyError;
    
    const turnosQuedanSinPago = verificacion?.length || 0;
    
    if (turnosQuedanSinPago === 0) {
      console.log('🎉 ¡REPARACIÓN COMPLETADA! Ya no quedan turnos completados sin pago');
      console.log('💡 Ahora la sección Pagos debería mostrar todos los totales correctamente');
    } else {
      console.log(`⚠️ Aún quedan ${turnosQuedanSinPago} turnos completados sin pago`);
    }ando turnos completados con pago = NULL...');
    const { data: turnosSinPago, error } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo, pago')
      .eq('estado', 'completado')
      .is('pago', null);  // 🔧 CAMBIAR: Buscar NULL en lugar de 0dos
 * 
 * Los turnos del 1-7 septiembre 2025 están marcados como completados
 * pero tienen pago = 0. Este script recalcula los pagos usando las 
 * mismas reglas que el sistema de turnos.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM1NDkzMywiZXhwIjoyMDcyOTMwOTMzfQ.sKq7WvocXEyL9l5BcRsZOfJFnf9ZaRlOYL0acfUg5II'
);

// Función para calcular tarifa de un turno
function calculateShiftRate(fecha, turnoTipo, holidays = []) {
  const [year, month, day] = fecha.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
  
  const isHoliday = holidays.includes(fecha);
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  
  // Reglas de tarifas
  if (isSunday) {
    return 35000; // Domingo siempre $35,000
  }
  
  if (isHoliday && !isSunday) {
    return 27500; // Feriado (no domingo) $27,500
  }
  
  if (isSaturday && turnoTipo === 'tercer_turno') {
    return 27500; // Sábado 3er turno $27,500
  }
  
  if (turnoTipo === 'tercer_turno') {
    return 22500; // Tercer turno entre semana $22,500
  }
  
  return 20000; // Primer y segundo turno entre semana $20,000
}

(async () => {
  try {
    console.log('🔧 REPARACIÓN: Recalcular pagos faltantes');
    console.log('='.repeat(60));
    
    // 1. Cargar feriados
    console.log('📅 Cargando configuración de feriados...');
    const { data: holidayData, error: holidayError } = await supabase
      .from('holidays')
      .select('holiday_date');
      
    if (holidayError) throw holidayError;
    
    const holidays = holidayData.map(h => h.holiday_date);
    console.log(`✅ ${holidays.length} feriados cargados`);
    
    // 2. Buscar turnos completados con pago = 0
    console.log('\\n🔍 Buscando turnos completados con pago = 0...');
    const { data: turnosSinPago, error } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo, pago')
      .eq('estado', 'completado')
      .eq('pago', 0);
      
    if (error) throw error;
    
    console.log(`📊 Encontrados ${turnosSinPago.length} turnos con pago = NULL`);
    
    if (turnosSinPago.length === 0) {
      console.log('✅ No hay turnos que requieran reparación');
      return;
    }
    
    // 3. Calcular y actualizar pagos
    console.log('\\n💰 Recalculando pagos...');
    let reparados = 0;
    let totalReparado = 0;
    
    for (const turno of turnosSinPago) {
      const pagoCalculado = calculateShiftRate(turno.fecha, turno.turno_tipo, holidays);
      const cobroCalculado = Math.round(pagoCalculado * 7.25); // Usando el factor de cobro estándar
      
      // Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('turnos')
        .update({ 
          pago: pagoCalculado,
          cobro: cobroCalculado 
        })
        .eq('id', turno.id);
        
      if (updateError) {
        console.error(`❌ Error actualizando turno ${turno.id}:`, updateError.message);
        continue;
      }
      
      reparados++;
      totalReparado += pagoCalculado;
      
      if (reparados <= 5) {
        console.log(`  ✅ ${turno.fecha} ${turno.turno_tipo}: $${pagoCalculado.toLocaleString()} (cobro: $${cobroCalculado.toLocaleString()})`);
      } else if (reparados === 6) {
        console.log('  ... (continuando en silencio)');
      }
    }
    
    console.log('\\n📊 RESUMEN DE REPARACIÓN:');
    console.log(`✅ Turnos reparados: ${reparados}`);
    console.log(`💰 Total pagos agregados: $${totalReparado.toLocaleString()}`);
    console.log(`📈 Promedio por turno: $${Math.round(totalReparado / reparados).toLocaleString()}`);
    
    // 4. Verificar resultado
    console.log('\\n🔍 Verificando resultado...');
    const { data: verificacion, error: verifyError } = await supabase
      .from('turnos')
      .select('id, COUNT(*) as total')
      .eq('estado', 'completado')
      .eq('pago', 0);
      
    if (verifyError) throw verifyError;
    
    const turnosQuedanSinPago = verificacion?.[0]?.total || 0;
    
    if (turnosQuedanSinPago === 0) {
      console.log('🎉 ¡REPARACIÓN COMPLETADA! Ya no quedan turnos completados sin pago');
      console.log('💡 Ahora la sección Pagos debería mostrar todos los totales correctamente');
    } else {
      console.log(`⚠️ Aún quedan ${turnosQuedanSinPago} turnos completados sin pago`);
    }
    
    console.log('\\n🎯 PRÓXIMO PASO:');
    console.log('Refresca la página de Pagos para ver los totales actualizados');
    
  } catch (error) {
    console.error('❌ Error en reparación:', error.message);
  }
})();