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
    console.log('🔍 === CSV ANALYSIS FUNCTION STARTED ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('📁 Analyzing file:', file.name, 'Size:', file.size);
    
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    
    console.log('📋 Total lines:', lines.length);
    
    if (lines.length === 0) {
      return new Response(JSON.stringify({ error: 'Empty file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const separator = semicolonCount > commaCount ? ';' : ',';
    
    console.log(`🔍 Detected separator: "${separator}"`);
    
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => line.split(separator).map(cell => cell.trim().replace(/"/g, '')));
    
    console.log('📊 Headers:', headers);
    console.log('📈 Data rows:', rows.length);
    
    // Analyze ALL rows for issues (not just first 50)
    const analysisResults = [];
    const maxRowsToAnalyze = rows.length;
    
    for (let i = 0; i < maxRowsToAnalyze; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 for header and 1-based indexing
      
      const analysis = {
        rowNumber,
        fieldCount: row.length,
        rawData: row.join(';'),
        issues: [] as string[],
        mappedData: {} as any
      };
      
      // Map key fields
      let name = '';
      let cidade = '';
      let owner_name = '';
      let coordinates = '';
      let latitude = '';
      let longitude = '';
      
      // Assuming standard CSV structure based on previous analysis
      if (row.length >= 19) {
        name = row[4] || ''; // Propriedade
        cidade = row[2] || ''; // Cidade  
        owner_name = row[6] || ''; // Proprietário
        coordinates = row[18] || ''; // Latitude,Longitude
        
        if (coordinates && coordinates.includes(',')) {
          const coords = coordinates.split(',');
          latitude = coords[0] || '';
          longitude = coords[1] || '';
        }
      }
      
      analysis.mappedData = {
        name,
        cidade,
        owner_name,
        latitude,
        longitude,
        coordinates
      };
      
      // Check for issues
      if (!name) {
        analysis.issues.push('Missing name (Propriedade)');
      }
      
      if (!latitude || isNaN(parseFloat(latitude))) {
        analysis.issues.push(`Invalid latitude: "${latitude}"`);
      }
      
      if (!longitude || isNaN(parseFloat(longitude))) {
        analysis.issues.push(`Invalid longitude: "${longitude}"`);
      }
      
      if (!coordinates) {
        analysis.issues.push('Missing coordinates field');
      }
      
      if (row.length < 19) {
        analysis.issues.push(`Insufficient fields: ${row.length}/19 expected`);
      }
      
      analysisResults.push(analysis);
    }
    
    // Summary statistics
    const totalIssues = analysisResults.filter(r => r.issues.length > 0).length;
    const successfulRows = analysisResults.filter(r => r.issues.length === 0).length;
    
    const summary = {
      totalRows: rows.length,
      analyzedRows: maxRowsToAnalyze,
      rowsWithIssues: totalIssues,
      successfulRows: successfulRows,
      projectedSuccessRate: ((successfulRows / maxRowsToAnalyze) * 100).toFixed(1),
      projectedFailures: Math.round((totalIssues / maxRowsToAnalyze) * rows.length),
      separator,
      headers,
      fieldCount: headers.length
    };
    
    console.log('📊 Analysis summary:', summary);
    
    return new Response(JSON.stringify({
      success: true,
      summary,
      detailedAnalysis: analysisResults,
      recommendations: [
        totalIssues > 0 ? `${totalIssues} rows have issues in sample` : 'No issues detected in sample',
        summary.projectedSuccessRate < 90 ? 'Consider reviewing CSV format' : 'CSV format looks good',
        `Projected success rate: ${summary.projectedSuccessRate}%`
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('💥 Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});