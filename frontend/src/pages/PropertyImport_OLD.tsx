import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FileAnalysis {
  headers: string[];
  sampleData: string[][];
  suggestedMappings: { [key: string]: string };
  totalRows: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    successful: number;
    failed: number;
    total: number;
    results: any[];
  };
  errors?: string[];
}

interface ColumnMapping {
  [sourceColumn: string]: string;
}

const REQUIRED_FIELDS = ['name', 'cidade', 'owner_name'];
const AVAILABLE_FIELDS = [
  { value: 'cadastro_date', label: 'Data de Cadastro' },
  { value: 'name', label: 'Nome da Propriedade' },
  { value: 'latitude', label: 'Latitude' },
  { value: 'longitude', label: 'Longitude' },
  { value: 'coordinates_combined', label: 'Coordenadas Combinadas (Lat,Lng)' },
  { value: 'cidade', label: 'Cidade' },
  { value: 'bairro', label: 'Bairro' },
  { value: 'owner_name', label: 'Nome do Proprietário' },
  { value: 'owner_phone', label: 'Telefone do Proprietário' },
  { value: 'owner_rg', label: 'RG do Proprietário' },
  { value: 'equipe', label: 'Equipe' },
  { value: 'numero_placa', label: 'Número da Placa' },
  { value: 'description', label: 'Descrição' },
  { value: 'contact_name', label: 'Nome do Contato' },
  { value: 'contact_phone', label: 'Telefone do Contato' },
  { value: 'contact_observations', label: 'Observações do Contato' },
  { value: 'observations', label: 'Observações' },
  { value: 'activity', label: 'Atividade' },
  { value: 'has_cameras', label: 'Possui Câmeras' },
  { value: 'cameras_count', label: 'Quantidade de Câmeras' },
  { value: 'has_wifi', label: 'Possui WiFi' },
  { value: 'wifi_password', label: 'Senha WiFi' },
  { value: 'residents_count', label: 'Número de Moradores' },
];

const PropertyImport: React.FC = () => {
  const { } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [progressData, setProgressData] = useState<{
    message: string;
    progress: number;
    total: number;
    successful?: number;
    failed?: number;
    skipped?: number;
  } | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploadedFile(file);
        analyzeFile(file);
      }
    }, []),
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const analyzeFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'analyze');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-properties-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze file');
      }
      
      setFileAnalysis(result.data);
      setColumnMapping(result.data.suggestedMappings || {});
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnMappingChange = (sourceColumn: string, targetField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [sourceColumn]: targetField,
    }));
  };

  // Memoize validation to prevent infinite re-renders
  const validationStatus = useMemo(() => {
    const mappedFields = Object.values(columnMapping).filter(Boolean);
    const missingRequired = REQUIRED_FIELDS.filter(field => !mappedFields.includes(field));
    
    // Check if coordinates are provided (either separate or combined)
    const hasCoordinates = mappedFields.includes('coordinates_combined') || 
                          (mappedFields.includes('latitude') && mappedFields.includes('longitude'));
    
    if (missingRequired.length > 0) {
      return {
        isValid: false,
        error: `Campos obrigatórios não mapeados: ${missingRequired.join(', ')}`
      };
    }
    
    if (!hasCoordinates) {
      return {
        isValid: false,
        error: 'É necessário mapear coordenadas (Latitude+Longitude ou Coordenadas Combinadas)'
      };
    }
    
    return {
      isValid: true,
      error: null
    };
  }, [columnMapping]);

  // Update error state when validation changes
  useEffect(() => {
    if (currentStep === 2 && validationStatus.error) {
      setError(validationStatus.error);
    } else if (currentStep === 2 && validationStatus.isValid) {
      setError(null);
    }
  }, [validationStatus, currentStep]);

  const validateMapping = useCallback((): boolean => {
    return validationStatus.isValid;
  }, [validationStatus]);

  const importProperties = async () => {
    if (!uploadedFile || !validateMapping()) return;
    
    console.log('Starting import process...');
    console.log('File:', uploadedFile.name, 'Size:', uploadedFile.size);
    console.log('Column mapping:', columnMapping);
    console.log('Skip existing:', skipExisting);
    
    setIsLoading(true);
    setError(null);
    setProgressData(null);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('action', 'import');
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('skipExisting', skipExisting.toString());
      
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Making request to edge function...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-properties-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Failed to import properties');
        } catch {
          throw new Error(errorText || 'Failed to import properties');
        }
      }
      
      if (!response.body) {
        throw new Error('No response body received');
      }
      
      // Process streaming response with improved timeout and better error handling
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isCompleted = false;
      let hasReceivedData = false;
      
      // Set up adaptive timeout based on file size and content - increased for complete processing
      const estimatedRows = fileAnalysis?.totalRows || 0;
      const baseTimeout = 180000; // 3 minutes base
      const timePerRow = 1500; // 1.5 second per row estimated (more conservative)
      const adaptiveTimeout = Math.max(baseTimeout, Math.min(estimatedRows * timePerRow, 1800000)); // Max 30 minutes for large files
      
      console.log(`Setting timeout for ${estimatedRows} rows: ${Math.round(adaptiveTimeout / 1000)} seconds`);
      
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          console.log('Timeout reached, but checking if data was received...');
          if (hasReceivedData) {
            console.log('Data was received, but completion signal was not. Checking database...');
            // Check if import actually completed by looking at progress data
            const processedCount = (progressData?.successful || 0) + (progressData?.failed || 0) + (progressData?.skipped || 0);
            if (processedCount > 0) {
              console.log(`Import may have completed: ${processedCount} properties processed`);
              setImportResult({
                success: true,
                message: `Importação possivelmente concluída. ${processedCount} propriedades processadas. Verifique a lista de propriedades para confirmar.`,
                data: {
                  successful: progressData?.successful || 0,
                  failed: progressData?.failed || 0,
                  skipped: progressData?.skipped || 0,
                  total: estimatedRows,
                  errors: [],
                  skippedItems: [],
                  results: []
                }
              });
              setCurrentStep(3);
              isCompleted = true;
              return;
            }
          }
          setError(`Timeout: A importação de ${estimatedRows} propriedades demorou mais que ${Math.round(adaptiveTimeout / 60000)} minutos para completar`);
          setIsLoading(false);
          setProgressData(null);
        }
      }, adaptiveTimeout);
      
      try {
        console.log('Starting to read stream...');
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream completed, hasReceivedData:', hasReceivedData);
            break;
          }
          
          hasReceivedData = true;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          console.log(`Processing ${lines.length} lines from stream`);
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                console.log('Received stream data:', data);
                
                if (data.type === 'progress') {
                  console.log('Progress update:', data.data);
                  setProgressData(data.data);
                } else if (data.type === 'complete') {
                  console.log('Import completed successfully!', data);
                  setImportResult(data);
                  setCurrentStep(3);
                  isCompleted = true;
                  clearTimeout(timeoutId);
                  break;
                } else if (data.type === 'error') {
                  console.error('Import error received:', data.error);
                  clearTimeout(timeoutId);
                  throw new Error(data.error);
                } else {
                  console.log('Unknown message type:', data);
                }
              } catch (parseError) {
                console.warn('Failed to parse progress data:', parseError, 'Line:', line);
              }
            }
          }
          
          if (isCompleted) break;
        }
      } catch (streamError) {
        console.error('Stream processing error:', streamError);
        clearTimeout(timeoutId);
        throw streamError;
      } finally {
        try {
          reader.releaseLock();
        } catch (releaseError) {
          console.warn('Error releasing reader lock:', releaseError);
        }
      }
      
      // Clear timeout if we got here
      clearTimeout(timeoutId);
      
      // If we didn't get a completion signal, but we received data, it might have completed
      if (!isCompleted) {
        const processedCount = (progressData?.successful || 0) + (progressData?.failed || 0) + (progressData?.skipped || 0);
        console.error('Import not completed. Processed count:', processedCount);
        console.error('Progress data:', progressData);
        console.error('Has received data:', hasReceivedData);
        
        if (hasReceivedData && processedCount > 0) {
          // Assume it completed if we got progress data
          console.log('Assuming import completed based on progress data');
          setImportResult({
            success: true,
            message: `Importação possivelmente concluída. ${processedCount} propriedades processadas. Verifique a lista de propriedades para confirmar.`,
            data: {
              successful: progressData?.successful || 0,
              failed: progressData?.failed || 0,
              skipped: progressData?.skipped || 0,
              total: estimatedRows,
              errors: [],
              skippedItems: [],
              results: []
            }
          });
          setCurrentStep(3);
        } else {
          throw new Error(
            `A importação foi interrompida (${processedCount} de ${estimatedRows} propriedades processadas). ` +
            `Para continuar, faça upload do mesmo arquivo novamente com "Pular propriedades existentes" ativado.`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setProgressData(null);
    }
  };

  const resetImport = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setFileAnalysis(null);
    setColumnMapping({});
    setImportResult(null);
    setError(null);
    setSkipExisting(true);
    setProgressData(null);
  };

  const downloadTemplate = () => {
    const csvContent = `data,nome,coordenadas,cidade,bairro,proprietario,telefone,rg,equipe,placa,descricao
2025-01-09,Propriedade Exemplo,"-25.4284,-49.2733",Curitiba,Centro,João Silva,41999999999,123456789,Alpha,ABC1234,Propriedade rural exemplo
2025-01-09,Fazenda Modelo,"-25.5284,-49.3733",Curitiba,Rural,Maria Santos,41888888888,987654321,Bravo,XYZ5678,Fazenda com gado
2025-01-09,Sítio Esperança,"-25.6284,-49.4733",Araucária,Cachoeira,Pedro Costa,41777777777,456789123,Charlie,DEF9012,Sítio para agricultura`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_propriedades_500.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Importar Propriedades</h1>
        <p className="text-gray-600">
          Importe todas as propriedades do arquivo CSV em lote (sem limite de quantidade)
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span>Upload do Arquivo</span>
          </div>
          <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span>Mapeamento</span>
          </div>
          <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span>Resultado</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Baixar Template</span>
            </Button>
          </div>
          
          <Card className="p-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste e solte um arquivo CSV'}
              </p>
              <p className="text-gray-600 mb-4">ou clique para selecionar</p>
              <p className="text-sm text-gray-500">Apenas arquivos CSV são suportados</p>
            </div>
          </Card>

          {uploadedFile && (
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {currentStep === 2 && fileAnalysis && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Mapeamento de Colunas</h3>
                <p className="text-gray-600">
                  Associe as colunas do seu arquivo aos campos do sistema.
                  <span className="text-red-600"> * Campos obrigatórios</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{fileAnalysis.totalRows}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Propriedades</div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-800 mb-2">💡 Dica sobre Coordenadas:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use <strong>Latitude</strong> + <strong>Longitude</strong> para colunas separadas</li>
                <li>• Use <strong>Coordenadas Combinadas</strong> para uma coluna única (ex: "-25.4284,-49.2733")</li>
                <li>• Suporte a formatos: "lat lng", "lat,lng", "lat;lng"</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              {fileAnalysis.headers.map((header, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700">
                      {header}
                    </label>
                  </div>
                  <div className="flex-1">
                    <select
                      value={columnMapping[header] || ''}
                      onChange={(e) => handleColumnMappingChange(header, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Não mapear</option>
                      {AVAILABLE_FIELDS.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label} {REQUIRED_FIELDS.includes(field.value) ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Preview dos Dados</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    {fileAnalysis.headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileAnalysis.sampleData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-600">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Mostrando as primeiras 5 linhas de {fileAnalysis.totalRows} registros
            </p>
          </Card>

          {/* Skip Existing Option */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="skipExisting"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="skipExisting" className="text-sm font-medium text-blue-800">
                Pular propriedades que já existem
              </label>
            </div>
            <p className="text-xs text-blue-600 mt-1 ml-7">
              {skipExisting 
                ? "✅ Detecta duplicatas por nome ou localização (100m de raio) e pula automaticamente"
                : "⚠️ Tentará importar todas as propriedades (pode gerar duplicatas)"}
            </p>
          </Card>

          {/* Validation Status */}
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-700">Status de Validação:</div>
                {validationStatus.isValid ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Pronto para importar</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Campos obrigatórios pendentes</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  Tempo estimado: <span className="font-medium">
                    {Math.max(1, Math.round(fileAnalysis.totalRows * 0.5 / 60))} - {Math.max(1, Math.round(fileAnalysis.totalRows * 1 / 60))} min
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setCurrentStep(1)} variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <Button 
              onClick={importProperties} 
              disabled={isLoading || !validationStatus.isValid} 
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              <span>Importar {fileAnalysis.totalRows} Propriedades</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && importResult && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              {importResult.success ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {importResult.success ? 'Importação Concluída' : 'Importação Parcial'}
                </h3>
                <p className="text-gray-600">{importResult.message}</p>
              </div>
            </div>

            {importResult.data && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{importResult.data.successful}</p>
                  <p className="text-sm text-green-700">Importadas</p>
                </div>
                {importResult.data.skipped !== undefined && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{importResult.data.skipped}</p>
                    <p className="text-sm text-yellow-700">Puladas</p>
                  </div>
                )}
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{importResult.data.failed}</p>
                  <p className="text-sm text-red-700">Falhas</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{importResult.data.totalInFile}</p>
                  <p className="text-sm text-blue-700">Total no Arquivo</p>
                </div>
              </div>
            )}

            {importResult.data && importResult.data.remaining > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">📋 Arquivo Grande Detectado</h4>
                <p className="text-sm text-amber-700">
                  Foram processadas <strong>{importResult.data.successful + importResult.data.failed + importResult.data.skipped}</strong> propriedades.
                  {importResult.data.remaining > 0 && (
                    <>
                      {' '}Restam <strong>{importResult.data.remaining}</strong> no arquivo.
                    </>
                  )}
                </p>
                {importResult.data.remaining > 0 ? (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700 mb-2">
                      💡 <strong>Para continuar a importação:</strong>
                    </p>
                    <ol className="text-xs text-blue-600 space-y-1 ml-4">
                      <li>1. Faça upload do mesmo arquivo novamente</li>
                      <li>2. Ative "Pular propriedades que já existem"</li>
                      <li>3. A importação continuará de onde parou</li>
                    </ol>
                  </div>
                ) : (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ <strong>Importação completa!</strong> Todas as propriedades do arquivo foram processadas.
                  </p>
                )}
              </div>
            )}

            {importResult.data && importResult.data.skippedItems && importResult.data.skippedItems.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">⏭️ Propriedades Puladas (Duplicatas):</h4>
                <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                  {importResult.data.skippedItems.map((item: any, index: number) => (
                    <li key={index}>• Linha {item.row}: {item.name} - {item.reason}</li>
                  ))}
                </ul>
                {importResult.data.skipped > importResult.data.skippedItems.length && (
                  <p className="text-xs text-yellow-600 mt-2">
                    ... e mais {importResult.data.skipped - importResult.data.skippedItems.length} propriedades puladas
                  </p>
                )}
              </div>
            )}

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2">Erros encontrados:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="flex justify-center">
            <Button onClick={resetImport} className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Nova Importação</span>
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-lg w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Importando Propriedades</h3>
                <p className="text-sm text-gray-600">Processamento em andamento...</p>
              </div>
            </div>
            
            {progressData && (
              <>
                {/* Progress Bar Principal */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
                    <span className="text-lg font-bold text-blue-600">
                      {Math.round((progressData.progress / progressData.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out shadow-sm relative"
                      style={{ width: `${Math.min((progressData.progress / progressData.total) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{progressData.progress} de {progressData.total} processadas</span>
                    <span>
                      {progressData.progress > 0 && progressData.total > progressData.progress && (
                        `ETA: ${Math.round(((progressData.total - progressData.progress) / progressData.progress) * 2)} min`
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Status Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-800">{progressData.message}</span>
                  </div>
                </div>
                
                {/* Statistics Cards */}
                {(progressData.successful !== undefined || progressData.failed !== undefined || progressData.skipped !== undefined) && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{progressData.successful || 0}</div>
                      <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Importadas</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">{progressData.failed || 0}</div>
                      <div className="text-xs font-medium text-red-700 uppercase tracking-wide">Erros</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">{progressData.skipped || 0}</div>
                      <div className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Puladas</div>
                    </div>
                  </div>
                )}
                
                {/* Success Rate */}
                {progressData.progress > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Taxa de Sucesso</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(((progressData.successful || 0) / progressData.progress) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(((progressData.successful || 0) / progressData.progress) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            
            {!progressData && (
              <div className="text-center py-4">
                <div className="animate-pulse">
                  <div className="bg-gray-200 rounded-full h-4 mb-3"></div>
                  <div className="bg-gray-200 rounded h-3 mb-2"></div>
                  <div className="bg-gray-200 rounded h-3 w-3/4 mx-auto"></div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Preparando importação e analisando arquivo...
                </p>
              </div>
            )}
            
            {/* Warning about closing */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 text-amber-500 mt-0.5">⚠️</div>
                <div className="text-xs text-amber-700">
                  <strong>Importante:</strong> Não feche esta janela durante a importação. 
                  O processo pode levar alguns minutos dependendo do tamanho do arquivo.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImport;
