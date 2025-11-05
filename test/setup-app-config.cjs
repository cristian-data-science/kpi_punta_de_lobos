#!/usr/bin/env node

/**
 * Script para inicializar la tabla app_config en Supabase
 * Este script crea la tabla y las configuraciones iniciales necesarias
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ ERROR: Variables de entorno faltantes')
  console.error('Requerido: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function setupAppConfig() {
  try {
    console.log('🚀 Iniciando configuración de app_config...\n')

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../sql/crear_tabla_app_config.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Ejecutando script SQL...')

    // Dividir por punto y coma y ejecutar cada statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.toLowerCase().includes('select')) continue // Skip SELECT statements
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error && !error.message.includes('already exists')) {
        console.warn('⚠️ Warning:', error.message)
      }
    }

    console.log('✅ Tabla app_config creada\n')

    // Verificar que los datos se insertaron
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .in('config_key', ['admin_password', 'admin_username'])

    if (error) {
      console.error('❌ Error al verificar datos:', error.message)
      process.exit(1)
    }

    console.log('📊 Configuraciones actuales:')
    console.log('─'.repeat(50))
    data.forEach(config => {
      console.log(`${config.config_key}: ${config.config_value}`)
      console.log(`Descripción: ${config.description}`)
      console.log(`Actualizado: ${new Date(config.updated_at).toLocaleString('es-CL')}`)
      console.log('─'.repeat(50))
    })

    console.log('\n✅ Setup completado exitosamente')
    console.log('\n💡 Próximos pasos:')
    console.log('1. El módulo de Configuración ya puede cambiar la contraseña')
    console.log('2. AuthContext usará la contraseña de Supabase')
    console.log('3. Los cambios NO requieren redeployment\n')

  } catch (error) {
    console.error('❌ Error fatal:', error.message)
    process.exit(1)
  }
}

setupAppConfig()
