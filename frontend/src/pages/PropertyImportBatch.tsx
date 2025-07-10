import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Download, Clock } from 'lucide-react';
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

interface BatchResult {
  success: boolean;
  message: string;
  data: {
    successful: number;
    failed: number;
    skipped: number;
    total: number;
    errors: string[];
    batchInfo: {
      batchNumber: number;
      batchSize: number;
      totalRows: number;
      startIndex: number;
      endIndex: number;
      isLastBatch: boolean;
    };
  };
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

const PropertyImportBatch: React.FC = () => {
  const { } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  
  // Batch processing states
  const [batchSize] = useState(50); // Fixed batch size for timeout safety
  const [totalBatches, setTotalBatches] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallStats, setOverallStats] = useState({
    successful: 0,
    failed: 0,
    skipped: 0,
    total: 0
  });

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
      
      const { data, error } = await supabase.functions.invoke('import-properties-complete', {
        body: formData,
      });

      if (error) throw error;

      if (data.success) {
        setFileAnalysis(data.data);
        setColumnMapping(data.data.suggestedMappings || {});
        
        // Calculate number of batches needed
        const totalRows = data.data.totalRows;
        const batches = Math.ceil(totalRows / batchSize);
        setTotalBatches(batches);
        
        setCurrentStep(2);
      } else {
        setError(data.error || 'Análise do arquivo falhou');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  const processBatch = async (batchNumber: number): Promise<BatchResult> => {
    console.log(`🚀 Processing batch ${batchNumber}/${totalBatches}`);
    
    const formData = new FormData();
    formData.append('file', uploadedFile!);
    formData.append('action', 'import');
    formData.append('columnMapping', JSON.stringify(columnMapping));
    formData.append('skipExisting', skipExisting.toString());
    formData.append('batchNumber', batchNumber.toString());
    formData.append('batchSize', batchSize.toString());

    const { data, error } = await supabase.functions.invoke('import-properties-batch', {
      body: formData,
    });

    if (error) throw error;
    
    return data;
  };

  const importProperties = async () => {
    setIsProcessing(true);
    setCurrentBatch(0);
    setBatchResults([]);
    setOverallStats({ successful: 0, failed: 0, skipped: 0, total: 0 });
    setError(null);

    try {
      let allSuccessful = 0;
      let allFailed = 0;
      let allSkipped = 0;
      let allTotal = 0;

      for (let batch = 1; batch <= totalBatches; batch++) {
        setCurrentBatch(batch);
        console.log(`📦 Processing batch ${batch}/${totalBatches}`);
        
        try {
          const result = await processBatch(batch);
          setBatchResults(prev => [...prev, result]);
          
          if (result.success) {
            allSuccessful += result.data.successful;
            allFailed += result.data.failed;
            allSkipped += result.data.skipped;
            allTotal += result.data.total;
            
            setOverallStats({
              successful: allSuccessful,
              failed: allFailed,
              skipped: allSkipped,
              total: allTotal
            });
            
            console.log(`✅ Batch ${batch} completed: ${result.data.successful}/${result.data.total} successful`);
          } else {
            console.error(`❌ Batch ${batch} failed:`, result.message);
            setError(`Batch ${batch} falhou: ${result.message}`);
            break;
          }
        } catch (batchError) {
          console.error(`💥 Batch ${batch} error:`, batchError);
          setError(`Erro no batch ${batch}: ${batchError instanceof Error ? batchError.message : 'Erro desconhecido'}`);
          break;
        }
        
        // Small delay between batches to prevent rate limiting
        if (batch < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setCurrentStep(3);
      console.log(`🎉 Import completed! Total: ${allSuccessful}/${allTotal} successful`);
      
    } catch (error) {
      console.error('💥 Import failed:', error);
      setError(error instanceof Error ? error.message : 'Importação falhou');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setFileAnalysis(null);
    setColumnMapping({});
    setError(null);
    setBatchResults([]);
    setCurrentBatch(0);
    setOverallStats({ successful: 0, failed: 0, skipped: 0, total: 0 });
  };

  const downloadTemplate = () => {
    const headers = [
      'Data', 'Equipe', 'Cidade', 'Bairro', 'Propriedade', 'Latitude', 'Longitude',
      'Proprietário', 'Telefone Proprietário', 'RG Proprietário', 'Nome Contato',
      'Telefone Contato', 'Observações Contato', 'Observações', 'Atividade',
      'Câmeras', 'Quantidade Câmeras', 'WiFi', 'Senha WiFi', 'Latitude,Longitude'
    ];
    
    const csvContent = headers.join(',') + '\\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_propriedades.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const progress = currentBatch > 0 ? (currentBatch / totalBatches) * 100 : 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Importação em Lotes - Propriedades
        </h1>
        <p className="text-gray-600">
          Sistema otimizado para importar grandes volumes sem timeout ({batchSize} propriedades por lote)
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-1 mx-2 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <Card className="p-6">
          <div className="text-center">
            <div className="mb-4">
              <Button variant="outline" onClick={downloadTemplate} className="mb-4">
                <Download className="h-4 w-4 mr-2" />
                Baixar Template CSV
              </Button>
            </div>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arrastar arquivo CSV ou clicar para selecionar'}
              </p>
              <p className="text-sm text-gray-600">
                Arquivo CSV com propriedades (máximo 10MB)
              </p>
            </div>

            {uploadedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center">
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="mt-4 text-center">
                <Clock className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Analisando arquivo...</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {currentStep === 2 && fileAnalysis && (
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Mapeamento de Colunas</h3>
            <div className="text-sm text-gray-600 mb-4">
              📊 Arquivo: <strong>{fileAnalysis.totalRows} propriedades</strong> | 
              📦 Batches necessários: <strong>{totalBatches}</strong> ({batchSize} por lote)
            </div>
            
            <div className="space-y-4">
              {fileAnalysis.headers.map((header, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {header}
                    </label>
                  </div>
                  <div className="w-2/3">
                    <select
                      value={columnMapping[header] || ''}
                      onChange={(e) => setColumnMapping(prev => ({
                        ...prev,
                        [header]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Não mapear</option>
                      {AVAILABLE_FIELDS.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Pular propriedades já existentes (mesmo nome e coordenadas)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={importProperties} disabled={isLoading}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Iniciar Importação em Lotes
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && (
        <Card className="p-6">
          <div className="text-center mb-6">
            {isProcessing ? (
              <div>
                <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">
                  Processando Lote {currentBatch}/{totalBatches}
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-gray-600">
                  {progress.toFixed(1)}% concluído
                </p>
              </div>
            ) : (
              <div>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Importação Concluída!
                </h3>
              </div>
            )}
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{overallStats.successful}</div>
              <div className="text-sm text-green-600">Sucesso</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-800">{overallStats.failed}</div>
              <div className="text-sm text-red-600">Falhas</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-800">{overallStats.skipped}</div>
              <div className="text-sm text-yellow-600">Ignoradas</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{overallStats.total}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
          </div>

          {/* Batch Details */}
          {batchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-2">Detalhes por Lote:</h4>
              {batchResults.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Lote {result.data.batchInfo.batchNumber} 
                      (linhas {result.data.batchInfo.startIndex}-{result.data.batchInfo.endIndex})
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.data.successful}/{result.data.total} OK
                    </span>
                  </div>
                  {result.data.errors.length > 0 && (
                    <div className="mt-2 text-red-600">
                      {result.data.errors.slice(0, 3).map((error, i) => (
                        <div key={i} className="truncate">• {error}</div>
                      ))}
                      {result.data.errors.length > 3 && (
                        <div>... e mais {result.data.errors.length - 3} erros</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <Button onClick={resetImport}>
              Fazer Nova Importação
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PropertyImportBatch;