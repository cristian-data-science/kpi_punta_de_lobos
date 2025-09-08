const { tools } = require('../mcp/mcp-server-simple.cjs');

async function testMetadataFunctionality() {
  console.log('🧪 PRUEBA DE FUNCIONALIDAD DE METADATOS');
  console.log('=====================================');
  
  try {
    // 1. Verificar trabajador existente
    console.log('\n👥 1. VERIFICANDO TRABAJADORES...');
    const workers = await tools.query_workers({ limit: 1 });
    
    if (workers.success && workers.data.length > 0) {
      const worker = workers.data[0];
      console.log(`✅ Trabajador: ${worker.nombre}`);
      console.log(`📅 created_at: ${worker.created_at}`);
      console.log(`🔄 updated_at: ${worker.updated_at}`);
      
      // Actualizar trabajador para probar updated_at
      console.log('\n🔄 Probando actualización de trabajador...');
      const updateResult = await tools.update_worker({
        id: worker.id,
        telefono: worker.telefono || '+56912345678' // Cambio mínimo
      });
      
      if (updateResult.success) {
        console.log('✅ Trabajador actualizado');
        console.log(`🆕 Nuevo updated_at: ${updateResult.data.updated_at}`);
        
        // Verificar que updated_at cambió
        if (updateResult.data.updated_at !== worker.updated_at) {
          console.log('✅ updated_at se actualizó automáticamente');
        } else {
          console.log('⚠️ updated_at no cambió');
        }
      }
    }
    
    // 2. Crear y probar turno
    console.log('\n📅 2. PROBANDO TURNOS...');
    
    if (workers.success && workers.data.length > 0) {
      const workerId = workers.data[0].id;
      
      // Crear turno de prueba
      const createShift = await tools.create_shift({
        trabajador_id: workerId,
        fecha: '2025-09-08',
        turno_tipo: 'segundo_turno',
        estado: 'programado'
      });
      
      if (createShift.success) {
        const shift = createShift.data;
        console.log('✅ Turno creado');
        console.log(`📅 created_at: ${shift.created_at}`);
        console.log(`🔄 updated_at: ${shift.updated_at || '❌ NO EXISTE'}`);
        
        // Verificar si updated_at existe
        if (shift.updated_at) {
          console.log('✅ updated_at existe en turnos');
        } else {
          console.log('❌ updated_at NO existe en turnos - EJECUTAR SQL');
        }
        
        console.log('\n🧹 Limpiando turno de prueba...');
        // No podemos eliminar con el MCP actual, pero eso está bien
        console.log('ℹ️ Turno quedará como registro de prueba');
      }
    }
    
    // 3. Verificar estructura completa
    console.log('\n🔍 3. VERIFICACIÓN DE ESTRUCTURA...');
    
    // Consultar algunos turnos para ver estructura
    const shifts = await tools.query_shifts({ limit: 2 });
    if (shifts.success && shifts.data.length > 0) {
      const shiftColumns = Object.keys(shifts.data[0]);
      console.log('📋 Columnas de turnos:', shiftColumns.join(', '));
      
      const hasCreatedAt = shiftColumns.includes('created_at');
      const hasUpdatedAt = shiftColumns.includes('updated_at');
      
      console.log(`✅ created_at: ${hasCreatedAt ? 'EXISTE' : '❌ FALTA'}`);
      console.log(`✅ updated_at: ${hasUpdatedAt ? 'EXISTE' : '❌ FALTA'}`);
      
      if (hasCreatedAt && hasUpdatedAt) {
        console.log('\n🎉 ¡METADATOS COMPLETOS EN AMBAS TABLAS!');
      } else {
        console.log('\n⚠️ Falta ejecutar el script SQL complete_metadata_setup.sql');
      }
    }
    
  } catch (error) {
    console.error('💥 Error en prueba:', error.message);
  }
}

// Ejecutar prueba
if (require.main === module) {
  testMetadataFunctionality()
    .then(() => {
      console.log('\n✅ Prueba de metadatos completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error crítico:', error.message);
      process.exit(1);
    });
}

module.exports = { testMetadataFunctionality };
