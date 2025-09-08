/**
 * 🔄 Servicio de integración entre MasterDataService y Supabase
 * 
 * Este servicio actúa como puente entre el sistema actual (localStorage) 
 * y la nueva base de datos Supabase, manteniendo compatibilidad total.
 */

import supabaseService from './supabaseService.js'
import persistentStorage from './persistentStorage.js'

class SupabaseIntegrationService {
  constructor() {
    this.syncEnabled = true
    this.fallbackToLocal = true
    this.observers = []
    
    console.log('🔄 SupabaseIntegrationService iniciado')
  }

  /**
   * Verificar si Supabase está disponible
   */
  isSupabaseAvailable() {
    const status = supabaseService.getConnectionStatus()
    return status.isConnected && status.status === 'connected'
  }

  /**
   * TRABAJADORES - Sincronización bidireccional
   */
  async getWorkers() {
    try {
      if (this.isSupabaseAvailable()) {
        console.log('📊 Obteniendo trabajadores desde Supabase...')
        
        const { data, error } = await supabaseService.select('trabajadores', {
          orderBy: { column: 'created_at', ascending: false }
        })

        if (error) throw error

        // Convertir formato Supabase a formato aplicación
        const workers = data.map(worker => this.mapSupabaseToAppWorker(worker))
        
        // Guardar en localStorage como backup
        persistentStorage.store('workers', workers)
        
        return workers
      } else {
        console.log('💾 Obteniendo trabajadores desde localStorage (fallback)')
        return persistentStorage.retrieve('workers') || []
      }
    } catch (error) {
      console.error('❌ Error obteniendo trabajadores:', error)
      
      if (this.fallbackToLocal) {
        console.log('🔄 Usando localStorage como fallback')
        return persistentStorage.retrieve('workers') || []
      }
      
      throw error
    }
  }

  async saveWorker(worker) {
    try {
      if (this.isSupabaseAvailable()) {
        console.log('💾 Guardando trabajador en Supabase:', worker.name || worker.nombre)

        // Convertir formato aplicación a formato Supabase
        const supabaseWorker = this.mapAppToSupabaseWorker(worker)
        
        let result
        if (worker.id && worker.id !== 'temp') {
          // Actualizar existente
          result = await supabaseService.update('trabajadores', worker.id, supabaseWorker)
        } else {
          // Crear nuevo
          result = await supabaseService.insert('trabajadores', supabaseWorker)
        }

        if (result.error) throw result.error

        // Convertir de vuelta para retornar
        const savedWorker = this.mapSupabaseToAppWorker(result.data[0])
        
        // Actualizar localStorage
        this.updateWorkerInLocalStorage(savedWorker)
        
        return savedWorker
      } else {
        console.log('💾 Guardando trabajador en localStorage (fallback)')
        return this.saveWorkerToLocalStorage(worker)
      }
    } catch (error) {
      console.error('❌ Error guardando trabajador:', error)
      
      if (this.fallbackToLocal) {
        console.log('🔄 Guardando en localStorage como fallback')
        return this.saveWorkerToLocalStorage(worker)
      }
      
      throw error
    }
  }

  async deleteWorker(workerId) {
    try {
      if (this.isSupabaseAvailable()) {
        console.log('🗑️ Eliminando trabajador de Supabase:', workerId)
        
        const { success, error } = await supabaseService.delete('trabajadores', workerId)
        
        if (error) throw error
        
        // Eliminar de localStorage también
        this.deleteWorkerFromLocalStorage(workerId)
        
        return success
      } else {
        console.log('🗑️ Eliminando trabajador de localStorage (fallback)')
        return this.deleteWorkerFromLocalStorage(workerId)
      }
    } catch (error) {
      console.error('❌ Error eliminando trabajador:', error)
      
      if (this.fallbackToLocal) {
        return this.deleteWorkerFromLocalStorage(workerId)
      }
      
      throw error
    }
  }

  /**
   * TURNOS - Sincronización bidireccional
   */
  async getWorkerShifts() {
    try {
      if (this.isSupabaseAvailable()) {
        console.log('📅 Obteniendo turnos desde Supabase...')
        
        const { data, error } = await supabaseService.select('turnos', {
          orderBy: { column: 'fecha', ascending: false }
        })

        if (error) throw error

        // Convertir formato Supabase a formato aplicación
        const shifts = data.map(this.mapSupabaseToAppShift)
        
        // Guardar en localStorage como backup
        persistentStorage.store('worker_shifts', shifts)
        
        return shifts
      } else {
        console.log('💾 Obteniendo turnos desde localStorage (fallback)')
        return persistentStorage.retrieve('worker_shifts') || []
      }
    } catch (error) {
      console.error('❌ Error obteniendo turnos:', error)
      
      if (this.fallbackToLocal) {
        return persistentStorage.retrieve('worker_shifts') || []
      }
      
      throw error
    }
  }

  async saveWorkerShift(shift) {
    try {
      if (this.isSupabaseAvailable()) {
        console.log('💾 Guardando turno en Supabase:', shift.fecha, shift.turno)

        // Convertir formato aplicación a formato Supabase
        const supabaseShift = this.mapAppToSupabaseShift(shift)
        
        let result
        if (shift.id && shift.id !== 'temp') {
          result = await supabaseService.update('turnos', shift.id, supabaseShift)
        } else {
          result = await supabaseService.insert('turnos', supabaseShift)
        }

        if (result.error) throw result.error

        const savedShift = this.mapSupabaseToAppShift(result.data[0])
        
        // Actualizar localStorage
        this.updateShiftInLocalStorage(savedShift)
        
        return savedShift
      } else {
        console.log('💾 Guardando turno en localStorage (fallback)')
        return this.saveShiftToLocalStorage(shift)
      }
    } catch (error) {
      console.error('❌ Error guardando turno:', error)
      
      if (this.fallbackToLocal) {
        return this.saveShiftToLocalStorage(shift)
      }
      
      throw error
    }
  }

  /**
   * MAPEO DE DATOS - Conversión entre formatos
   */
  
  // Supabase → Aplicación (Worker)
  mapSupabaseToAppWorker(supabaseWorker) {
    return {
      id: supabaseWorker.id,
      nombre: supabaseWorker.nombre,
      rut: supabaseWorker.rut,
      contrato: supabaseWorker.contrato || 'eventual',
      telefono: supabaseWorker.telefono || '',
      estado: supabaseWorker.estado || 'activo',
      created_at: supabaseWorker.created_at,
      updated_at: supabaseWorker.updated_at,
      // Mantener compatibilidad con formato anterior
      name: supabaseWorker.nombre,
      contract: supabaseWorker.contrato || 'eventual',
      phone: supabaseWorker.telefono || '',
      status: supabaseWorker.estado === 'activo' ? 'Activo' : 'Inactivo',
      hireDate: supabaseWorker.created_at ? supabaseWorker.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
    }
  }

  // Aplicación → Supabase (Worker)  
  mapAppToSupabaseWorker(appWorker) {
    return {
      nombre: appWorker.nombre || appWorker.name,
      rut: appWorker.rut,
      contrato: appWorker.contrato || appWorker.contract || 'eventual',
      telefono: appWorker.telefono || appWorker.phone || '',
      estado: appWorker.estado || (appWorker.status === 'Activo' ? 'activo' : 'inactivo')
    }
  }

  // Supabase → Aplicación (Shift)
  mapSupabaseToAppShift(supabaseShift) {
    return {
      id: supabaseShift.id,
      trabajadorId: supabaseShift.trabajador_id,
      trabajador: supabaseShift.trabajador_nombre || '', // Si viene con JOIN
      fecha: supabaseShift.fecha,
      turno: this.mapSupabaseShiftType(supabaseShift.turno_tipo),
      estado: supabaseShift.estado || 'programado',
      created: supabaseShift.created_at
    }
  }

  // Aplicación → Supabase (Shift)
  mapAppToSupabaseShift(appShift) {
    return {
      trabajador_id: appShift.trabajadorId,
      fecha: appShift.fecha,
      turno_tipo: this.mapAppShiftType(appShift.turno),
      estado: appShift.estado || 'programado'
    }
  }

  mapSupabaseShiftType(supabaseType) {
    const mapping = {
      'primer_turno': 'Primer Turno',
      'segundo_turno': 'Segundo Turno', 
      'tercer_turno': 'Tercer Turno'
    }
    return mapping[supabaseType] || supabaseType
  }

  mapAppShiftType(appType) {
    const mapping = {
      'Primer Turno': 'primer_turno',
      'Segundo Turno': 'segundo_turno',
      'Tercer Turno': 'tercer_turno'
    }
    return mapping[appType] || 'primer_turno'
  }

  /**
   * OPERACIONES LOCALSTORAGE (FALLBACK)
   */
  
  saveWorkerToLocalStorage(worker) {
    const workers = persistentStorage.retrieve('workers') || []
    
    if (worker.id && worker.id !== 'temp') {
      // Actualizar existente
      const index = workers.findIndex(w => w.id === worker.id)
      if (index >= 0) {
        workers[index] = worker
      } else {
        workers.push(worker)
      }
    } else {
      // Crear nuevo con ID temporal
      worker.id = Date.now()
      workers.push(worker)
    }
    
    persistentStorage.store('workers', workers)
    return worker
  }

  updateWorkerInLocalStorage(worker) {
    const workers = persistentStorage.retrieve('workers') || []
    const index = workers.findIndex(w => w.id === worker.id)
    
    if (index >= 0) {
      workers[index] = worker
    } else {
      workers.push(worker)
    }
    
    persistentStorage.store('workers', workers)
  }

  deleteWorkerFromLocalStorage(workerId) {
    const workers = persistentStorage.retrieve('workers') || []
    const filtered = workers.filter(w => w.id !== workerId)
    persistentStorage.store('workers', filtered)
    return true
  }

  saveShiftToLocalStorage(shift) {
    const shifts = persistentStorage.retrieve('worker_shifts') || []
    
    if (shift.id && shift.id !== 'temp') {
      const index = shifts.findIndex(s => s.id === shift.id)
      if (index >= 0) {
        shifts[index] = shift
      } else {
        shifts.push(shift)
      }
    } else {
      shift.id = Date.now()
      shifts.push(shift)
    }
    
    persistentStorage.store('worker_shifts', shifts)
    return shift
  }

  updateShiftInLocalStorage(shift) {
    const shifts = persistentStorage.retrieve('worker_shifts') || []
    const index = shifts.findIndex(s => s.id === shift.id)
    
    if (index >= 0) {
      shifts[index] = shift
    } else {
      shifts.push(shift)
    }
    
    persistentStorage.store('worker_shifts', shifts)
  }

  /**
   * MIGRACIÓN DE DATOS
   */
  async migrateLocalDataToSupabase() {
    if (!this.isSupabaseAvailable()) {
      console.warn('⚠️ Supabase no disponible para migración')
      return false
    }

    try {
      console.log('🔄 Iniciando migración de datos a Supabase...')

      // Migrar trabajadores
      const localWorkers = persistentStorage.retrieve('workers') || []
      console.log(`👥 Migrando ${localWorkers.length} trabajadores...`)

      for (const worker of localWorkers) {
        try {
          await this.saveWorker(worker)
          console.log(`✅ Migrado: ${worker.name}`)
        } catch (error) {
          console.error(`❌ Error migrando ${worker.name}:`, error.message)
        }
      }

      // Migrar turnos
      const localShifts = persistentStorage.retrieve('worker_shifts') || []
      console.log(`📅 Migrando ${localShifts.length} turnos...`)

      for (const shift of localShifts) {
        try {
          await this.saveWorkerShift(shift)
          console.log(`✅ Migrado turno: ${shift.fecha} - ${shift.turno}`)
        } catch (error) {
          console.error(`❌ Error migrando turno:`, error.message)
        }
      }

      console.log('🎉 Migración completada exitosamente')
      return true

    } catch (error) {
      console.error('❌ Error en migración:', error)
      return false
    }
  }

  /**
   * UTILIDADES
   */
  
  getConnectionStatus() {
    return {
      supabase: supabaseService.getConnectionStatus(),
      localStorage: persistentStorage.isAvailable(),
      syncEnabled: this.syncEnabled,
      fallbackEnabled: this.fallbackToLocal
    }
  }

  async forceSync() {
    console.log('🔄 Forzando sincronización...')
    
    try {
      await supabaseService.reconnect()
      
      if (this.isSupabaseAvailable()) {
        console.log('✅ Reconexión exitosa')
        return true
      } else {
        console.log('❌ No se pudo reconectar')
        return false
      }
    } catch (error) {
      console.error('❌ Error en sincronización forzada:', error)
      return false
    }
  }
}

// Singleton
const supabaseIntegration = new SupabaseIntegrationService()

export default supabaseIntegration
