// Script para ejecutar desde la consola del navegador en TransApp
// Este script corregirá la tarifa incorrecta de $100,000 a $20,000

console.log('🔧 Iniciando corrección de tarifa...');

// Usar el Supabase client que ya está disponible en la aplicación
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
);

async function fixRate() {
  try {
    // Verificar tarifa actual
    const { data: current, error: currentError } = await supabase
      .from('shift_rates')
      .select('rate_name, rate_value')
      .eq('rate_name', 'firstSecondShift')
      .single();

    if (currentError) {
      console.error('❌ Error verificando tarifa:', currentError);
      return;
    }

    console.log(`📊 Tarifa actual: ${current.rate_name} = $${current.rate_value.toLocaleString()}`);

    if (current.rate_value !== 20000) {
      console.log('🔄 Actualizando tarifa...');
      
      const { data, error } = await supabase
        .from('shift_rates')
        .update({ 
          rate_value: 20000,
          updated_at: new Date().toISOString()
        })
        .eq('rate_name', 'firstSecondShift');

      if (error) {
        console.error('❌ Error actualizando:', error);
        return;
      }

      console.log('✅ Tarifa corregida: firstSecondShift = $20,000');
    } else {
      console.log('✅ Tarifa ya está correcta');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixRate();
