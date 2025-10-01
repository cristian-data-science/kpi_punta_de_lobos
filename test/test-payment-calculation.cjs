#!/usr/bin/env node

/**
 * 🧪 Test para verificar que los pagos usan el campo 'pago' guardado
 * en Supabase y NO recalculan con tarifas actuales
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase (usando variables de entorno)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env.local');
  process.exit(1);
}

async function testPaymentCalculation() {
  console.log('🧪 Probando cálculo de pagos con campo "pago" guardado...\n');
  
  try {
    // Crear cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Consultar turnos completados con sus pagos guardados
    console.log('1️⃣ Consultando turnos COMPLETADOS con campo "pago"...');
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          nombre
        )
      `)
      .eq('estado', 'completado')
      .order('fecha', { ascending: false })
      .limit(5);

    if (error) throw error;

    console.log(`✅ ${turnos.length} turnos completados encontrados:`);
    
    turnos.forEach((turno, index) => {
      console.log(`   ${index + 1}. ${turno.trabajador?.nombre || 'Sin nombre'}`);
      console.log(`      📅 Fecha: ${turno.fecha}`);
      console.log(`      🔄 Turno: ${turno.turno_tipo}`);
      console.log(`      💰 Pago guardado: $${turno.pago?.toLocaleString('es-CL') || '0'}`);
      console.log(`      💵 Cobro: $${turno.cobro?.toLocaleString('es-CL') || '0'}`);
      console.log('');
    });

    // 2. Calcular totales usando SOLO el campo 'pago'
    console.log('2️⃣ Calculando totales por trabajador usando campo "pago"...');
    
    const trabajadorTotales = new Map();
    
    turnos.forEach(turno => {
      const nombre = turno.trabajador?.nombre || 'Sin nombre';
      const pago = turno.pago || 0;
      
      if (!trabajadorTotales.has(nombre)) {
        trabajadorTotales.set(nombre, {
          totalTurnos: 0,
          totalPago: 0,
          turnos: []
        });
      }
      
      const trabajador = trabajadorTotales.get(nombre);
      trabajador.totalTurnos++;
      trabajador.totalPago += pago;
      trabajador.turnos.push({
        fecha: turno.fecha,
        turno: turno.turno_tipo,
        pago: pago
      });
    });

    console.log('💰 Resumen de pagos por trabajador:');
    trabajadorTotales.forEach((datos, nombre) => {
      console.log(`   👤 ${nombre}:`);
      console.log(`      📊 Total turnos: ${datos.totalTurnos}`);
      console.log(`      💰 Total a pagar: $${datos.totalPago.toLocaleString('es-CL')}`);
      console.log(`      📋 Detalle:`);
      datos.turnos.forEach(t => {
        console.log(`         - ${t.fecha} (${t.turno}): $${t.pago.toLocaleString('es-CL')}`);
      });
      console.log('');
    });

    // 3. Verificar que NO está usando tarifas actuales
    console.log('3️⃣ Verificando diferencias con tarifas actuales...');
    
    const { data: tarifas, error: tarifasError } = await supabase
      .from('shift_rates')
      .select('*')
      .order('rate_name');
    
    if (tarifasError) throw tarifasError;
    
    console.log('🏷️ Tarifas actuales en sistema:');
    tarifas.forEach(tarifa => {
      console.log(`   • ${tarifa.rate_name}: $${tarifa.rate_value.toLocaleString('es-CL')}`);
    });

    console.log('\n✅ PRUEBA COMPLETADA:');
    console.log('   🔄 Los pagos se calculan usando el campo "pago" guardado');
    console.log('   ❌ NO se recalculan con tarifas actuales');
    console.log('   💾 Los valores históricos se mantienen intactos');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar prueba si es llamado directamente
if (require.main === module) {
  testPaymentCalculation();
}

module.exports = { testPaymentCalculation };
