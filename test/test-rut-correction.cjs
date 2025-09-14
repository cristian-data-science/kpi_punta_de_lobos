const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
);

// Probar creación con RUT SIN GUIÓN para verificar corrección automática
async function testRutWithoutHyphen() {
  console.log('🧪 Probando corrección automática de RUT sin guión...');
  
  // Simular datos como los procesaría el sistema ACTUAL mejorado
  const formData = {
    nombre: 'Test Sin Guion',
    rut: '181613794', // ⚠️ SIN GUIÓN (simulando el problema reportado)
    telefono: '+56912345678',
    contrato: 'fijo',
    estado: 'activo'
  };
  
  console.log('📝 Datos originales (RUT SIN guión):', formData);
  
  // Función de corrección automática (como la implementada en Workers.jsx)
  const ensureRutWithHyphen = (rut) => {
    if (!rut) return rut
    
    // Si ya tiene guión, devolverlo tal como está
    if (rut.includes('-')) return rut
    
    // Si no tiene guión y tiene la longitud correcta (8-9 dígitos)
    if (rut.length >= 8 && rut.length <= 9) {
      // Separar los últimos dígitos (dígito verificador)
      const rutNumber = rut.slice(0, -1)
      const verifierDigit = rut.slice(-1)
      
      // Agregar el guión
      return `${rutNumber}-${verifierDigit}`
    }
    
    // Si no se puede formatear, devolver original
    return rut
  }
  
  // Procesar como lo haría el sistema mejorado
  const formattedRut = ensureRutWithHyphen(formData.rut)
  console.log('🔧 RUT corregido automáticamente:', formData.rut, '→', formattedRut)
  
  const workerDataForDB = {
    ...formData,
    nombre: formData.nombre.toUpperCase(),
    rut: formattedRut // RUT con guión garantizado
  };
  
  console.log('💾 Datos finales para BD:', workerDataForDB);
  
  // Crear el trabajador en Supabase
  try {
    const { data, error } = await supabase
      .from('trabajadores')
      .insert([workerDataForDB])
      .select();
    
    if (error) {
      console.error('❌ Error creando trabajador:', error);
      return;
    }
    
    console.log('✅ Trabajador creado exitosamente:', data[0]);
    console.log(`📋 RUT final guardado en BD: "${data[0].rut}" ${data[0].rut.includes('-') ? '✅ (CON guión)' : '❌ (SIN guión)'}`);
    
    // Eliminar el trabajador de prueba
    await supabase
      .from('trabajadores')
      .delete()
      .eq('id', data[0].id);
      
    console.log('🗑️ Trabajador de prueba eliminado');
    
    // Verificación final
    if (data[0].rut.includes('-')) {
      console.log('🎉 ¡ÉXITO! El RUT se guardó correctamente con guión');
    } else {
      console.log('⚠️ PROBLEMA: El RUT se guardó sin guión');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testRutWithoutHyphen();
