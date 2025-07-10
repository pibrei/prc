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
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!profile || (profile.role !== 'admin' && profile.role !== 'team_leader')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const formData = await req.formData();
    const action = formData.get('action') as string;
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const csvContent = await file.text();
    const lines = csvContent.trim().split('\n');
    
    if (lines.length === 0) {
      return new Response(JSON.stringify({ error: 'Empty CSV file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
    
    if (action === 'analyze') {
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
      };
      
      headers.forEach(header => {
        for (const [field, pattern] of Object.entries(patterns)) {
          if (pattern.test(header)) {
            suggestedMappings[header] = field;
            break;
          }
        }
      });
      
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
      const columnMappingStr = formData.get('columnMapping') as string;
      const skipExistingStr = formData.get('skipExisting') as string;
      
      if (!columnMappingStr) {
        return new Response(JSON.stringify({ error: 'Column mapping not provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const columnMapping = JSON.parse(columnMappingStr);
      const skipExisting = skipExistingStr === 'true';
      
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      const sendProgress = async (data: any) => {
        const jsonData = JSON.stringify({ type: 'progress', data }) + '\n';
        try {
          await writer.write(encoder.encode(jsonData));
        } catch (error) {
          console.error('Error sending progress:', error);
        }
      };
      
      const sendComplete = async (data: any) => {
        const jsonData = JSON.stringify({ type: 'complete', ...data }) + '\n';
        try {
          await writer.write(encoder.encode(jsonData));
        } catch (error) {
          console.error('Error sending completion:', error);
        }
      };
      
      // Process import in background
      (async () => {
        try {
          await sendProgress({ message: 'Iniciando importação...', progress: 0, total: rows.length });
          
          const results = {
            successful: 0,
            failed: 0,
            skipped: 0,
            total: rows.length,
            totalInFile: rows.length,
            processed: Math.min(20, rows.length), // Limit to 20 properties
            remaining: Math.max(0, rows.length - 20),
            errors: [] as string[],
            skippedItems: [] as any[],
            results: [] as any[]
          };
          
          const maxRows = Math.min(20, rows.length);
          const rowsToProcess = rows.slice(0, maxRows);
          
          for (let i = 0; i < rowsToProcess.length; i++) {
            const row = rowsToProcess[i];
            const rowNumber = i + 2;
            
            try {
              const propertyData: any = {};
              
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
                  } else {
                    propertyData[field] = value || null;
                  }
                }
              });
              
              if (!propertyData.name || !propertyData.latitude || !propertyData.longitude || !propertyData.cidade || !propertyData.owner_name) {
                results.failed++;
                results.errors.push(`Row ${rowNumber}: Missing required fields`);
                continue;
              }
              
              // Check for duplicates if skipExisting is true
              if (skipExisting) {
                const { data: existing } = await supabaseAdmin
                  .from('properties')
                  .select('id, name')
                  .ilike('name', propertyData.name)
                  .limit(1);
                
                if (existing && existing.length > 0) {
                  results.skipped++;
                  results.skippedItems.push({
                    row: rowNumber,
                    name: propertyData.name,
                    reason: 'Propriedade com mesmo nome já existe'
                  });
                  continue;
                }
              }
              
              // Create property
              const { error: createError } = await supabaseAdmin
                .rpc('create_property_profile', {
                  property_name: propertyData.name,
                  property_latitude: parseFloat(propertyData.latitude),
                  property_longitude: parseFloat(propertyData.longitude),
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
                  property_has_cameras: propertyData.has_cameras === 'true' || propertyData.has_cameras === 'sim',
                  property_cameras_count: propertyData.cameras_count ? parseInt(propertyData.cameras_count) : null,
                  property_has_wifi: propertyData.has_wifi === 'true' || propertyData.has_wifi === 'sim',
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
                console.error('Create error:', createError);
                results.failed++;
                results.errors.push(`Row ${rowNumber}: ${createError.message}`);
              } else {
                results.successful++;
                results.results.push({ row: rowNumber, name: propertyData.name, status: 'success' });
              }
              
              await sendProgress({ 
                message: `Processada: ${propertyData.name}`, 
                progress: i + 1, 
                total: rowsToProcess.length,
                successful: results.successful,
                failed: results.failed,
                skipped: results.skipped
              });
              
            } catch (error) {
              console.error('Row processing error:', error);
              results.failed++;
              results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            
            // Small delay between rows
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const finalResult = {
            success: true,
            message: results.failed === 0 ? 
              `Importação concluída com sucesso. ${results.successful} propriedades importadas.` :
              `Importação concluída com ${results.failed} erros. ${results.successful} propriedades importadas.`,
            data: results
          };
          
          await sendComplete(finalResult);
          
        } catch (error) {
          console.error('Import error:', error);
          const errorData = JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }) + '\n';
          await writer.write(encoder.encode(errorData));
        } finally {
          await writer.close();
        }
      })();
      
      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});