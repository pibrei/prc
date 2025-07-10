# Sistema de Logs de Erro em Tempo Real

## Problema Identificado

Após correções do CSV (147/223 = 66% sucesso), era necessário identificar exatamente quais erros específicos estavam causando as 75 falhas restantes, pois os logs do Edge Function não chegavam ao frontend.

## Solução Implementada

### 🔧 **Edge Function v14 - ERROR REPORTING**

#### **1. Logs de Erro Detalhados**

**Campos Obrigatórios Ausentes:**
```javascript
const missingFields = [];
if (!propertyData.name) missingFields.push('name');
if (!propertyData.latitude) missingFields.push('latitude');
if (!propertyData.longitude) missingFields.push('longitude');
if (!propertyData.cidade) missingFields.push('cidade');
if (!propertyData.owner_name) missingFields.push('owner_name');

const errorMsg = `Row ${rowNumber} (${propertyData.name || 'UNNAMED'}): Missing ${missingFields.join(', ')}`;
```

**Coordenadas Inválidas:**
```javascript
const errorMsg = `Row ${rowNumber} (${propertyData.name}): Invalid coordinates - lat: "${propertyData.latitude}", lng: "${propertyData.longitude}"`;
```

**Erros de Banco de Dados:**
```javascript
const errorMsg = `Row ${rowNumber} (${propertyData.name}): DB Error - ${createError.message}`;
```

**Erros Críticos (Exceptions):**
```javascript
const errorMsg = `Row ${rowNumber} (${propertyData?.name || 'UNKNOWN'}): CRITICAL - ${error instanceof Error ? error.message : 'Unknown error'}`;
```

#### **2. Transmissão de Erros para Frontend**

**No Edge Function:**
```javascript
sendData({ type: 'progress', data: { 
  message: `Processando ${i + 1}/${rows.length} propriedades...`,
  progress: i + 1,
  total: rows.length,
  successful: results.successful,
  failed: results.failed,
  skipped: results.skipped,
  errors: results.errors.slice(-5), // Últimos 5 erros
  lastProcessedRow: rowNumber
}});
```

**No Frontend:**
```javascript
if (data.data.errors && data.data.errors.length > 0) {
  console.log('🚨 Recent errors:', data.data.errors);
  data.data.errors.forEach((error: string) => {
    console.error(`🔍 IMPORT ERROR: ${error}`);
  });
}

if (data.data.lastProcessedRow) {
  console.log(`📍 Last processed row: ${data.data.lastProcessedRow}`);
}
```

## Como Usar o Sistema

### 📊 **Console do Navegador (F12)**

#### **Logs que Aparecerão:**

**1. Progresso Normal:**
```
📈 Progress update: {message: "Processando 50/223 propriedades...", progress: 50, ...}
📍 Last processed row: 52
```

**2. Erros em Tempo Real:**
```
🚨 Recent errors: ["Row 45 (UNNAMED): Missing name, cidade", "Row 47 (Fazenda XYZ): Invalid coordinates - lat: 'invalid', lng: '-50.123'"]
🔍 IMPORT ERROR: Row 45 (UNNAMED): Missing name, cidade
🔍 IMPORT ERROR: Row 47 (Fazenda XYZ): Invalid coordinates - lat: 'invalid', lng: '-50.123'
```

**3. Erro Crítico:**
```
🔍 IMPORT ERROR: Row 182 (Recanto Verde Sol): CRITICAL - Cannot read property 'toLowerCase' of null
```

### 🔍 **Interpretação dos Erros**

| Padrão do Erro | Causa Provável | Solução |
|----------------|----------------|---------|
| `Missing name, cidade` | Campos obrigatórios vazios no CSV | Verificar mapeamento das colunas |
| `Invalid coordinates` | Coordenadas malformadas | Corrigir formato lat/lng no CSV |
| `DB Error - duplicate key` | Nome de propriedade duplicado | Ativar "Skip existing" ou corrigir nomes |
| `CRITICAL - Cannot read property` | Erro de programação/dados corrompidos | Analisar linha específica no CSV |

### 📋 **Tipos de Erro Específicos**

#### **1. Campos Obrigatórios**
```
Row 45 (UNNAMED): Missing name, cidade
```
**Ação**: Verificar se colunas estão mapeadas corretamente

#### **2. Coordenadas**
```
Row 47 (Fazenda XYZ): Invalid coordinates - lat: "invalid", lng: "-50.123"
```
**Ação**: Corrigir coordenadas no CSV

#### **3. Banco de Dados**
```
Row 52 (Sítio ABC): DB Error - duplicate key value violates unique constraint
```
**Ação**: Ativar "Skip existing" ou renomear propriedades duplicadas

#### **4. Críticos**
```
Row 182 (Recanto Verde Sol): CRITICAL - Cannot read property 'toLowerCase' of null
```
**Ação**: Verificar dados específicos da linha 182

## Fluxo de Debugging

### 🚀 **Durante a Importação:**

1. **Abra Developer Tools** (F12) → Console
2. **Execute a importação**
3. **Observe logs em tempo real:**
   - `📍 Last processed row`: Mostra última linha processada
   - `🔍 IMPORT ERROR`: Erros específicos com linha e causa
4. **Identifique padrões:** 
   - Muitos "Missing name"? → Problema no mapeamento
   - "Invalid coordinates"? → Problema no CSV
   - "DB Error"? → Duplicatas ou constraints

### 📊 **Pós-Importação:**

1. **Colete todos os erros** mostrados no console
2. **Agrupe por tipo** (Missing fields, Invalid coordinates, DB Error, etc.)
3. **Corrija CSV** baseado nos erros mais frequentes
4. **Re-importe** com arquivo corrigido

## Status Atual

### ✅ **Implementado**
- **Edge Function v14**: Logs detalhados de erro
- **Frontend atualizado**: Exibição em tempo real no console
- **Categorização**: Tipos específicos de erro identificados
- **Transmissão**: Últimos 5 erros enviados a cada progresso

### 🔍 **Próximos Passos**
1. **Executar nova importação** com sistema de logs
2. **Coletar erros específicos** do console
3. **Analisar padrões** de falha
4. **Corrigir CSV** baseado nos logs
5. **Atingir >90% de sucesso**

**Status**: Sistema de debugging completo em tempo real pronto! 🚀

**Execute a importação e compartilhe os logs específicos que aparecerem no console.**