// Servicio para almacenamiento persistente local
class PersistentStorage {
  constructor() {
    this.prefix = 'transapp_'
  }

  // Guardar datos
  save(key, data) {
    try {
      const serializedData = JSON.stringify(data)
      localStorage.setItem(this.prefix + key, serializedData)
      return true
    } catch (error) {
      console.error('Error saving data:', error)
      return false
    }
  }

  // Cargar datos
  load(key) {
    try {
      const serializedData = localStorage.getItem(this.prefix + key)
      if (serializedData === null) {
        return null
      }
      return JSON.parse(serializedData)
    } catch (error) {
      console.error('Error loading data:', error)
      return null
    }
  }

  // Eliminar datos
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key)
      return true
    } catch (error) {
      console.error('Error removing data:', error)
      return false
    }
  }

  // Limpiar todos los datos de la aplicación
  clear() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  }

  // Verificar si existe una clave
  exists(key) {
    return localStorage.getItem(this.prefix + key) !== null
  }

  // Obtener todas las claves de la aplicación
  getKeys() {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''))
  }

  // Exportar todos los datos
  exportAll() {
    const data = {}
    const keys = this.getKeys()
    
    keys.forEach(key => {
      data[key] = this.load(key)
    })
    
    return data
  }

  // Importar datos
  importAll(data) {
    try {
      Object.keys(data).forEach(key => {
        this.save(key, data[key])
      })
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }
}

// Crear instancia singleton
const persistentStorage = new PersistentStorage()

export default persistentStorage
