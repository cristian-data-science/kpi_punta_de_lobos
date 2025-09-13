import React, { useState, useRef } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, Users, Download } from 'lucide-react';
import { getSupabaseClient } from '../services/supabaseClient.js';
import * as XLSX from 'xlsx';

const supabase = getSupabaseClient();

// Función para formatear RUT chileno CORREGIDA
const formatChileanRut = (rut) => {
  if (!rut) return '';
  
  // Limpiar el RUT completamente (remover TODO excepto números y K)
  const cleanRut = rut.toString()
    .replace(/[^0-9kK]/g, '') // Solo números y K, SIN guión
    .trim()
    .toUpperCase();
  
  console.log('🔧 Formateando RUT - Original:', rut, '-> Limpio:', cleanRut);
  
  if (cleanRut.length < 8) return rut;
  
  // Separar número del dígito verificador
  const rutNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);
  
  // Formatear con UN SOLO guión
  const formatted = `${rutNumber}-${checkDigit}`;
  console.log('✅ RUT formateado:', formatted);
  
  return formatted;
};

// Función de validación RUT chileno MEJORADA
const validateChileanRut = (rut) => {
  if (!rut) return { isValid: false, error: 'RUT vacío' };
  
  // Convertir a string y limpiar completamente (remover TODO lo que no sea número, K o guión)
  let cleanRut = rut.toString()
    .replace(/[^0-9kK\-]/g, '') // Solo números, K y guión
    .replace(/\./g, '') // Remover puntos
    .replace(/\s/g, '') // Remover espacios
    .replace(/--+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim()
    .toUpperCase();
  
  console.log('🔍 RUT original:', rut);
  console.log('🧹 RUT limpio:', cleanRut);
  
  // Si no tiene guión, agregarlo
  if (!cleanRut.includes('-') && cleanRut.length >= 8) {
    cleanRut = cleanRut.slice(0, -1) + '-' + cleanRut.slice(-1);
  }
  
  // Si tiene múltiples guiones, arreglar
  if (cleanRut.includes('--')) {
    cleanRut = cleanRut.replace(/--+/g, '-');
  }
  
  console.log('➕ RUT con guión corregido:', cleanRut);
  
  // Verificar formato básico: debe tener al menos 8 caracteres
  if (cleanRut.length < 8) {
    return { isValid: false, error: 'RUT debe tener al menos 8 caracteres' };
  }
  
  // Verificar que tenga exactamente un guión
  const guionCount = (cleanRut.match(/-/g) || []).length;
  if (guionCount !== 1) {
    return { isValid: false, error: 'RUT debe tener formato XXXXXXXX-X' };
  }
  
  // Separar número del dígito verificador
  const parts = cleanRut.split('-');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Formato de RUT incorrecto' };
  }
  
  const rutNumber = parts[0];
  const checkDigit = parts[1];
  
  console.log('🔢 Número RUT:', rutNumber);
  console.log('✓ Dígito verificador:', checkDigit);
  
  // Verificar que la parte numérica solo contenga números
  if (!/^\d+$/.test(rutNumber)) {
    console.log('❌ Parte numérica inválida:', rutNumber);
    return { isValid: false, error: 'Parte numérica del RUT debe contener solo números' };
  }
  
  // Verificar que el dígito verificador sea válido (0-9 o K)
  if (!/^[0-9K]$/.test(checkDigit)) {
    return { isValid: false, error: 'Dígito verificador debe ser 0-9 o K' };
  }
  
  // Verificar que el número tenga al menos 7 dígitos
  if (rutNumber.length < 7 || rutNumber.length > 8) {
    return { isValid: false, error: 'RUT debe tener 7 u 8 dígitos' };
  }
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer de derecha a izquierda
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedCheckDigit = remainder === 0 ? '0' : remainder === 1 ? 'K' : String(11 - remainder);
  
  console.log('🧮 Dígito calculado:', calculatedCheckDigit);
  console.log('📝 Dígito recibido:', checkDigit);
  
  if (checkDigit !== calculatedCheckDigit) {
    return { 
      isValid: false, 
      error: `Dígito verificador incorrecto. Esperado: ${calculatedCheckDigit}, recibido: ${checkDigit}` 
    };
  }
  
  console.log('✅ RUT válido!');
  return { isValid: true };
};

const BulkUploadWorkersModal = ({ isOpen, onClose, onWorkersUploaded }) => {
  const [file, setFile] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload', 'validate', 'confirm', 'results'
  const [missingDataConfig, setMissingDataConfig] = useState(null);
  const [showMissingDataModal, setShowMissingDataModal] = useState(false);
  const fileInputRef = useRef(null);

  const resetModal = () => {
    setFile(null);
    setWorkers([]);
    setValidationResults([]);
    setUploadResults(null);
    setMissingDataConfig(null);
    setShowMissingDataModal(false);
    setStep('upload');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const downloadTemplate = () => {
    // Crear workbook de Excel con ejemplo
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['nombre', 'rut', 'telefono', 'contrato'],
      ['Juan Pérez', '12345678-9', '+56912345678', 'fijo'],
      ['María González', '98765432-1', '+56987654321', 'fijo'],
      ['Carlos López', '11111111-1', '+56911111111', 'eventual']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores');
    XLSX.writeFile(wb, 'plantilla_trabajadores.xlsx');
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                        selectedFile.type === 'application/vnd.ms-excel' ||
                        selectedFile.name.endsWith('.xlsx') ||
                        selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    } else {
      alert('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
    }
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length < 2) {
          alert('El archivo debe tener al menos una fila de encabezados y una fila de datos');
          return;
        }

        const headers = jsonData[0].map(h => h?.toString().trim().toLowerCase());
        
        // Solo validar que tenga nombre y rut como mínimo
        if (!headers.includes('nombre') || !headers.includes('rut')) {
          alert('El archivo debe tener al menos las columnas "nombre" y "rut"');
          return;
        }

        const allPossibleHeaders = ['nombre', 'rut', 'telefono', 'contrato'];
        const parsedWorkers = [];
        const missingData = {};
        
        // Detectar qué columnas faltan completamente
        allPossibleHeaders.forEach(field => {
          if (!headers.includes(field)) {
            missingData[field] = 'all'; // Columna no presente
          }
        });

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length === 0 || !row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
            continue; // Saltar filas vacías
          }
          
          const worker = { lineNumber: i + 1 };
          
          // Procesar todas las columnas posibles
          allPossibleHeaders.forEach(field => {
            const headerIndex = headers.indexOf(field);
            if (headerIndex !== -1) {
              // La columna existe en el archivo
              const value = row[headerIndex];
              if (value === null || value === undefined || value === '') {
                // Campo vacío en una columna existente
                if (missingData[field] && missingData[field] !== 'all') {
                  // Ya hay otros registros con este campo vacío
                  missingData[field].push(i + 1);
                } else if (!missingData[field]) {
                  // Primera vez que encontramos este campo vacío
                  missingData[field] = [i + 1];
                }
                worker[field] = '';
              } else {
                // IMPORTANTE: Limpiar el valor especialmente para RUT
                let cleanValue = value.toString().trim();
                
                // Si es RUT, hacer limpieza especial SIN agregar guión aquí
                if (field === 'rut') {
                  // Solo limpiar caracteres especiales, NO formatear todavía
                  cleanValue = cleanValue.replace(/[^0-9kK\-]/g, '').replace(/--+/g, '-');
                  console.log(`📋 RUT fila ${i + 1} - Original: "${value}" -> Limpio: "${cleanValue}"`);
                }
                
                worker[field] = cleanValue;
              }
            } else {
              // La columna no existe en el archivo
              worker[field] = '';
            }
          });
          
          parsedWorkers.push(worker);
        }
        
        console.log('📊 Trabajadores parseados:', parsedWorkers);
        
        // Verificar si hay datos faltantes (columnas no presentes O campos vacíos)
        const hasMissingData = Object.keys(missingData).length > 0;
        
        if (hasMissingData) {
          console.log('📋 Datos faltantes detectados:', missingData);
          setMissingDataConfig(missingData);
          setWorkers(parsedWorkers);
          setShowMissingDataModal(true);
        } else {
          setWorkers(parsedWorkers);
          validateWorkers(parsedWorkers);
        }
      } catch (error) {
        console.error('Error parsing Excel:', error);
        alert('Error al leer el archivo Excel. Asegúrate de que el formato sea correcto.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateWorkers = async (workersToValidate) => {
    setStep('validate');
    const results = [];
    
    console.log('🔍 Iniciando validación de trabajadores con función interna...');
    
    // Obtener RUTs existentes de la base de datos
    const { data: existingWorkers } = await supabase
      .from('trabajadores')
      .select('rut');
    
    const existingRuts = existingWorkers?.map(w => w.rut.toLowerCase()) || [];

    for (const worker of workersToValidate) {
      const result = {
        worker,
        errors: [],
        warnings: [],
        isValid: true
      };

      console.log('🔍 Validando trabajador:', worker);

      // Validar nombre
      if (!worker.nombre || worker.nombre.toString().trim().length < 2) {
        result.errors.push('Nombre debe tener al menos 2 caracteres');
        result.isValid = false;
      }

      // Validar RUT con función interna
      if (!worker.rut || worker.rut.toString().trim() === '') {
        result.errors.push('RUT es requerido');
        result.isValid = false;
      } else {
        const rutString = worker.rut.toString().trim();
        console.log('📋 RUT a validar:', rutString);
        
        const rutValidation = validateChileanRut(rutString);
        console.log('✅ Resultado validación RUT:', rutValidation);
        
        if (!rutValidation.isValid) {
          result.errors.push(`RUT inválido: ${rutValidation.error}`);
          result.isValid = false;
        } else {
          // Verificar RUT duplicado en BD
          const formattedRut = formatChileanRut(rutString);
          
          if (existingRuts.includes(formattedRut.toLowerCase())) {
            result.errors.push('RUT ya existe en la base de datos');
            result.isValid = false;
          }
          worker.rut = formattedRut; // Formatear RUT
        }
      }

      // Validar teléfono
      if (!worker.telefono || worker.telefono.toString().trim() === '') {
        result.warnings.push('Teléfono no especificado');
      } else {
        const phoneString = worker.telefono.toString().trim();
        if (!/^\+?56\d{8,9}$/.test(phoneString.replace(/\s/g, ''))) {
          result.warnings.push('Formato de teléfono chileno recomendado: +56XXXXXXXXX');
        }
      }

      // Validar contrato
      const validContracts = ['fijo', 'eventual', 'planta'];
      const contractString = worker.contrato ? worker.contrato.toString().toLowerCase().trim() : '';
      
      if (!contractString || !validContracts.includes(contractString)) {
        result.errors.push('Contrato debe ser: fijo, eventual o planta');
        result.isValid = false;
      } else {
        worker.contrato = contractString;
      }

      results.push(result);
    }

    console.log('📊 Resultados de validación completos:', results);
    setValidationResults(results);
    setStep('confirm');
  };

  const handleUpload = async () => {
    setUploading(true);
    const validWorkers = validationResults
      .filter(r => r.isValid)
      .map(r => ({
        nombre: r.worker.nombre.trim(),
        rut: r.worker.rut,
        telefono: r.worker.telefono.trim(),
        contrato: r.worker.contrato,
        estado: 'activo'
      }));

    const results = {
      successful: [],
      failed: []
    };

    for (const worker of validWorkers) {
      try {
        // Función para asegurar formato correcto de RUT (con guión)
        const ensureRutWithHyphen = (rut) => {
          if (!rut) return rut
          if (rut.includes('-')) return rut
          if (rut.length >= 8 && rut.length <= 9) {
            const rutNumber = rut.slice(0, -1)
            const verifierDigit = rut.slice(-1)
            return `${rutNumber}-${verifierDigit}`
          }
          return rut
        }
        
        // Asegurar que el nombre se guarde en MAYÚSCULAS y RUT con guión
        const workerForDB = {
          ...worker,
          nombre: worker.nombre.toUpperCase(),
          rut: ensureRutWithHyphen(worker.rut) // Asegurar formato con guión
        }
        
        console.log('🔧 Trabajador procesado para BD:', workerForDB)
        
        const { data, error } = await supabase
          .from('trabajadores')
          .insert([workerForDB])
          .select();

        if (error) {
          results.failed.push({
            worker,
            error: error.message
          });
        } else {
          results.successful.push(data[0]);
        }
      } catch (error) {
        results.failed.push({
          worker,
          error: error.message
        });
      }
    }

    setUploadResults(results);
    setUploading(false);
    setStep('results');

    if (results.successful.length > 0) {
      onWorkersUploaded();
    }
  };

  const handleMissingDataSubmit = (fillValues) => {
    const updatedWorkers = workers.map(worker => {
      const updatedWorker = { ...worker };
      Object.keys(fillValues).forEach(field => {
        if (!updatedWorker[field] || updatedWorker[field] === '') {
          // Aplicar valor por defecto o asignar 'fijo' si es contrato y está vacío
          if (field === 'contrato' && (!fillValues[field] || fillValues[field] === '')) {
            updatedWorker[field] = 'fijo';
          } else {
            updatedWorker[field] = fillValues[field] || '';
          }
        }
      });
      return updatedWorker;
    });
    
    setWorkers(updatedWorkers);
    setShowMissingDataModal(false);
    setMissingDataConfig(null);
    validateWorkers(updatedWorkers);
  };

  if (!isOpen) return null;

  const validCount = validationResults.filter(r => r.isValid).length;
  const invalidCount = validationResults.length - validCount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Carga Masiva de Trabajadores</h2>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'upload' && (
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-4">Seleccionar Archivo Excel</h3>
              
              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  <Download className="w-4 h-4" />
                  Descargar Plantilla Excel
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 text-gray-600 hover:text-blue-600 hover:border-blue-600 border-2 border-dashed rounded-lg transition-colors"
                >
                  Hacer clic para seleccionar archivo Excel (.xlsx o .xls)
                </button>
              </div>

              <div className="text-sm text-gray-600 text-left">
                <p className="font-medium mb-2">Formato requerido:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>nombre:</strong> Nombre completo del trabajador</li>
                  <li>• <strong>rut:</strong> RUT chileno válido (con o sin formato)</li>
                  <li>• <strong>telefono:</strong> Número de teléfono (preferiblemente +56XXXXXXXXX)</li>
                  <li>• <strong>contrato:</strong> fijo, eventual o planta</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'validate' && (
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Validando trabajadores...</p>
            </div>
          )}

          {step === 'confirm' && (
            <div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Resumen de Validación</h3>
                <div className="flex gap-6 text-sm">
                  <span className="text-green-600">✓ Válidos: {validCount}</span>
                  <span className="text-red-600">✗ Inválidos: {invalidCount}</span>
                  <span className="text-gray-600">Total: {validationResults.length}</span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3">Línea</th>
                      <th className="text-left p-3">Nombre</th>
                      <th className="text-left p-3">RUT</th>
                      <th className="text-left p-3">Estado</th>
                      <th className="text-left p-3">Errores/Advertencias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.map((result, index) => (
                      <tr key={index} className={`border-t ${result.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                        <td className="p-3">{result.worker.lineNumber}</td>
                        <td className="p-3">{result.worker.nombre}</td>
                        <td className="p-3">{result.worker.rut}</td>
                        <td className="p-3">
                          {result.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                        <td className="p-3">
                          {result.errors.map((error, i) => (
                            <div key={i} className="text-red-600 text-xs">{error}</div>
                          ))}
                          {result.warnings.map((warning, i) => (
                            <div key={i} className="text-orange-600 text-xs">{warning}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Resultados de la Carga</h3>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-6 text-sm">
                  <span className="text-green-600">✓ Exitosos: {uploadResults?.successful?.length || 0}</span>
                  <span className="text-red-600">✗ Fallidos: {uploadResults?.failed?.length || 0}</span>
                </div>
              </div>

              {uploadResults?.failed?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-600 mb-2">Trabajadores no creados:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {uploadResults.failed.map((failed, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0 bg-red-50">
                        <div className="font-medium">{failed.worker.nombre} - {failed.worker.rut}</div>
                        <div className="text-sm text-red-600">{failed.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResults?.successful?.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    ✓ Se crearon exitosamente {uploadResults.successful.length} trabajadores
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            {step === 'results' ? 'Cerrar' : 'Cancelar'}
          </button>
          
          {step === 'confirm' && (
            <button
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Subiendo...
                </>
              ) : (
                `Crear ${validCount} Trabajadores`
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal para datos faltantes */}
      {showMissingDataModal && missingDataConfig && (
        <MissingDataModal
          missingData={missingDataConfig}
          onSubmit={handleMissingDataSubmit}
          onCancel={() => {
            setShowMissingDataModal(false);
            setMissingDataConfig(null);
            setStep('upload');
          }}
        />
      )}
    </div>
  );
};

// Componente para manejar datos faltantes
const MissingDataModal = ({ missingData, onSubmit, onCancel }) => {
  const [fillValues, setFillValues] = useState({});

  const handleSubmit = () => {
    onSubmit(fillValues);
  };

  const getFieldDescription = (field, data) => {
    if (data === 'all') {
      return 'Columna no presente en el archivo';
    } else if (Array.isArray(data) && data.length > 0) {
      return `Filas con campo vacío: ${data.join(', ')}`;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold">Completar Datos Faltantes</h2>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <p className="text-gray-600 mb-4">
            Algunos campos están vacíos o no están presentes en tu archivo. Especifica valores por defecto o déjalos vacíos.
          </p>

          <div className="space-y-4">
            {Object.entries(missingData).map(([field, data]) => (
              <div key={field} className="border rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <strong>{field.toUpperCase()}</strong>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {getFieldDescription(field, data)}
                </p>
                
                {field === 'contrato' ? (
                  <select
                    value={fillValues[field] || ''}
                    onChange={(e) => setFillValues({
                      ...fillValues,
                      [field]: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar tipo de contrato...</option>
                    <option value="fijo">Fijo</option>
                    <option value="eventual">Eventual</option>
                    <option value="planta">Planta</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={
                      field === 'telefono' 
                        ? 'Ej: +56912345678 (o dejar vacío)'
                        : `Valor por defecto para ${field} (o dejar vacío)`
                    }
                    value={fillValues[field] || ''}
                    onChange={(e) => setFillValues({
                      ...fillValues,
                      [field]: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {field === 'contrato' 
                    ? 'Si no seleccionas nada, se asignará "fijo" por defecto'
                    : 'Si dejas vacío, el campo quedará sin valor'
                  }
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continuar con estos valores
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadWorkersModal;
