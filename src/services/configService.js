import persistentStorage from './persistentStorage'

// Servicio centralizado para la configuración de la aplicación
class AppConfigService {
  constructor() {
    this.APP_KEY = 'app_config'
    this.LEGACY_CALENDAR_KEY = 'calendar_config'
    this._lastSnapshotString = null
    this._syncTimer = null
  }

  // ===== Defaults y Validación =====
  getDefaultAppConfig() {
    return {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      calendar: this.getDefaultCalendarSection(),
      company: { name: '', rut: '', address: '' },
      preferences: { notifications: {}, security: {} }
    }
  }

  getDefaultCalendarSection() {
    return {
      shiftRates: {
        firstSecondShift: 20000,
        thirdShiftWeekday: 22500,
        thirdShiftSaturday: 27500,
        holiday: 27500,
        sunday: 35000
      },
      holidays: [
        '2025-01-01',
        '2025-04-18',
        '2025-04-19',
        '2025-05-01',
        '2025-05-21',
        '2025-09-18',
        '2025-09-19',
        '2025-12-25'
      ]
    }
  }

  isValidCalendarSection(calendar) {
    return calendar &&
      typeof calendar === 'object' &&
      calendar.shiftRates && typeof calendar.shiftRates === 'object' &&
      typeof calendar.shiftRates.firstSecondShift === 'number' &&
      typeof calendar.shiftRates.thirdShiftWeekday === 'number' &&
      (typeof calendar.shiftRates.thirdShiftSaturday === 'number' || typeof calendar.shiftRates.thirdShiftSatHoliday === 'number') &&
      (typeof calendar.shiftRates.holiday === 'number' || typeof calendar.shiftRates.thirdShiftSatHoliday === 'number') &&
      typeof calendar.shiftRates.sunday === 'number' &&
      Array.isArray(calendar.holidays)
  }

  isValidAppConfig(config) {
    return config && typeof config === 'object' && this.isValidCalendarSection(config.calendar)
  }

  // ===== Carga, guardado y migración =====
  loadAppConfig() {
    let cfg = persistentStorage.load(this.APP_KEY)
    if (!cfg) {
      // Intentar migrar desde la clave antigua
      const legacy = persistentStorage.load(this.LEGACY_CALENDAR_KEY)
      if (legacy && this.isValidCalendarSection(legacy)) {
        cfg = {
          ...this.getDefaultAppConfig(),
          calendar: this.migrateCalendar(legacy)
        }
      } else {
        cfg = this.getDefaultAppConfig()
      }
      this._persistBoth(cfg)
    } else {
      // Normalizar/migrar si faltan campos
      if (!this.isValidAppConfig(cfg)) {
        const fixed = this.normalizeConfig(cfg)
        cfg = fixed
        this._persistBoth(cfg)
      }
      // Sincronizar legacy para compatibilidad
      this._persistLegacyCalendar(cfg.calendar)
    }
    return cfg
  }

  // Guarda el config (merge profundo con patch parcial)
  saveAppConfig(patch) {
    const current = this.loadAppConfig()
    const merged = this._deepMerge(current, patch)
    merged.updatedAt = new Date().toISOString()
    this._persistBoth(merged)
    return merged
  }

  // ===== Operaciones específicas de calendario =====
  getCalendar() {
    return this.loadAppConfig().calendar
  }

  updateCalendar(patch) {
    const current = this.getCalendar()
    const updated = this._deepMerge(current, patch)
    // Asegurar campos requeridos y números
    updated.shiftRates = this._normalizeShiftRates(updated.shiftRates)
    const cfg = this.saveAppConfig({ calendar: updated })
    return cfg.calendar
  }

  addHoliday(date) {
    if (!date || typeof date !== 'string') return this.getCalendar()
    const cal = this.getCalendar()
    if (!cal.holidays.includes(date)) {
      const newHolidays = [...cal.holidays, date].sort()
      return this.updateCalendar({ holidays: newHolidays })
    }
    return cal
  }

  removeHoliday(date) {
    const cal = this.getCalendar()
    const newHolidays = cal.holidays.filter(h => h !== date)
    return this.updateCalendar({ holidays: newHolidays })
  }

  updateShiftRates(rates) {
    const normalized = this._normalizeShiftRates({ ...rates })
    return this.updateCalendar({ shiftRates: normalized })
  }

  // ===== Exportar / Importar =====
  exportAppConfig() {
    const cfg = this.loadAppConfig()
    return {
      timestamp: new Date().toISOString(),
      version: cfg.version || '1.0',
      config: cfg
    }
  }

  downloadAppConfig() {
    const exportData = this.exportAppConfig()
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transapp_app_config_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async importAppConfig(file) {
    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      const imported = importData.config || importData
      // Validar que al menos tenga calendario
      if (this.isValidAppConfig(imported)) {
        // Respetar versión si viene
        const cfg = {
          ...this.getDefaultAppConfig(),
          ...imported,
          // Normalizar calendario por si faltan campos
          calendar: this.normalizeCalendar(imported.calendar)
        }
        this._persistBoth(cfg)
        return { success: true, message: 'Configuración importada correctamente' }
      } else if (imported.calendar && this.isValidCalendarSection(imported.calendar)) {
        // Si viene solo el calendario válido
        const merged = this.saveAppConfig({ calendar: this.normalizeCalendar(imported.calendar) })
        return { success: true, message: 'Configuración de calendario importada correctamente' }
      } else {
        return { success: false, message: 'Formato de archivo inválido' }
      }
    } catch (error) {
      console.error('Error importing app config:', error)
      return { success: false, message: 'Error al procesar el archivo' }
    }
  }

  // ===== Inicialización desde snapshot (cross-dispositivo) =====
  async initFromSnapshot() {
    try {
      // Intentar cargar desde /config_snapshot.json servido desde /public
      const res = await fetch('/config_snapshot.json', { cache: 'no-store' })
      if (!res.ok) return false

      const snapshot = await res.json()
      // Validar y normalizar
      const cfg = this.isValidAppConfig(snapshot)
        ? this.normalizeConfig(snapshot)
        : (snapshot.calendar ? this.normalizeConfig({ calendar: snapshot.calendar }) : null)

      if (!cfg) return false

      // Persistir en ambas claves sin volver a escribir snapshot (evitar loop innecesario)
      // Guardar directamente para asegurar que sea la fuente de verdad
      persistentStorage.save(this.APP_KEY, cfg)
      this._persistLegacyCalendar(cfg.calendar)
      // Actualizar cache para que _postSnapshot no vuelva a escribir el mismo contenido
      this._lastSnapshotString = JSON.stringify(cfg)
      // Notificar a listeners de la app
      this._dispatchEvents(cfg)
      return true
    } catch (e) {
      return false
    }
  }

  // Iniciar sincronización periódica con snapshot (para otras sesiones/dispositivos)
  startSync(intervalMs = 10000) {
    if (this._syncTimer) return
    this._syncTimer = setInterval(() => {
      this._pollSnapshot()
    }, intervalMs)
    // Primer tick rápido
    this._pollSnapshot()
  }

  stopSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer)
      this._syncTimer = null
    }
  }

  async _pollSnapshot() {
    try {
      const res = await fetch('/config_snapshot.json', { cache: 'no-store' })
      if (!res.ok) return
      const remote = await res.json()
      // Comparar con local
      const local = this.loadAppConfig()
      const remoteStr = JSON.stringify(remote)
      const localStr = JSON.stringify(local)
      if (remoteStr !== localStr) {
        // Si trae updatedAt más nuevo, o si no existe en local, aplicar
        const remoteAt = new Date(remote.updatedAt || 0).getTime()
        const localAt = new Date(local.updatedAt || 0).getTime()
        if (!localAt || remoteAt >= localAt) {
          this._applyRemote(remote)
        }
      }
    } catch (_) {
      // silencioso
    }
  }

  _applyRemote(remoteCfg) {
    const cfg = this.isValidAppConfig(remoteCfg)
      ? this.normalizeConfig(remoteCfg)
      : (remoteCfg.calendar ? this.normalizeConfig({ calendar: remoteCfg.calendar }) : null)
    if (!cfg) return

    // Evitar re-posteo del mismo snapshot
    this._lastSnapshotString = JSON.stringify(cfg)
    // Persistir localmente
    persistentStorage.save(this.APP_KEY, cfg)
    this._persistLegacyCalendar(cfg.calendar)
    // Avisar a la app (para que UI se refresque si escucha)
    this._dispatchEvents(cfg)
  }

  _dispatchEvents(cfg) {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appConfigChanged', { detail: cfg }))
        window.dispatchEvent(new CustomEvent('calendarConfigChanged', { detail: cfg.calendar }))
      }
    } catch (_) {}
  }

  // ===== Normalización / Migración interna =====
  migrateCalendar(legacy) {
    const cal = { ...legacy }
    // Migrar nombres antiguos si existieran
    if (!cal.shiftRates) cal.shiftRates = {}
    const sr = cal.shiftRates
    if (!sr.thirdShiftSaturday && sr.thirdShiftSatHoliday) sr.thirdShiftSaturday = sr.thirdShiftSatHoliday
    if (!sr.holiday && sr.thirdShiftSatHoliday) sr.holiday = sr.thirdShiftSatHoliday
    // Completar faltantes con defaults
    const def = this.getDefaultCalendarSection().shiftRates
    cal.shiftRates = this._normalizeShiftRates({ ...def, ...sr })
    if (!Array.isArray(cal.holidays)) cal.holidays = []
    return cal
  }

  normalizeCalendar(calendar) {
    const def = this.getDefaultCalendarSection()
    const cal = {
      ...def,
      ...(calendar || {})
    }
    cal.shiftRates = this._normalizeShiftRates({ ...def.shiftRates, ...(calendar?.shiftRates || {}) })
    if (!Array.isArray(cal.holidays)) cal.holidays = [...def.holidays]
    return cal
  }

  normalizeConfig(cfg) {
    const base = this.getDefaultAppConfig()
    const merged = this._deepMerge(base, cfg || {})
    merged.calendar = this.normalizeCalendar(merged.calendar)
    return merged
  }

  _normalizeShiftRates(sr) {
    const def = this.getDefaultCalendarSection().shiftRates
    const out = { ...def, ...(sr || {}) }
    // Forzar números
    for (const k of Object.keys(out)) {
      if (typeof out[k] !== 'number') {
        const n = Number(out[k])
        out[k] = Number.isFinite(n) ? n : def[k]
      }
    }
    return out
  }

  // ===== Persistencia y utilidades =====
  _persistBoth(cfg) {
    persistentStorage.save(this.APP_KEY, cfg)
    this._persistLegacyCalendar(cfg.calendar)
    this._postSnapshot(cfg)
  }

  _persistLegacyCalendar(calendar) {
    const normalized = this.normalizeCalendar(calendar)
    persistentStorage.save(this.LEGACY_CALENDAR_KEY, normalized)
  }

  _deepMerge(target, source) {
    if (!source || typeof source !== 'object') return { ...target }
    const output = Array.isArray(target) ? [...target] : { ...target }
    for (const key of Object.keys(source)) {
      const srcVal = source[key]
      const tgtVal = output[key]
      if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
        output[key] = this._deepMerge(tgtVal && typeof tgtVal === 'object' ? tgtVal : {}, srcVal)
      } else {
        output[key] = srcVal
      }
    }
    return output
  }

  // Enviar snapshot al servidor de desarrollo para escribir archivo local
  _postSnapshot(cfg) {
    try {
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const snapshotStr = JSON.stringify(cfg)
        if (this._lastSnapshotString === snapshotStr) {
          return
        }
        this._lastSnapshotString = snapshotStr
        const payload = { config: cfg, file: 'public/config_snapshot.json' }
        fetch('/__config_snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {})
      }
    } catch (e) {
      // Silencioso: solo herramienta de desarrollo
    }
  }
}

const configService = new AppConfigService()
export default configService
