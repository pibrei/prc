import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Download, ArrowRight, ArrowLeft } from 'lucide-react';
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

interface DetailedError {
  rowNumber: number;
  propertyName: string;
  errorType: string;
  errorMessage: string;
  timestamp: string;
  rawData?: string;
  mappedData?: any;
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

const PropertyImportSingle: React.FC = () => {
  const { } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [detailedErrors, setDetailedErrors] = useState<DetailedError[]>([]);
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
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-properties-single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setFileAnalysis(result.data);
        setColumnMapping(result.data.suggestedMappings);
        setCurrentStep(2);
      } else {
        throw new Error(result.error || 'Failed to analyze file');
      }
    } catch (err) {
      console.error('File analysis error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao analisar arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!uploadedFile || !fileAnalysis) return;

    setIsLoading(true);
    setError(null);
    setImportResult(null);
    setDetailedErrors([]);
    setProgressData(null);

    try {
      console.log('🚀 Starting single batch import for charliefinal.csv');
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('action', 'import');
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('skipExisting', skipExisting.toString());

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-properties-single`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'progress') {
                setProgressData({
                  message: data.data.message,
                  progress: data.data.progress,
                  total: data.data.total,
                  successful: data.data.successful,
                  failed: data.data.failed,
                  skipped: data.data.skipped
                });
              } else if (data.type === 'error_detail') {
                console.error(`🚨 DETAILED ERROR - Row ${data.data.rowNumber} (${data.data.propertyName}): ${data.data.errorType} - ${data.data.errorMessage}`);
                
                setDetailedErrors(prev => [...prev, {
                  rowNumber: data.data.rowNumber,
                  propertyName: data.data.propertyName,
                  errorType: data.data.errorType,
                  errorMessage: data.data.errorMessage,
                  timestamp: data.data.timestamp
                }]);
              } else if (data.type === 'mapped_data') {
                console.log(`🗂️ Mapped data for row ${data.data.rowNumber}:`, data.data.mappedData);
              } else if (data.type === 'complete') {
                setImportResult(data);
                setProgressData({
                  message: data.message,
                  progress: data.data.total,
                  total: data.data.total,
                  successful: data.data.successful,
                  failed: data.data.failed,
                  skipped: data.data.skipped
                });
                console.log('✅ Import completed:', data);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError, 'Line:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnMappingChange = (header: string, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [header]: value
    }));
  };

  const downloadTemplate = () => {
    const csvContent = `data;equipe;cidade;bairro;propriedade;numero_placa;proprietario;telefone;rg;wifi;nome_wifi;senha_wifi;cameras;qtd_cameras;moradores;atividade;bou;observacoes;coordenadas
2025-01-09;Alpha;Curitiba;Centro;Propriedade Exemplo;ABC1234;João Silva;41999999999;123456789;Sim;WiFi_Casa;senha123;Sim;2;4;Agricultura;Rural;Observações gerais;-25.4284,-49.2733
2025-01-09;Bravo;Araucária;Rural;Fazenda Modelo;XYZ5678;Maria Santos;41888888888;987654321;Não;;;Não;0;2;Pecuária;Rural;Fazenda de gado;-25.5284,-49.3733`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_propriedades.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportErrorsToCSV = () => {
    if (detailedErrors.length === 0) return;

    const headers = [
      'Linha_CSV',
      'Nome_Propriedade', 
      'Tipo_Erro',
      'Mensagem_Erro',
      'Timestamp'
    ];
    
    const csvContent = [
      headers.join(','),
      ...detailedErrors.map(error => [
        error.rowNumber,
        `"${error.propertyName || 'N/A'}"`,
        `"${error.errorType}"`,
        `"${error.errorMessage.replace(/"/g, '""')}"`,
        `"${new Date(error.timestamp).toLocaleString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_erros_importacao_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Importar Propriedades</h1>
        <p className="text-gray-600">
          Sistema otimizado para importação em lote único - sem problemas de leitura de arquivo
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

          {isLoading && (
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Analisando arquivo...</span>
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
                      {columnMapping[header] && REQUIRED_FIELDS.includes(columnMapping[header]) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                  </div>
                  <div className="flex-1">
                    <select
                      value={columnMapping[header] || ''}
                      onChange={(e) => handleColumnMappingChange(header, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">— Selecionar campo —</option>
                      {AVAILABLE_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                          {REQUIRED_FIELDS.includes(field.value) && ' *'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32 text-xs text-gray-600">
                    {fileAnalysis.sampleData[0] && fileAnalysis.sampleData[0][index] && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {fileAnalysis.sampleData[0][index].length > 15 
                          ? `${fileAnalysis.sampleData[0][index].substring(0, 15)}...` 
                          : fileAnalysis.sampleData[0][index]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Preview Sample Data */}
          <Card className="p-6">
            <h4 className="font-medium mb-4">Preview dos Dados (Primeiras 3 linhas)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {fileAnalysis.headers.map((header, index) => (
                      <th key={index} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileAnalysis.sampleData.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2 text-gray-600">
                          {cell.length > 20 ? `${cell.substring(0, 20)}...` : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Import Options */}
          <Card className="p-6">
            <h4 className="font-medium mb-4">Opções de Importação</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Pular propriedades duplicadas (mesmo nome, coordenadas e cidade)
                </span>
              </label>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button onClick={() => setCurrentStep(1)} variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <Button onClick={handleImport} disabled={isLoading} className="flex items-center space-x-2">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Importação</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Progress Display */}
      {progressData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Progresso da Importação</h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progressData.message}</span>
              <span className="font-medium">{progressData.progress}/{progressData.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(progressData.progress / progressData.total) * 100}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              {((progressData.progress / progressData.total) * 100).toFixed(1)}% concluído
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{progressData.successful || 0}</div>
              <div className="text-sm text-green-800">Importadas</div>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{progressData.failed || 0}</div>
              <div className="text-sm text-red-800">Falhas</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{progressData.skipped || 0}</div>
              <div className="text-sm text-yellow-800">Puladas</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{progressData.total}</div>
              <div className="text-sm text-blue-800">Total</div>
            </div>
          </div>
        </Card>
      )}

      {/* Results Display */}
      {importResult && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resultado da Importação</h3>
            
            <div className={`p-4 rounded-lg mb-6 flex items-center space-x-3 ${
              importResult.success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <CheckCircle className={`h-6 w-6 ${importResult.success ? 'text-green-600' : 'text-yellow-600'}`} />
              <p className={`font-medium ${importResult.success ? 'text-green-800' : 'text-yellow-800'}`}>
                {importResult.message}
              </p>
            </div>

            {importResult.data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{importResult.data.successful}</div>
                  <div className="text-sm text-green-800 font-medium">Importadas</div>
                  <div className="text-xs text-green-600 mt-1">
                    {importResult.data.total > 0 && `${((importResult.data.successful / importResult.data.total) * 100).toFixed(1)}%`}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">{importResult.data.failed}</div>
                  <div className="text-sm text-red-800 font-medium">Falhas</div>
                  <div className="text-xs text-red-600 mt-1">
                    {importResult.data.total > 0 && `${((importResult.data.failed / importResult.data.total) * 100).toFixed(1)}%`}
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{importResult.data.skipped || 0}</div>
                  <div className="text-sm text-yellow-800 font-medium">Puladas</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    {importResult.data.total > 0 && `${(((importResult.data.skipped || 0) / importResult.data.total) * 100).toFixed(1)}%`}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{importResult.data.total}</div>
                  <div className="text-sm text-blue-800 font-medium">Total</div>
                  <div className="text-xs text-blue-600 mt-1">processadas</div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button 
                onClick={() => {
                  setCurrentStep(1);
                  setUploadedFile(null);
                  setFileAnalysis(null);
                  setImportResult(null);
                  setDetailedErrors([]);
                  setProgressData(null);
                  setError(null);
                }}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Nova Importação</span>
              </Button>
              
              {detailedErrors.length > 0 && (
                <Button 
                  onClick={exportErrorsToCSV}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar Erros ({detailedErrors.length})</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Errors */}
      {detailedErrors.length > 0 && !importResult && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-red-800">
              Erros Detalhados ({detailedErrors.length})
            </h3>
            <Button onClick={exportErrorsToCSV} variant="outline" size="sm" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar Erros</span>
            </Button>
          </div>
          
          <div className="max-h-80 overflow-y-auto space-y-3">
            {detailedErrors.slice(0, 20).map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                      Linha {error.rowNumber}
                    </span>
                    <span className="font-medium text-red-900">{error.propertyName}</span>
                  </div>
                  <span className="text-xs text-red-500">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="inline-block bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium mr-2">
                    {error.errorType}
                  </span>
                  <span className="text-red-700">{error.errorMessage}</span>
                </div>
              </div>
            ))}
            {detailedErrors.length > 20 && (
              <div className="text-center py-3 border-t border-red-200">
                <p className="text-sm text-red-600">
                  Mostrando primeiros 20 erros de {detailedErrors.length} total
                </p>
                <Button 
                  onClick={exportErrorsToCSV} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  Ver todos os erros (CSV)
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PropertyImportSingle;