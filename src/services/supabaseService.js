/**
 * Servicio base de Supabase para TransApp
 * 
 * Proporciona funciones CRUD genéricas y manejo de conexión con Supabase.
 * Incluye fallback a localStorage en caso de problemas de conectividad.
 * Usa cliente singleton para evitar múltiples instancias GoTrueClient.
 * 
 * @author TransApp Development Team
 * @version 1.0.0
 */

import { getSupabaseClient } from './supabaseClient.js'

class SupabaseService {
  constructor() {
    this.supabase = null
    this.isConnected = false
    this.connectionStatus = 'disconnected' // disconnected, connecting, connected, error
    this.retryAttempts = 0
    this.maxRetries = 3
    
    this.initializeClient()
  }

  /**
   * Inicializar cliente de Supabase
   */
  async initializeClient() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Variables de entorno de Supabase no configuradas. Usando localStorage como fallback.')
        this.connectionStatus = 'error'
        return
      }

      this.connectionStatus = 'connecting'
      
      // Usar cliente singleton en lugar de crear nueva instancia
      this.supabase = getSupabaseClient()

      // Verificar conexión
      const { error } = await this.supabase.from('_health_check').select('*').limit(1)
      
      if (!error || error.code === 'PGRST116') { // PGRST116 = tabla no existe (conexión OK)
        this.isConnected = true
        this.connectionStatus = 'connected'
        this.retryAttempts = 0
        console.log('✅ Supabase conectado correctamente')
      } else {
        throw error
      }

    } catch (error) {
      console.error('❌ Error conectando a Supabase:', error.message)
      this.isConnected = false
      this.connectionStatus = 'error'
      
      // Reintentar conexión si no hemos excedido los intentos
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++
        console.log(`🔄 Reintentando conexión (${this.retryAttempts}/${this.maxRetries})...`)
        setTimeout(() => this.initializeClient(), 2000 * this.retryAttempts)
      }
    }
  }

  /**
   * Obtener estado de la conexión
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      retryAttempts: this.retryAttempts
    }
  }

  /**
   * Operación genérica SELECT
   */
  async select(table, options = {}) {
    if (!this.isConnected || !this.supabase) {
      throw new Error('Supabase no conectado. Usar localStorage como fallback.')
    }

    try {
      let query = this.supabase.from(table).select(options.select || '*')

      // Aplicar filtros
      if (options.filters) {
        for (const [column, value] of Object.entries(options.filters)) {
          if (Array.isArray(value)) {
            query = query.in(column, value)
          } else {
            query = query.eq(column, value)
          }
        }
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        })
      }

      // Aplicar límite
      if (options.limit) {
        query = query.limit(options.limit)
      }

      // Aplicar rango
      if (options.range) {
        query = query.range(options.range.from, options.range.to)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }

    } catch (error) {
      console.error(`Error en SELECT ${table}:`, error)
      return { data: null, error }
    }
  }

  /**
   * Operación genérica INSERT
   */
  async insert(table, data) {
    if (!this.isConnected || !this.supabase) {
      throw new Error('Supabase no conectado. Usar localStorage como fallback.')
    }

    try {
      const { data: insertedData, error } = await this.supabase
        .from(table)
        .insert(data)
        .select()

      if (error) throw error
      return { data: insertedData, error: null }

    } catch (error) {
      console.error(`Error en INSERT ${table}:`, error)
      return { data: null, error }
    }
  }

  /**
   * Operación genérica UPDATE
   */
  async update(table, id, data) {
    if (!this.isConnected || !this.supabase) {
      throw new Error('Supabase no conectado. Usar localStorage como fallback.')
    }

    try {
      const { data: updatedData, error } = await this.supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()

      if (error) throw error
      return { data: updatedData, error: null }

    } catch (error) {
      console.error(`Error en UPDATE ${table}:`, error)
      return { data: null, error }
    }
  }

  /**
   * Operación genérica DELETE
   */
  async delete(table, id) {
    if (!this.isConnected || !this.supabase) {
      throw new Error('Supabase no conectado. Usar localStorage como fallback.')
    }

    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true, error: null }

    } catch (error) {
      console.error(`Error en DELETE ${table}:`, error)
      return { success: false, error }
    }
  }

  /**
   * Operación genérica UPSERT (insertar o actualizar)
   */
  async upsert(table, data, options = {}) {
    if (!this.isConnected || !this.supabase) {
      throw new Error('Supabase no conectado. Usar localStorage como fallback.')
    }

    try {
      const { data: upsertedData, error } = await this.supabase
        .from(table)
        .upsert(data, { 
          onConflict: options.onConflict || 'id',
          ignoreDuplicates: options.ignoreDuplicates || false
        })
        .select()

      if (error) throw error
      return { data: upsertedData, error: null }

    } catch (error) {
      console.error(`Error en UPSERT ${table}:`, error)
      return { data: null, error }
    }
  }

  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToChanges(table, callback, options = {}) {
    if (!this.isConnected || !this.supabase) {
      console.warn('Supabase no conectado. Suscripción en tiempo real no disponible.')
      return null
    }

    try {
      let subscription = this.supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', {
          event: options.event || '*', // INSERT, UPDATE, DELETE, o * para todos
          schema: options.schema || 'public',
          table: table,
          filter: options.filter
        }, callback)
        .subscribe()

      return subscription

    } catch (error) {
      console.error(`Error suscribiéndose a ${table}:`, error)
      return null
    }
  }

  /**
   * Cancelar suscripción
   */
  unsubscribe(subscription) {
    if (subscription && this.supabase) {
      this.supabase.removeChannel(subscription)
    }
  }

  /**
   * Ejecutar función SQL personalizada
   */
  async rpc(functionName, params = {}) {
    if (!this.isConnected || !this.supabase) {
      throw new Error('Supabase no conectado. RPC no disponible.')
    }

    try {
      const { data, error } = await this.supabase.rpc(functionName, params)
      
      if (error) throw error
      return { data, error: null }

    } catch (error) {
      console.error(`Error ejecutando RPC ${functionName}:`, error)
      return { data: null, error }
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  async getCurrentUser() {
    if (!this.supabase) {
      return { user: null, session: null }
    }

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      const { data: { session } } = await this.supabase.auth.getSession()
      
      return { user, session, error }

    } catch (error) {
      console.error('Error obteniendo usuario:', error)
      return { user: null, session: null, error }
    }
  }

  /**
   * Forzar reconexión
   */
  async reconnect() {
    console.log('🔄 Forzando reconexión a Supabase...')
    this.isConnected = false
    this.connectionStatus = 'disconnected'
    this.retryAttempts = 0
    await this.initializeClient()
  }
}

// Singleton: una sola instancia del servicio
const supabaseService = new SupabaseService()

export default supabaseService
