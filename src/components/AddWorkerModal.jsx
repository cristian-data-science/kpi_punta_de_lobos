import React, { useState } from 'react';
import { X, User, Phone, FileText, AlertCircle, CheckCircle, DollarSign, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { validateRutInput, formatRut, normalizeRut } from '../utils/rutUtils';

/**
 * Modal para agregar nuevos trabajadores con validación de RUT
 */
const AddWorkerModal = ({ isOpen, onClose, onSave, isSaving = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    contrato: 'planta',
    estado: 'activo',
    sueldo_base: '',
    dias_trabajados: 30
  });

  const [rutValidation, setRutValidation] = useState({
    isValid: false,
    message: '',
    canContinue: true
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Resetear formulario cuando se abre/cierra
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: '',
        rut: '',
        telefono: '',
        contrato: 'planta',
        estado: 'activo',
        sueldo_base: '',
        dias_trabajados: 30
      });
      setRutValidation({ isValid: false, message: '', canContinue: true });
      setErrors({});
      setIsFormValid(false);
    }
  }, [isOpen]);

  // Validar formulario completo
  React.useEffect(() => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'Nombre debe tener al menos 2 caracteres';
    }

    // Validar RUT
    if (!formData.rut.trim()) {
      newErrors.rut = 'RUT es requerido';
    } else if (!rutValidation.isValid) {
      newErrors.rut = rutValidation.message || 'RUT inválido';
    }

    // Validar teléfono (opcional pero si está, debe ser válido)
    if (formData.telefono.trim() && formData.telefono.trim().length < 8) {
      newErrors.telefono = 'Teléfono debe tener al menos 8 dígitos';
    }

    // Validar sueldo_base (opcional, debe ser entero)
    if (formData.sueldo_base && isNaN(parseInt(formData.sueldo_base))) {
      newErrors.sueldo_base = 'Sueldo debe ser un número entero válido';
    }

    // Validar dias_trabajados
    const dias = parseInt(formData.dias_trabajados);
    if (isNaN(dias) || dias < 1 || dias > 31) {
      newErrors.dias_trabajados = 'Días debe ser entre 1 y 31';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0 && rutValidation.isValid);
  }, [formData, rutValidation]);

  // Manejar cambios en los campos
  const handleInputChange = (field, value) => {
    if (field === 'rut') {
      // Validar RUT en tiempo real
      const validation = validateRutInput(value);
      setRutValidation(validation);
      
      // Formatear RUT mientras se escribe
      if (validation.canContinue) {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Formatear RUT al perder el foco
  const handleRutBlur = () => {
    if (formData.rut && rutValidation.isValid) {
      const formatted = formatRut(formData.rut);
      setFormData(prev => ({ ...prev, rut: formatted }));
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || isSaving) return;

    try {
      // Preparar datos con RUT normalizado para BD
      const workerData = {
        ...formData,
        rut: normalizeRut(formData.rut), // Guardar RUT limpio
        nombre: formData.nombre.trim().toUpperCase(), // Asegurar que se guarde en MAYÚSCULAS
        telefono: formData.telefono.trim(),
        sueldo_base: formData.sueldo_base ? parseInt(formData.sueldo_base) : 0,
        dias_trabajados: parseInt(formData.dias_trabajados)
      };

      await onSave(workerData);
    } catch (error) {
      console.error('Error al crear trabajador:', error);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Agregar Trabajador
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Ej: Juan Pérez González"
              disabled={isSaving}
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.nombre}
              </p>
            )}
          </div>

          {/* RUT */}
          <div className="space-y-2">
            <Label htmlFor="rut">
              RUT <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rut"
              type="text"
              value={formData.rut}
              onChange={(e) => handleInputChange('rut', e.target.value)}
              onBlur={handleRutBlur}
              placeholder="Ej: 12.345.678-9"
              disabled={isSaving}
              className={errors.rut ? 'border-red-500' : rutValidation.isValid ? 'border-green-500' : ''}
            />
            {rutValidation.message && (
              <p className={`text-sm flex items-center gap-1 ${
                rutValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {rutValidation.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {rutValidation.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="text"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              placeholder="Ej: +56912345678"
              disabled={isSaving}
              className={errors.telefono ? 'border-red-500' : ''}
            />
            {errors.telefono && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.telefono}
              </p>
            )}
          </div>

          {/* Tipo de Contrato */}
          <div className="space-y-2">
            <Label htmlFor="contrato">Tipo de contrato</Label>
            <select
              id="contrato"
              value={formData.contrato}
              onChange={(e) => handleInputChange('contrato', e.target.value)}
              disabled={isSaving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="fijo">Fijo</option>
              <option value="planta">Planta</option>
              <option value="eventual">Eventual</option>
            </select>
            <p className="text-xs text-gray-500">
              💡 Fijo y Planta funcionan igual, solo cambia la etiqueta
            </p>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado inicial</Label>
            <select
              id="estado"
              value={formData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              disabled={isSaving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="licencia">Licencia</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>

          {/* Sueldo Base (solo para contratos planta y fijo) */}
          {(formData.contrato === 'planta' || formData.contrato === 'fijo') && (
            <div className="space-y-2">
              <Label htmlFor="sueldo_base">
                Sueldo Base (CLP)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="sueldo_base"
                  type="number"
                  value={formData.sueldo_base}
                  onChange={(e) => handleInputChange('sueldo_base', e.target.value)}
                  placeholder="Ej: 500000"
                  step="1000"
                  min="0"
                  disabled={isSaving}
                  className={`pl-10 ${errors.sueldo_base ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.sueldo_base && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.sueldo_base}
                </p>
              )}
            </div>
          )}

          {/* Días Trabajados (solo para contratos planta y fijo) */}
          {(formData.contrato === 'planta' || formData.contrato === 'fijo') && (
            <div className="space-y-2">
              <Label htmlFor="dias_trabajados">
                Días Trabajados <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="dias_trabajados"
                  type="number"
                  value={formData.dias_trabajados}
                  onChange={(e) => handleInputChange('dias_trabajados', e.target.value)}
                  placeholder="30"
                  min="1"
                  max="31"
                  disabled={isSaving}
                  className={`pl-10 ${errors.dias_trabajados ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.dias_trabajados && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.dias_trabajados}
                </p>
              )}
              <p className="text-xs text-gray-500">
                📅 El sueldo proporcional se calculará automáticamente en la base de datos
              </p>
            </div>
          )}

          {/* Mensaje para contratos eventuales */}
          {formData.contrato === 'eventual' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">
                    👷 Contrato Eventual
                  </p>
                  <p className="text-amber-700">
                    Los trabajadores eventuales no tienen sueldo base ni días trabajados configurados.
                    El sistema automáticamente establecerá estos valores en <strong>0</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview del Sueldo Proporcional (solo para planta y fijo) */}
          {(formData.contrato === 'planta' || formData.contrato === 'fijo') && formData.sueldo_base && formData.dias_trabajados && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  💰 Sueldo Proporcional:
                </span>
                <span className="text-lg font-bold text-blue-700">
                  ${Math.round(
                    parseInt(formData.sueldo_base || 0) * 
                    (parseInt(formData.dias_trabajados || 30) / 30)
                  ).toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-blue-700">
                <span>Porcentaje:</span>
                <span className="font-semibold">
                  {((parseInt(formData.dias_trabajados || 30) / 30) * 100).toFixed(0)}% del sueldo base
                </span>
              </div>
              <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
                📊 Fórmula: ${parseInt(formData.sueldo_base || 0).toLocaleString('es-CL')} × ({parseInt(formData.dias_trabajados || 30)}/30)
              </div>
              <div className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Este cálculo se realizará automáticamente en la base de datos al guardar
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Crear Trabajador
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddWorkerModal;
