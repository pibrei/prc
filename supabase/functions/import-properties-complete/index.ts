import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 === EDGE FUNCTION STARTED v18 - ULTRATHINK DEBUG MODE ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Method:', req.method);
    console.log('🔗 URL:', req.url);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ User authenticated:', user.email);
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('👤 Profile loaded:', profile.full_name);
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const action = formData.get('action') as string;
    
    if (!file || !action) {
      console.error('❌ Missing file or action');
      return new Response(JSON.stringify({ error: 'Missing file or action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('📁 File info:', { name: file.name, size: file.size, type: file.type });
    console.log('🎯 Action:', action);
    
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    
    console.log('📋 Total lines:', lines.length);
    
    if (lines.length === 0) {
      console.error('❌ Empty file');
      return new Response(JSON.stringify({ error: 'Empty file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const separator = semicolonCount > commaCount ? ';' : ',';
    
    console.log(`🔍 CSV separator detected: "${separator}"`);
    console.log('📄 First line:', firstLine);
    
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => line.split(separator).map(cell => cell.trim().replace(/"/g, '')));
    
    console.log('📊 Headers:', headers);
    console.log('📈 Data rows:', rows.length);
    
    if (action === 'analyze') {
      console.log('🔍 === ANALYZE ACTION ===');
      const suggestedMappings: { [key: string]: string } = {};
      
      const patterns = {
        name: /^(nome|name|propriedade|property)$/i,
        latitude: /^(lat|latitude)$/i,
        longitude: /^(lng|lon|longitude)$/i,
        coordinates_combined: /^(coordenadas|coordinates|coord)$/i,
        cidade: /^(cidade|city)$/i,
        bairro: /^(bairro|neighborhood)$/i,
        owner_name: /^(proprietario|owner|dono|proprietário)$/i,
        owner_phone: /^(telefone|phone|celular)$/i,
        equipe: /^(equipe|team)$/i,
        has_cameras: /^(cameras|câmeras|possui.*cameras|possui.*câmeras)$/i,
        cameras_count: /^(qtd.*cameras|qtd.*câmeras|quantidade.*cameras|quantidade.*câmeras)$/i,
        has_wifi: /^(wifi|wi-fi|possui.*wifi)$/i,
        wifi_password: /^(senha.*wifi|password.*wifi|wifi.*senha|wifi.*password)$/i,
        activity: /^(atividade|activity)$/i,
        observations: /^(observacoes|observações|observations|obs)$/i,
        owner_rg: /^(rg|documento)$/i,
        cadastro_date: /^(data|date|cadastro|registro)$/i,
      };
      
      headers.forEach(header => {
        for (const [field, pattern] of Object.entries(patterns)) {
          if (pattern.test(header)) {
            suggestedMappings[header] = field;
            break;
          }
        }
      });
      
      console.log('🗂️ Suggested mappings:', suggestedMappings);
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          headers,
          sampleData: rows.slice(0, 5),
          suggestedMappings,
          totalRows: rows.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'import') {
      console.log('📥 === IMPORT ACTION ===');
      
      const columnMappingStr = formData.get('columnMapping') as string;
      const skipExistingStr = formData.get('skipExisting') as string;
      
      // Generate import session ID for error tracking
      const importSessionId = crypto.randomUUID();
      
      console.log('🗂️ Column mapping string:', columnMappingStr);
      console.log('⏭️ Skip existing:', skipExistingStr);
      
      if (!columnMappingStr) {
        console.error('❌ Column mapping not provided');
        return new Response(JSON.stringify({ error: 'Column mapping not provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const columnMapping = JSON.parse(columnMappingStr);
      const skipExisting = skipExistingStr === 'true';
      
      console.log('🗂️ Parsed column mapping:', columnMapping);
      console.log('⏭️ Skip existing parsed:', skipExisting);
      console.log('🆔 Import session ID:', importSessionId);
      
      // Helper function to log errors - send immediately to frontend + try database
      const logError = async (rowNumber: number, propertyName: string, errorType: string, errorMessage: string, sendData: any) => {
        // CRITICAL: Send error immediately to frontend via stream
        sendData({ 
          type: 'error_detail', 
          data: { 
            rowNumber, 
            propertyName, 
            errorType, 
            errorMessage,
            timestamp: new Date().toISOString()
          }
        });
        
        // Try to insert into simple debug table (no RLS)
        try {
          await supabaseAdmin
            .from('debug_import')
            .insert({
              session_id: importSessionId,
              row_num: rowNumber,
              property_name: propertyName,
              error_msg: `${errorType}: ${errorMessage}`
            });
        } catch (dbError) {
          console.error('❌ Failed to log to debug table:', dbError);
        }
        
        // Also try original table
        try {
          await supabaseAdmin
            .from('import_logs')
            .insert({
              import_session_id: importSessionId,
              row_number: rowNumber,
              property_name: propertyName,
              error_type: errorType,
              error_message: errorMessage,
              created_by: user.id
            });
        } catch (logError) {
          console.error('❌ Failed to log error to original table:', logError);
        }
      };
      
      // Create streaming response with better headers
      const stream = new ReadableStream({
        start(controller) {
          console.log('📡 === STREAM STARTED ===');
          
          const encoder = new TextEncoder();
          
          const sendData = (data: any) => {
            const jsonData = JSON.stringify(data) + '\n';
            console.log('📤 Sending data:', jsonData.trim());
            try {
              controller.enqueue(encoder.encode(jsonData));
            } catch (error) {
              console.error('❌ Error sending data:', error);
            }
          };
          
          // Process import in background
          (async () => {
            try {
              console.log('🔄 Starting async import process...');
              
              // Send initial progress immediately
              sendData({ type: 'progress', data: { 
                message: 'Iniciando importação...', 
                progress: 0, 
                total: rows.length,
                successful: 0,
                failed: 0,
                skipped: 0
              }});
              
              const results = {
                successful: 0,
                failed: 0,
                skipped: 0,
                total: rows.length,
                errors: [] as string[],
                skippedItems: [] as any[],
                results: [] as any[]
              };
              
              console.log(`🔢 Processing ${rows.length} rows individually...`);
              
              // Process each row individually with progress updates
              for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNumber = i + 2; // +2 because of header and 1-based indexing
                
                try {
                  console.log(`📋 Processing row ${rowNumber}/${rows.length + 1}: ${row.join(', ')}`);
                  
                  // Send detailed row processing info to frontend
                  sendData({ 
                    type: 'row_processing', 
                    data: { 
                      rowNumber, 
                      totalRows: rows.length,
                      rawData: row.join(', '),
                      timestamp: new Date().toISOString()
                    }
                  });
                  
                  const propertyData: any = {};
                  
                  // Map columns to fields
                  headers.forEach((header, index) => {
                    const field = columnMapping[header];
                    if (field && row[index] !== undefined) {
                      const value = row[index].trim();
                      
                      if (field === 'coordinates_combined') {
                        const coords = value.split(/[\s,;]+/);
                        if (coords.length === 2) {
                          propertyData['latitude'] = coords[0];
                          propertyData['longitude'] = coords[1];
                        }
                      } else if (field === 'cadastro_date') {
                        // Parse American date format with timestamp (MM/DD/YYYY HH:mm:ss) to YYYY-MM-DD
                        // Allow empty dates - use current date as default
                        if (value && value.trim()) {
                          try {
                            // Handle formats like "6/18/2025 9:50:34" or "6/18/2025"
                            const datePart = value.split(' ')[0]; // Remove timestamp if present
                            const [month, day, year] = datePart.split('/');
                            
                            // Validate and format
                            if (month && day && year && !isNaN(parseInt(month)) && !isNaN(parseInt(day)) && !isNaN(parseInt(year))) {
                              const paddedMonth = month.padStart(2, '0');
                              const paddedDay = day.padStart(2, '0');
                              propertyData[field] = `${year}-${paddedMonth}-${paddedDay}`;
                              console.log(`📅 Date converted: "${value}" → "${propertyData[field]}"`);
                            } else {
                              // Fallback to current date if parsing fails
                              propertyData[field] = new Date().toISOString().split('T')[0];
                              console.log(`⚠️ Date parsing failed for "${value}", using current date`);
                            }
                          } catch (error) {
                            // Fallback to current date if parsing fails
                            propertyData[field] = new Date().toISOString().split('T')[0];
                            console.log(`❌ Date parsing error for "${value}":`, error);
                          }
                        } else {
                          // Empty date - use current date
                          propertyData[field] = new Date().toISOString().split('T')[0];
                          console.log(`📅 Empty date field, using current date: ${propertyData[field]}`);
                        }
                      } else {
                        propertyData[field] = value || null;
                      }
                    }
                  });
                  
                  console.log(`🗂️ Mapped property data for row ${rowNumber}:`, propertyData);
                  
                  // Send mapped data to frontend for debugging
                  sendData({ 
                    type: 'mapped_data', 
                    data: { 
                      rowNumber, 
                      mappedData: propertyData,
                      timestamp: new Date().toISOString()
                    }
                  });
                  
                  // Debug camera field mapping
                  if (propertyData.has_cameras) {
                    console.log(`📷 Camera field detected: "${propertyData.has_cameras}" → will be ${propertyData.has_cameras.toLowerCase() === 'sim' || propertyData.has_cameras.toLowerCase() === 'true' || propertyData.has_cameras.toLowerCase() === 'yes'}`);
                  }
                  
                  // Validate ONLY truly required fields: name, latitude, longitude
                  // Allow empty cidade and owner_name since they're common in CSV
                  if (!propertyData.name || !propertyData.latitude || !propertyData.longitude) {
                    const missingFields = [];
                    if (!propertyData.name) missingFields.push('name');
                    if (!propertyData.latitude) missingFields.push('latitude');
                    if (!propertyData.longitude) missingFields.push('longitude');
                    
                    const errorMsg = `Row ${rowNumber} (${propertyData.name || 'UNNAMED'}): Missing ${missingFields.join(', ')}`;
                    console.log(`❌ ${errorMsg}`);
                    await logError(rowNumber, propertyData.name || 'UNNAMED', 'MISSING_FIELDS', errorMsg, sendData);
                    results.failed++;
                    results.errors.push(errorMsg);
                    continue;
                  }
                  
                  // Set default values for empty optional fields
                  if (!propertyData.cidade) propertyData.cidade = 'Não informado';
                  if (!propertyData.owner_name) propertyData.owner_name = 'Não informado';
                  
                  // Validate coordinates
                  const lat = parseFloat(propertyData.latitude);
                  const lng = parseFloat(propertyData.longitude);
                  if (isNaN(lat) || isNaN(lng)) {
                    const errorMsg = `Row ${rowNumber} (${propertyData.name}): Invalid coordinates - lat: "${propertyData.latitude}", lng: "${propertyData.longitude}"`;
                    console.log(`❌ ${errorMsg}`);
                    await logError(rowNumber, propertyData.name, 'INVALID_COORDINATES', errorMsg, sendData);
                    results.failed++;
                    results.errors.push(errorMsg);
                    continue;
                  }
                  
                  // Check for EXACT duplicates if skipExisting is true
                  // Only skip if same name, latitude, longitude AND cidade match
                  if (skipExisting) {
                    const { data: existing } = await supabaseAdmin
                      .from('properties')
                      .select('id, name, latitude, longitude, cidade')
                      .ilike('name', propertyData.name)
                      .eq('latitude', lat)
                      .eq('longitude', lng)
                      .ilike('cidade', propertyData.cidade)
                      .limit(1);
                    
                    if (existing && existing.length > 0) {
                      console.log(`⏭️ Row ${rowNumber}: Exact duplicate found (same name, location, and city), skipping`);
                      results.skipped++;
                      results.skippedItems.push({
                        row: rowNumber,
                        name: propertyData.name,
                        reason: 'Propriedade idêntica (nome, coordenadas e cidade) já existe'
                      });
                      continue;
                    }
                  }
                  
                  // Create property using RPC
                  console.log(`🏗️ Creating property: ${propertyData.name}`);
                  
                  const { error: createError } = await supabaseAdmin
                    .rpc('create_property_profile', {
                      property_name: propertyData.name,
                      property_latitude: lat,
                      property_longitude: lng,
                      property_cidade: propertyData.cidade,
                      property_bairro: propertyData.bairro,
                      property_owner_name: propertyData.owner_name,
                      property_owner_phone: propertyData.owner_phone,
                      property_owner_rg: propertyData.owner_rg,
                      property_equipe: propertyData.equipe,
                      property_numero_placa: propertyData.numero_placa,
                      property_description: propertyData.description,
                      property_contact_name: propertyData.contact_name,
                      property_contact_phone: propertyData.contact_phone,
                      property_contact_observations: propertyData.contact_observations,
                      property_observations: propertyData.observations,
                      property_activity: propertyData.activity,
                      property_has_cameras: propertyData.has_cameras && (propertyData.has_cameras.toLowerCase() === 'sim' || propertyData.has_cameras.toLowerCase() === 'true' || propertyData.has_cameras.toLowerCase() === 'yes'),
                      property_cameras_count: propertyData.cameras_count ? parseInt(propertyData.cameras_count) : null,
                      property_has_wifi: propertyData.has_wifi && (propertyData.has_wifi.toLowerCase() === 'sim' || propertyData.has_wifi.toLowerCase() === 'true' || propertyData.has_wifi.toLowerCase() === 'yes'),
                      property_wifi_password: propertyData.wifi_password,
                      property_residents_count: propertyData.residents_count ? parseInt(propertyData.residents_count) : null,
                      property_created_by: user.id,
                      property_cadastro_date: propertyData.cadastro_date || new Date().toISOString().split('T')[0],
                      property_crpm: profile.crpm,
                      property_batalhao: profile.batalhao,
                      property_cia: profile.cia,
                      property_type: 'rural',
                      property_bou: null
                    });
                  
                  if (createError) {
                    const errorMsg = `Row ${rowNumber} (${propertyData.name}): DB Error - ${createError.message}`;
                    console.error(`❌ ${errorMsg}`);
                    console.error(`❌ Error details: code=${createError.code}, message=${createError.message}, hint=${createError.hint}`);
                    await logError(rowNumber, propertyData.name, 'DATABASE_ERROR', errorMsg, sendData);
                    results.failed++;
                    results.errors.push(errorMsg);
                  } else {
                    console.log(`✅ Row ${rowNumber}: Successfully created property: ${propertyData.name}`);
                    results.successful++;
                    results.results.push({ row: rowNumber, name: propertyData.name, status: 'success' });
                  }
                  
                } catch (error) {
                  const errorMsg = `Row ${rowNumber} (${propertyData?.name || 'UNKNOWN'}): CRITICAL - ${error instanceof Error ? error.message : 'Unknown error'}`;
                  console.error(`❌ CRITICAL: Error processing row ${rowNumber}:`, error);
                  console.error(`❌ Error type: ${error.constructor.name}`);
                  console.error(`❌ Error message: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack');
                  await logError(rowNumber, propertyData?.name || 'UNKNOWN', 'CRITICAL_ERROR', errorMsg, sendData);
                  results.failed++;
                  results.errors.push(errorMsg);
                }
                
                // Send progress update every 5 rows
                if (i % 5 === 0 || i === rows.length - 1) {
                  sendData({ type: 'progress', data: { 
                    message: `Processando ${i + 1}/${rows.length} propriedades...`,
                    progress: i + 1,
                    total: rows.length,
                    successful: results.successful,
                    failed: results.failed,
                    skipped: results.skipped,
                    errors: results.errors.slice(-5), // Send last 5 errors
                    lastProcessedRow: rowNumber
                  }});
                }
                
                // Small delay to prevent overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              
              // Send final result
              const finalResult = {
                success: true,
                message: results.failed === 0 ? 
                  `Importação concluída com sucesso! ${results.successful} propriedades importadas.` :
                  `Importação concluída com ${results.failed} erros. ${results.successful} propriedades importadas.`,
                data: results
              };
              
              console.log('🎉 Final result:', finalResult);
              sendData({ type: 'complete', ...finalResult });
              
              // Wait a bit before closing to ensure data is sent
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } catch (error) {
              console.error('❌ Import error:', error);
              sendData({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
            } finally {
              console.log('🔒 === CLOSING STREAM ===');
              controller.close();
            }
          })();
        }
      });
      
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked'
        }
      });
    }
    
    console.error('❌ Invalid action:', action);
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('💥 === FUNCTION ERROR ===', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});