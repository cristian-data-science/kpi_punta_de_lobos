const { tools } = require('../mcp/mcp-server-simple.cjs');

async function crearTrabajadores() {
  console.log('✅ CREANDO 14 TRABAJADORES');
  console.log('========================');
  
  const workers = [
    { nombre: 'JORGE ANDRÉS FLORES OSORIO', rut: '12650299-0' },
    { nombre: 'JOSÉ DANIEL AMPUERO AMPUERO', rut: '11945733-5' },
    { nombre: 'NELSON DEL CARMEN LAGOS REY', rut: '11764166-K' },
    { nombre: 'HUMBERTO ANTONIO SILVA CARREÑO', rut: '10230428-4' },
    { nombre: 'JORGE PABLO FUENTES ABARZUA', rut: '15872050-7' },
    { nombre: 'HUGO IVÁN DURÁN JIMÉNEZ', rut: '14246406-3' },
    { nombre: 'CARLOS JONATHAN RAMIREZ ESPINOZA', rut: '16757796-2' },
    { nombre: 'JUAN ANTONIO GONZALEZ JIMENEZ', rut: '12825622-9' },
    { nombre: 'WLADIMIR ROLANDO ISLER VALDÉS', rut: '11314229-4' },
    { nombre: 'FELIPE ANDRÉS VALLEJOS SANTIS', rut: '16107285-0' },
    { nombre: 'ERICK ISMAEL MIRANDA ABARCA', rut: '15087914-7' },
    { nombre: 'JONATHAN FRANCISCO CABELLO MORA', rut: '15872981-4' },
    { nombre: 'MANUEL EDGARDO HERRERA SORIANO', rut: '19757064-4' },
    { nombre: 'OSCAR ENRIQUE ORELLANA VASQUEZ', rut: '9591122-6' }
  ];
  
  let created = 0;
  
  for (const worker of workers) {
    const result = await tools.create_worker({
      nombre: worker.nombre,
      rut: worker.rut,
      contrato: 'fijo',
      telefono: '', // Campo en blanco
      estado: 'activo'
    });
    
    if (result.success) {
      created++;
      console.log(`✅ ${created}. ${worker.nombre} (${worker.rut})`);
    } else {
      console.log(`❌ Error: ${worker.nombre} - ${result.error}`);
    }
  }
  
  // Verificar resultado
  const final = await tools.query_workers({ limit: 20 });
  if (final.success) {
    console.log(`\n📊 Total trabajadores: ${final.data.length}`);
    console.log(`✅ Todos con contrato 'fijo': ${final.data.every(w => w.contrato === 'fijo')}`);
    console.log(`✅ Todos activos: ${final.data.every(w => w.estado === 'activo')}`);
  }
  
  console.log('\n🎉 PROCESO COMPLETADO');
}

crearTrabajadores().catch(console.error);
