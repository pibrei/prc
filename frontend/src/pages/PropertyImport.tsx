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

  // Helper function to create a CSV with only the batch rows
  const createBatchCSV = async (batchNumber: number, batchSize: number = 50): Promise<File> => {
    const text = await uploadedFile!.text();
    const lines = text.split('\n');
    
    // Get header
    const header = lines[0];
    
    // Calculate batch boundaries
    const startIndex = (batchNumber - 1) * batchSize + 1; // +1 to skip header
    const endIndex = Math.min(startIndex + batchSize, lines.length);
    
    // Get batch lines
    const batchLines = [header, ...lines.slice(startIndex, endIndex)];
    const batchCSV = batchLines.join('\n');
    
    // Create a new File object for this batch
    return new File([batchCSV], `batch_${batchNumber}_${uploadedFile!.name}`, {
      type: 'text/csv'
    });
  };

  // Helper function to process a single batch using the working Edge Function
  const processBatch = async (batchNumber: number, batchSize: number = 50) => {
    console.log(`📦 Processing batch ${batchNumber} with size ${batchSize}`);
    
    try {
      // Create a CSV file with only this batch's data
      const batchFile = await createBatchCSV(batchNumber, batchSize);
      
      const formData = new FormData();
      formData.append('file', batchFile);
      formData.append('action', 'import');
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('skipExisting', skipExisting.toString());
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use the working Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-properties-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Batch ${batchNumber} failed: ${errorText}`);
      }
      
      // For the old Edge Function, we need to process the streaming response
      let result = {
        success: false,
        data: { successful: 0, failed: 0, skipped: 0, total: batchSize }
      };
      
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        // Read the stream to get the final result
        try {
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
                  console.log(`📡 Batch ${batchNumber} stream data:`, data);
                  
                  if (data.type === 'progress') {
                    console.log(`📊 Batch ${batchNumber} progress:`, data.data);
                    
                    // Update progress bar with chunk information if available
                    if (data.data.currentChunk && data.data.totalChunks) {
                      setProgressData(prev => prev ? {
                        ...prev,
                        message: `Lote ${batchNumber}: ${data.data.message} (Chunk ${data.data.currentChunk}/${data.data.totalChunks})`,
                        progress: data.data.progress || prev.progress,
                        successful: data.data.successful || prev.successful,
                        failed: data.data.failed || prev.failed,
                        skipped: data.data.skipped || prev.skipped
                      } : null);
                    }
                  } else if (data.type === 'error_detail') {
                    // CRITICAL: Display detailed error immediately
                    console.error(`🚨 BATCH ${batchNumber} DETAILED ERROR - Row ${data.data.rowNumber} (${data.data.propertyName}): ${data.data.errorType} - ${data.data.errorMessage}`);
                    
                    // Store detailed error for UI display
                    setDetailedErrors(prev => [...prev, {
                      rowNumber: data.data.rowNumber,
                      propertyName: data.data.propertyName,
                      errorType: data.data.errorType,
                      errorMessage: data.data.errorMessage,
                      timestamp: data.data.timestamp
                    }]);
                  } else if (data.type === 'row_processing') {
                    // Show which row is being processed
                    console.log(`🔄 Batch ${batchNumber} Processing Row ${data.data.rowNumber}/${data.data.totalRows}: ${data.data.rawData}`);
                    
                    // Store raw data for potential error context
                    setDetailedErrors(prev => prev.map(err => 
                      err.rowNumber === data.data.rowNumber && !err.rawData 
                        ? { ...err, rawData: data.data.rawData }
                        : err
                    ));
                  } else if (data.type === 'mapped_data') {
                    // Show mapped data for debugging
                    console.log(`🗂️ Batch ${batchNumber} Mapped Row ${data.data.rowNumber}:`, data.data.mappedData);
                    
                    // Store mapped data for potential error context  
                    setDetailedErrors(prev => prev.map(err => 
                      err.rowNumber === data.data.rowNumber && !err.mappedData 
                        ? { ...err, mappedData: data.data.mappedData }
                        : err
                    ));
                  } else if (data.type === 'complete') {
                    console.log(`✅ Batch ${batchNumber} completed:`, data);
                    result = {
                      success: data.success || data.data?.successful > 0,
                      data: data.data || { successful: 0, failed: 0, skipped: 0, total: batchSize }
                    };
                  }
                } catch (e) {
                  console.warn(`⚠️ Batch ${batchNumber} JSON parse error:`, e, 'Line:', line);
                }
              }
            }
          }
        } catch (streamError) {
          console.warn(`Stream error in batch ${batchNumber}:`, streamError);
        }
      }
      
      console.log(`✅ Batch ${batchNumber} result:`, result);
      return result;
      
    } catch (error) {
      console.error(`💥 Batch ${batchNumber} error:`, error);
      return {
        success: false,
        data: { successful: 0, failed: batchSize, skipped: 0, total: batchSize },
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const importProperties = async () => {
    if (!uploadedFile || !validateMapping()) return;
    
    console.log('🚀 Starting BATCH import process...');
    console.log('📁 File:', uploadedFile.name, 'Size:', uploadedFile.size);
    console.log('🗂️ Column mapping:', columnMapping);
    console.log('⏭️ Skip existing:', skipExisting);
    
    setIsLoading(true);
    setError(null);
    setProgressData(null);
    setDetailedErrors([]);
    
    try {
      // First, analyze the CSV to determine number of batches needed
      const { data: { session } } = await supabase.auth.getSession();
      
      // First, analyze the CSV to understand potential issues
      console.log('🔍 Analyzing CSV for potential issues...');
      const analysisFormData = new FormData();
      analysisFormData.append('file', uploadedFile);
      
      try {
        const analysisResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-csv`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: analysisFormData,
        });
        
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          console.log('📊 CSV Analysis Results:', analysisData);
          console.log(`📈 Projected success rate: ${analysisData.summary.projectedSuccessRate}%`);
          console.log(`📉 Projected failures: ${analysisData.summary.projectedFailures}`);
          
          let totalRows = 0;
          if (analysisData.summary && analysisData.summary.totalRows) {
            totalRows = analysisData.summary.totalRows;
            console.log(`📊 Total rows to process: ${totalRows}`);
            
            // Dynamic batch size based on file size
            const batchSize = totalRows > 300 ? 25 : 50; // Smaller batches for large files
            const totalBatches = Math.ceil(totalRows / batchSize);
            console.log(`📦 Will process in ${totalBatches} batches of ${batchSize} properties each`);
            console.log(`🎯 Optimized for ${totalRows > 300 ? 'HIGH VOLUME' : 'STANDARD'} processing`);
            
            // Initialize progress tracking for batch processing
            setProgressData({
              message: `Preparando importação em ${totalBatches} lotes...`,
              progress: 0,
              total: totalRows,
              successful: 0,
              failed: 0,
              skipped: 0
            });
          }
        }
      } catch (err) {
        console.warn('⚠️ CSV analysis failed, proceeding with import:', err);
      }
      
      // BATCH PROCESSING IMPLEMENTATION
      console.log('📡 Starting batch processing...');
      
      // Calculate batches from analysis or estimate from file  
      let totalRows = 0;
      let dynamicBatchSize = 50; // Default batch size
      
      try {
        const batchAnalysisResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-csv`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: analysisFormData,
        });
        
        if (batchAnalysisResponse.ok) {
          const analysisData = await batchAnalysisResponse.json();
          totalRows = analysisData.summary?.totalRows || 0;
          
          // Adjust batch size for high volume processing
          dynamicBatchSize = totalRows > 300 ? 25 : 50;
          console.log(`🎯 Detected ${totalRows} rows - Using ${totalRows > 300 ? 'HIGH VOLUME' : 'STANDARD'} mode`);
        }
      } catch (err) {
        console.warn('Could not get exact row count, estimating...');
        // Estimate from file size (rough estimate: ~130 bytes per row)
        totalRows = Math.max(Math.floor(uploadedFile.size / 130), 50);
        dynamicBatchSize = totalRows > 300 ? 25 : 50;
      }
      
      const batchSize = dynamicBatchSize;
      const totalBatches = Math.ceil(totalRows / batchSize);
      
      console.log(`📊 Processing ${totalRows} rows in ${totalBatches} batches of ${batchSize} each`);
      
      // Show high volume warning if needed
      if (totalRows > 300) {
        setProgressData({
          message: `⚡ Modo de Alto Volume Ativado! Processando ${totalRows} propriedades em ${totalBatches} lotes de ${batchSize}...`,
          progress: 0,
          total: totalRows,
          successful: 0,
          failed: 0,
          skipped: 0
        });
        
        // Small delay to show the message
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      let totalSuccessful = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      
      // Process each batch sequentially
      for (let batch = 1; batch <= totalBatches; batch++) {
        try {
          console.log(`🔄 Processing batch ${batch}/${totalBatches}...`);
          
          // Update progress
          setProgressData({
            message: `Processando lote ${batch}/${totalBatches}...`,
            progress: Math.floor(((batch - 1) / totalBatches) * totalRows),
            total: totalRows,
            successful: totalSuccessful,
            failed: totalFailed,
            skipped: totalSkipped
          });
          
          const batchResult = await processBatch(batch, batchSize);
          
          if (batchResult.success && batchResult.data) {
            totalSuccessful += batchResult.data.successful || 0;
            totalFailed += batchResult.data.failed || 0;
            totalSkipped += batchResult.data.skipped || 0;
            
            console.log(`✅ Batch ${batch}: ${batchResult.data.successful}/${batchResult.data.total} successful`);
          } else {
            console.error(`❌ Batch ${batch} failed:`, batchResult.message);
            totalFailed += batchSize; // Assume all failed if batch failed
          }
          
          // Update progress after batch
          setProgressData({
            message: `Lote ${batch}/${totalBatches} concluído`,
            progress: Math.floor((batch / totalBatches) * totalRows),
            total: totalRows,
            successful: totalSuccessful,
            failed: totalFailed,
            skipped: totalSkipped
          });
          
          // Small delay between batches to prevent rate limiting
          if (batch < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (batchError) {
          console.error(`💥 Batch ${batch} error:`, batchError);
          totalFailed += batchSize;
          
          // Continue with next batch even if one fails
          setProgressData({
            message: `Lote ${batch}/${totalBatches} falhou, continuando...`,
            progress: Math.floor((batch / totalBatches) * totalRows),
            total: totalRows,
            successful: totalSuccessful,
            failed: totalFailed,
            skipped: totalSkipped
          });
        }
      }
      
      // Final result
      const finalResult = {
        success: totalSuccessful > 0,
        message: totalFailed === 0 ? 
          `Importação concluída com sucesso! ${totalSuccessful} propriedades importadas.` :
          `Importação concluída com ${totalFailed} erros. ${totalSuccessful} propriedades importadas.`,
        data: {
          successful: totalSuccessful,
          failed: totalFailed,
          skipped: totalSkipped,
          total: totalSuccessful + totalFailed + totalSkipped
        }
      };
      
      console.log('🎉 Final batch result:', finalResult);
      setImportResult(finalResult);
      setCurrentStep(3);
      
      return; // Skip the old streaming logic
      
      // OLD STREAMING APPROACH (kept as fallback, but should not reach here)
      console.log('⚠️ Batch processing failed, falling back to streaming...');
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('action', 'import');
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('skipExisting', skipExisting.toString());
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-properties-complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok || !response.body) {
        throw new Error('Fallback streaming also failed');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isCompleted = false;
      let hasReceivedData = false;
      let lastProgressUpdate = Date.now();
      let pollingInterval: number | null = null;
      let initialPropertyCount = 0;
      
      // Get initial property count for polling fallback
      try {
        const { count } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);
        initialPropertyCount = count || 0;
        console.log('🔢 Initial property count:', initialPropertyCount);
        
        // If we already have many properties, this might be a re-import
        // Get count of recent properties (last hour) for more accurate tracking
        const { count: recentCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
        
        console.log('🔢 Recent properties (last hour):', recentCount);
        
        // If there are recent properties, adjust our baseline
        if (recentCount && recentCount > 0) {
          console.log('⚠️ Detected recent import activity, adjusting baseline');
        }
      } catch (error) {
        console.warn('⚠️ Could not get initial property count:', error);
      }
      
      // Set up adaptive timeout - increased to 1 hour for large files
      const estimatedRows = fileAnalysis?.totalRows || 0;
      const baseTimeout = 180000; // 3 minutes base
      const timePerRow = 2000; // 2 seconds per row (more conservative)
      const adaptiveTimeout = Math.max(baseTimeout, Math.min(estimatedRows * timePerRow, 3600000)); // Max 1 hour for large files
      
      console.log(`⏱️ Setting timeout for ${estimatedRows} rows: ${Math.round(adaptiveTimeout / 1000)} seconds`);
      
      // Polling fallback function
      const startPollingFallback = () => {
        if (pollingInterval) {
          console.log('🔄 Polling already running, skipping...');
          return;
        }
        
        console.log('🔄 Starting polling fallback...');
        let lastSeenCount = initialPropertyCount;
        let stableCountTicks = 0;
        let maxStableTicksBeforeCompletion = 12; // 60 seconds of stable count before considering complete
        
        pollingInterval = window.setInterval(async () => {
          console.log('🔄 Polling tick executing...');
          try {
            const { count } = await supabase
              .from('properties')
              .select('*', { count: 'exact', head: true })
              .is('deleted_at', null);
            
            const currentCount = count || 0;
            
            // If this is the first check and we have properties, assume import is in progress
            if (lastSeenCount === initialPropertyCount && currentCount > initialPropertyCount) {
              lastSeenCount = initialPropertyCount;
            }
            
            const processedCount = currentCount - initialPropertyCount;
            
            // Check for import errors by querying the debug_import table
            try {
              const { data: debugLogs, error: debugError } = await supabase
                .from('debug_import')
                .select('*')
                .gte('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
                .order('created_at', { ascending: false })
                .limit(50);
              
              if (!debugError && debugLogs && debugLogs.length > 0) {
                console.log('🚨 Recent import errors from debug table:', debugLogs);
                
                debugLogs.forEach(log => {
                  console.error(`🔍 Row ${log.row_num} (${log.property_name}): ${log.error_msg}`);
                });
              }
              
              // Only show estimation if we have actual data and it's reasonable
              if (processedCount > 0 && estimatedRows > 0) {
                const estimatedFailed = Math.max(0, estimatedRows - processedCount);
                console.log(`📊 Import Progress: ${processedCount}/${estimatedRows} (${((processedCount / estimatedRows) * 100).toFixed(1)}% complete)`);
                
                if (estimatedFailed > 0) {
                  console.error(`🔍 ESTIMATED REMAINING: ${estimatedFailed} properties pending`);
                }
              }
            } catch (logError) {
              console.warn('⚠️ Could not fetch import error logs:', logError);
            }
            
            console.log(`📊 Polling: ${processedCount} properties processed (current: ${currentCount}, initial: ${initialPropertyCount}, last: ${lastSeenCount})`);
            
            if (currentCount > initialPropertyCount) {
              setProgressData({
                message: `Processando via polling... ${processedCount} propriedades`,
                progress: processedCount,
                total: estimatedRows,
                successful: processedCount,
                failed: 0,
                skipped: 0
              });
              
              // Check if count has stabilized (no new properties in several ticks)
              if (currentCount === lastSeenCount) {
                stableCountTicks++;
                console.log(`🔄 Stable count for ${stableCountTicks} ticks (${currentCount} properties)`);
                
                // If count has been stable for enough time AND we have processed some properties
                if (stableCountTicks >= maxStableTicksBeforeCompletion && processedCount > 0) {
                  console.log('✅ Polling detected completion via stable count!');
                  setImportResult({
                    success: true,
                    message: `Importação concluída via polling. ${processedCount} propriedades processadas.`,
                    data: {
                      successful: processedCount,
                      failed: estimatedRows - processedCount,
                      skipped: 0,
                      total: estimatedRows,
                      errors: [`${estimatedRows - processedCount} propriedades falharam devido a problemas no CSV`],
                      skippedItems: [],
                      results: []
                    }
                  });
                  setCurrentStep(3);
                  isCompleted = true;
                  if (pollingInterval) {
                    window.clearInterval(pollingInterval);
                    pollingInterval = null;
                  }
                  return;
                }
              } else {
                // Count increased, reset stable counter
                stableCountTicks = 0;
                lastSeenCount = currentCount;
              }
              
              // Also check if we've reached or exceeded expected total (fallback)
              if (processedCount >= estimatedRows) {
                console.log('✅ Polling detected completion via target reached!');
                setImportResult({
                  success: true,
                  message: `Importação concluída via polling. ${processedCount} propriedades processadas.`,
                  data: {
                    successful: processedCount,
                    failed: 0,
                    skipped: 0,
                    total: estimatedRows,
                    errors: [],
                    skippedItems: [],
                    results: []
                  }
                });
                setCurrentStep(3);
                isCompleted = true;
                if (pollingInterval) {
                  window.clearInterval(pollingInterval);
                  pollingInterval = null;
                }
              }
            } else {
              console.log('📊 Polling: No properties processed yet, continuing...');
            }
          } catch (error) {
            console.error('❌ Polling error:', error);
          }
        }, 5000); // Poll every 5 seconds
      };
      
      // Start polling fallback after 3 seconds if no data received OR if receiving empty data
      const pollingTimeoutId = setTimeout(() => {
        if ((!hasReceivedData || !progressData) && !isCompleted) {
          console.log('⏰ No valid streaming data received, starting polling fallback...');
          startPollingFallback();
        }
      }, 3000);
      
      // Also start polling immediately if we detect empty stream data
      let emptyStreamCount = 0;
      
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          console.log('⏰ Timeout reached, checking completion...');
          
          // If we have polling running and progressData, let polling handle completion
          if (pollingInterval && progressData && (progressData.successful || 0) > 0) {
            console.log('🔄 Polling is active with progress data, extending timeout...');
            // Don't timeout yet, let polling finish its job
            return;
          }
          
          if (hasReceivedData || (pollingInterval && progressData)) {
            console.log('✅ Data was received, checking if import completed...');
            const processedCount = (progressData?.successful || 0) + (progressData?.failed || 0) + (progressData?.skipped || 0);
            if (processedCount > 0) {
              console.log(`✅ Import completed via timeout: ${processedCount} properties processed`);
              setImportResult({
                success: true,
                message: `Importação concluída via timeout. ${processedCount} propriedades processadas. Verifique a lista de propriedades para confirmar.`,
                data: {
                  successful: progressData?.successful || 0,
                  failed: (progressData?.failed || 0) + Math.max(0, estimatedRows - processedCount),
                  skipped: progressData?.skipped || 0,
                  total: estimatedRows,
                  errors: [`Algumas propriedades podem ter falhado devido a problemas no CSV`],
                  skippedItems: [],
                  results: []
                }
              });
              setCurrentStep(3);
              isCompleted = true;
              if (pollingInterval) {
                window.clearInterval(pollingInterval);
                pollingInterval = null;
              }
              return;
            }
          }
          
          console.log('❌ Timeout without completion detected');
          setError(`Timeout: A importação de ${estimatedRows} propriedades demorou mais que ${Math.round(adaptiveTimeout / 60000)} minutos para completar`);
          setIsLoading(false);
          setProgressData(null);
        }
        
        if (pollingInterval) {
          window.clearInterval(pollingInterval);
          pollingInterval = null;
        }
      }, adaptiveTimeout);
      
      try {
        console.log('📡 Starting to read stream...');
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('📡 Stream completed, hasReceivedData:', hasReceivedData);
            break;
          }
          
          hasReceivedData = true;
          lastProgressUpdate = Date.now();
          
          // Keep polling since we might get incomplete data
          clearTimeout(pollingTimeoutId);
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          console.log(`📋 Processing ${lines.length} lines from stream`);
          
          // If we've been receiving empty lines for a while, start polling fallback
          if (lines.length === 0 && hasReceivedData && !progressData && !pollingInterval) {
            emptyStreamCount++;
            console.log(`⚠️ Receiving empty stream data (${emptyStreamCount}), starting polling fallback immediately...`);
            startPollingFallback();
          }
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                console.log('📊 Received stream data:', data);
                
                if (data.type === 'progress') {
                  console.log('📈 Progress update:', data.data);
                  setProgressData(data.data);
                  
                  // Log errors in real-time for debugging
                  if (data.data.errors && data.data.errors.length > 0) {
                    console.log('🚨 Recent errors:', data.data.errors);
                    data.data.errors.forEach((error: string) => {
                      console.error(`🔍 IMPORT ERROR: ${error}`);
                    });
                  }
                  
                  if (data.data.lastProcessedRow) {
                    console.log(`📍 Last processed row: ${data.data.lastProcessedRow}`);
                  }
                } else if (data.type === 'error_detail') {
                  // CRITICAL: Display detailed error immediately
                  console.error(`🚨 DETAILED ERROR - Row ${data.data.rowNumber} (${data.data.propertyName}): ${data.data.errorType} - ${data.data.errorMessage}`);
                  
                  // Store detailed error for UI display
                  setDetailedErrors(prev => [...prev, {
                    rowNumber: data.data.rowNumber,
                    propertyName: data.data.propertyName,
                    errorType: data.data.errorType,
                    errorMessage: data.data.errorMessage,
                    timestamp: data.data.timestamp
                  }]);
                } else if (data.type === 'row_processing') {
                  // Show which row is being processed
                  console.log(`🔄 Processing Row ${data.data.rowNumber}/${data.data.totalRows}: ${data.data.rawData}`);
                  
                  // Store raw data for potential error context
                  setDetailedErrors(prev => prev.map(err => 
                    err.rowNumber === data.data.rowNumber && !err.rawData 
                      ? { ...err, rawData: data.data.rawData }
                      : err
                  ));
                } else if (data.type === 'mapped_data') {
                  // Show mapped data for debugging
                  console.log(`🗂️ Mapped Row ${data.data.rowNumber}:`, data.data.mappedData);
                  
                  // Store mapped data for potential error context  
                  setDetailedErrors(prev => prev.map(err => 
                    err.rowNumber === data.data.rowNumber && !err.mappedData 
                      ? { ...err, mappedData: data.data.mappedData }
                      : err
                  ));
                } else if (data.type === 'complete') {
                  console.log('✅ Import completed successfully!', data);
                  setImportResult(data);
                  setCurrentStep(3);
                  isCompleted = true;
                  clearTimeout(timeoutId);
                  if (pollingInterval) {
                    window.clearInterval(pollingInterval);
                    pollingInterval = null;
                  }
                  break;
                } else if (data.type === 'error') {
                  console.error('❌ Import error received:', data.error);
                  clearTimeout(timeoutId);
                  if (pollingInterval) {
                    window.clearInterval(pollingInterval);
                    pollingInterval = null;
                  }
                  throw new Error(data.error);
                } else {
                  console.log('❓ Unknown message type:', data);
                }
              } catch (parseError) {
                console.warn('⚠️ Failed to parse progress data:', parseError, 'Line:', line);
              }
            }
          }
          
          if (isCompleted) break;
        }
      } catch (streamError) {
        console.error('❌ Stream processing error:', streamError);
        clearTimeout(timeoutId);
        if (pollingInterval) {
          window.clearInterval(pollingInterval);
          pollingInterval = null;
        }
        throw streamError;
      } finally {
        try {
          reader.releaseLock();
        } catch (releaseError) {
          console.warn('⚠️ Error releasing reader lock:', releaseError);
        }
      }
      
      // Clear timeouts and intervals
      clearTimeout(timeoutId);
      clearTimeout(pollingTimeoutId);
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
        pollingInterval = null;
      }
      
      // If we didn't get a completion signal, do a final check via polling
      if (!isCompleted) {
        console.log('🔍 Stream ended without completion signal, doing final property count check...');
        
        try {
          // Do a final check of property count
          const { count: finalCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);
          
          const finalProcessedCount = (finalCount || 0) - initialPropertyCount;
          console.log(`🔍 Final property count check: ${finalProcessedCount} properties processed (current: ${finalCount}, initial: ${initialPropertyCount})`);
          
          if (finalProcessedCount > 0) {
            console.log('✅ Final check detected imported properties, marking as completed');
            setImportResult({
              success: true,
              message: `Importação concluída com sucesso! ${finalProcessedCount} propriedades importadas.`,
              data: {
                successful: finalProcessedCount,
                failed: estimatedRows - finalProcessedCount,
                skipped: 0,
                total: estimatedRows,
                errors: estimatedRows > finalProcessedCount ? [`${estimatedRows - finalProcessedCount} propriedades falharam devido a problemas no CSV`] : [],
                skippedItems: [],
                results: []
              }
            });
            setCurrentStep(3);
            return;
          }
        } catch (error) {
          console.error('❌ Error in final property count check:', error);
        }
        
        const processedCount = (progressData?.successful || 0) + (progressData?.failed || 0) + (progressData?.skipped || 0);
        console.error('❌ Import not completed. Processed count:', processedCount);
        console.error('📊 Progress data:', progressData);
        console.error('📡 Has received data:', hasReceivedData);
        
        if (hasReceivedData && processedCount > 0) {
          // Assume it completed if we got progress data
          console.log('✅ Assuming import completed based on progress data');
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
    setDetailedErrors([]);
  };

  const exportErrorReport = (errors: DetailedError[]) => {
    if (errors.length === 0) return;

    // Create CSV content
    const headers = [
      'Linha_CSV',
      'Nome_Propriedade', 
      'Tipo_Erro',
      'Mensagem_Erro',
      'Dados_CSV_Brutos',
      'Campos_Processados',
      'Timestamp'
    ];
    
    const csvContent = [
      headers.join(','),
      ...errors.map(error => [
        error.rowNumber,
        `"${error.propertyName || 'N/A'}"`,
        `"${error.errorType}"`,
        `"${error.errorMessage.replace(/"/g, '""')}"`,
        `"${error.rawData || 'N/A'}"`,
        `"${error.mappedData ? Object.entries(error.mappedData).map(([k,v]) => `${k}:${v}`).join('; ') : 'N/A'}"`,
        `"${new Date(error.timestamp).toLocaleString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    // Create and download file
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

            {/* Detailed Error Analysis Section */}
            {detailedErrors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  🚨 Análise Detalhada de Erros ({detailedErrors.length} falhas)
                </h4>
                <p className="text-sm text-red-700 mb-4">
                  Analise os erros abaixo para identificar e corrigir problemas específicos no arquivo CSV:
                </p>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {detailedErrors.map((error, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-red-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-mono">
                            Linha {error.rowNumber}
                          </span>
                          {error.propertyName && (
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {error.propertyName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {error.errorType}
                        </span>
                      </div>
                      
                      <p className="text-sm text-red-700 mb-2 font-medium">
                        {error.errorMessage}
                      </p>
                      
                      {error.rawData && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">📄 Dados brutos (CSV):</p>
                          <code className="text-xs bg-gray-100 p-2 rounded block font-mono text-gray-800 break-all">
                            {error.rawData}
                          </code>
                        </div>
                      )}
                      
                      {error.mappedData && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">🗂️ Dados processados:</p>
                          <div className="text-xs bg-blue-50 p-2 rounded">
                            {Object.entries(error.mappedData).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="font-medium text-blue-800 min-w-24">{key}:</span>
                                <span className="text-blue-700 break-all">{String(value || 'vazio')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">
                        ⏰ {new Date(error.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-semibold text-blue-800 mb-2">💡 Como corrigir:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>MISSING_FIELDS:</strong> Verifique se os campos obrigatórios (nome, latitude, longitude) estão preenchidos</li>
                    <li>• <strong>INVALID_COORDINATES:</strong> Coordenadas devem ser números válidos (ex: -25.4284, -49.2733)</li>
                    <li>• <strong>DATABASE_ERROR:</strong> Erro interno - verifique duplicatas ou dados inválidos</li>
                    <li>• <strong>CRITICAL_ERROR:</strong> Erro grave no processamento - verifique formatação do CSV</li>
                  </ul>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <Button 
                    onClick={() => exportErrorReport(detailedErrors)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar Relatório de Erros (CSV)</span>
                  </Button>
                </div>
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
