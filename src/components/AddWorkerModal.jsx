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

    // Validar sueldo_base (opcional)
    if (formData.sueldo_base && isNaN(parseFloat(formData.sueldo_base))) {
      newErrors.sueldo_base = 'Sueldo debe ser un número válido';
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
        telefono: formData.telefono.trim()
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
              <option value="eventual">Eventual</option>
              <option value="planta">Planta</option>
            </select>
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
            </select>
          </div>

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
