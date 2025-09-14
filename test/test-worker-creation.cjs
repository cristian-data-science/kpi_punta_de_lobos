const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
);

// Simular creación de un trabajador como lo haría AddWorkerModal + Workers.jsx
async function testWorkerCreation() {
  console.log('🧪 Simulando creación de trabajador manual...');
  
  // Simular datos del formulario como llegan del AddWorkerModal
  const formData = {
    nombre: 'Prueba Test',
    rut: '12345678-9', // Con guión como lo ingresa el usuario (RUT de prueba)
    telefono: '+56912345678',
    contrato: 'fijo',
    estado: 'activo'
  };
  
  console.log('📝 Datos originales del formulario:', formData);
  
  // Simular el procesamiento en AddWorkerModal.jsx
  // Importar función normalizeRut (simular importación)
  const normalizeRut = (rut) => {
    const cleanRut = rut.replace(/[.\-\s]/g, '').toUpperCase();
    
    if (cleanRut.length < 8 || cleanRut.length > 10) return '';
    
    // Separar número y dígito verificador
    const rutNumber = cleanRut.slice(0, -1);
    const verifierDigit = cleanRut.slice(-1);
    
    // Devolver con guión (formato estándar para BD)
    return `${rutNumber}-${verifierDigit}`;
  };
  
  const workerData = {
    ...formData,
    rut: normalizeRut(formData.rut), // Procesar con normalizeRut
    nombre: formData.nombre.trim().toUpperCase(),
    telefono: formData.telefono.trim()
  };
  
  console.log('🔄 Datos procesados por AddWorkerModal:', workerData);
  
  // Simular el procesamiento en Workers.jsx createWorker
  const workerDataForDB = {
    ...workerData,
    nombre: workerData.nombre.toUpperCase() // Conversión adicional
  };
  
  console.log('💾 Datos finales para BD (Workers.jsx):', workerDataForDB);
  
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
    console.log('📋 RUT guardado en BD:', data[0].rut);
    
    // Eliminar el trabajador de prueba
    await supabase
      .from('trabajadores')
      .delete()
      .eq('id', data[0].id);
      
    console.log('🗑️ Trabajador de prueba eliminado');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testWorkerCreation();
