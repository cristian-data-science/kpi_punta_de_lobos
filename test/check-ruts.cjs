const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
);

async function checkRuts() {
  const { data, error } = await supabase
    .from('trabajadores')
    .select('id, nombre, rut')
    .order('created_at');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('📋 RUTs actuales en BD:');
  data.forEach((worker, index) => {
    const hasHyphen = worker.rut.includes('-');
    const emoji = hasHyphen ? '✅' : '❌';
    console.log(`${index + 1}. ${emoji} ${worker.nombre}: "${worker.rut}" ${hasHyphen ? '(con guión)' : '(SIN guión)'}`);
  });
  
  const withoutHyphen = data.filter(w => !w.rut.includes('-'));
  console.log(`\n📊 Resumen:`);
  console.log(`   Total trabajadores: ${data.length}`);
  console.log(`   Con guión: ${data.length - withoutHyphen.length}`);
  console.log(`   Sin guión: ${withoutHyphen.length}`);
}

checkRuts();
