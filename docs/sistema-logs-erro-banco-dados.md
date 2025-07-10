# Sistema de Logs de Erro em Banco de Dados

## Problema Resolvido

Após várias tentativas de capturar logs de erro via streaming da Edge Function, identificamos que o sistema funciona via polling, não streaming. Por isso, implementamos um sistema robusto de logging de erros diretamente no banco de dados.

## Solução Implementada

### 🗄️ **Tabela import_logs**

```sql
CREATE TABLE import_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  import_session_id uuid NOT NULL,
  row_number integer,
  property_name text,
  error_type text NOT NULL,
  error_message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
```

#### **Campos da Tabela**
- `import_session_id`: UUID único por sessão de importação
- `row_number`: Linha do CSV onde ocorreu o erro
- `property_name`: Nome da propriedade (quando disponível)
- `error_type`: Tipo categórico do erro
- `error_message`: Mensagem detalhada do erro
- `created_by`: ID do usuário que executou a importação

### 🔧 **Edge Function v15 - DATABASE ERROR LOGGING**

#### **1. Tipos de Erro Categorizados**

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `MISSING_FIELDS` | Campos obrigatórios ausentes | "Missing name, cidade" |
| `INVALID_COORDINATES` | Coordenadas malformadas | "lat: 'invalid', lng: '-50.123'" |
| `DATABASE_ERROR` | Erro na criação no banco | "duplicate key value violates unique constraint" |
| `CRITICAL_ERROR` | Erros fatais/exceções | "Cannot read property 'name' of null" |

#### **2. Função de Logging**

```javascript
const logError = async (rowNumber: number, propertyName: string, errorType: string, errorMessage: string) => {
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
    console.error('❌ Failed to log error to database:', logError);
  }
};
```

#### **3. Integração nos Pontos de Erro**

**Campos Obrigatórios:**
```javascript
await logError(rowNumber, propertyData.name || 'UNNAMED', 'MISSING_FIELDS', errorMsg);
```

**Coordenadas Inválidas:**
```javascript
await logError(rowNumber, propertyData.name, 'INVALID_COORDINATES', errorMsg);
```

**Erros de Banco:**
```javascript
await logError(rowNumber, propertyData.name, 'DATABASE_ERROR', errorMsg);
```

**Erros Críticos:**
```javascript
await logError(rowNumber, propertyData?.name || 'UNKNOWN', 'CRITICAL_ERROR', errorMsg);
```

### 📱 **Frontend - Consulta de Logs Durante Polling**

#### **1. Consulta em Tempo Real**

```javascript
const { data: importLogs, error: logsError } = await supabase
  .from('import_logs')
  .select('*')
  .gte('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
  .order('created_at', { ascending: false })
  .limit(50);
```

#### **2. Agrupamento e Exibição**

```javascript
// Group errors by type
const errorsByType: { [key: string]: any[] } = {};
importLogs.forEach(log => {
  if (!errorsByType[log.error_type]) {
    errorsByType[log.error_type] = [];
  }
  errorsByType[log.error_type].push(log);
});

// Display errors by type
Object.entries(errorsByType).forEach(([errorType, errors]) => {
  console.error(`🔍 ${errorType} (${errors.length} errors):`);
  errors.slice(0, 5).forEach(error => {
    console.error(`   🔍 Row ${error.row_number} (${error.property_name}): ${error.error_message}`);
  });
});
```

### 🔍 **Como Usar o Sistema**

#### **Durante a Importação**

1. **Abra Developer Tools** (F12) → Console
2. **Execute a importação**
3. **Observe logs em tempo real:**

**Logs que Aparecerão:**
```
🔄 Polling tick executing...
🚨 Recent import errors from database: [{...}, {...}]
🔍 MISSING_FIELDS (15 errors):
   🔍 Row 45 (UNNAMED): Row 45 (UNNAMED): Missing name, cidade
   🔍 Row 52 (UNNAMED): Row 52 (UNNAMED): Missing owner_name
🔍 INVALID_COORDINATES (8 errors):
   🔍 Row 67 (Fazenda XYZ): Row 67 (Fazenda XYZ): Invalid coordinates - lat: "invalid", lng: "-50.123"
🔍 DATABASE_ERROR (3 errors):
   🔍 Row 89 (Sítio ABC): Row 89 (Sítio ABC): DB Error - duplicate key value violates unique constraint
```

#### **Pós-Importação**

```sql
-- Consultar todos os erros de uma sessão
SELECT * FROM import_logs 
WHERE import_session_id = 'uuid-da-sessao'
ORDER BY row_number;

-- Estatísticas por tipo de erro
SELECT error_type, COUNT(*) as total
FROM import_logs 
WHERE import_session_id = 'uuid-da-sessao'
GROUP BY error_type;

-- Propriedades que falharam mais vezes
SELECT property_name, COUNT(*) as errors
FROM import_logs 
WHERE import_session_id = 'uuid-da-sessao'
GROUP BY property_name
ORDER BY errors DESC;
```

## Políticas RLS

### 🔒 **Segurança**

```sql
-- Usuários podem ver logs da sua organização
CREATE POLICY "Users can view import logs from their organization" ON import_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.crpm = (SELECT crpm FROM users WHERE id = import_logs.created_by)
    )
  );

-- Usuários podem inserir logs
CREATE POLICY "Users can insert import logs" ON import_logs
  FOR INSERT WITH CHECK (auth.uid() = created_by);
```

## Vantagens do Sistema

### ✅ **Benefícios**

1. **Persistência**: Erros ficam gravados no banco
2. **Categorização**: Tipos específicos de erro identificados
3. **Rastreabilidade**: Session ID e row number para cada erro
4. **Segurança**: RLS por organização (CRPM)
5. **Performance**: Consulta otimizada durante polling
6. **Debugging**: Logs detalhados no console do navegador

### 📊 **Métricas Disponíveis**

- Taxa de sucesso por tipo de erro
- Linhas específicas que falharam
- Padrões de erro por sessão de importação
- Propriedades problemáticas recorrentes

## Status Atual

### ✅ **Implementado**
- **Tabela import_logs**: Criada com RLS
- **Edge Function v15**: Logging em todos os pontos de erro
- **Frontend atualizado**: Consulta e exibição de logs
- **Categorização**: 4 tipos específicos de erro
- **Segurança**: Políticas por organização

### 🔍 **Próximos Passos**
1. **Testar importação** com CSV corrigido
2. **Verificar logs no console** do navegador  
3. **Analisar padrões** de erro específicos
4. **Aplicar correções** baseadas nos logs detalhados
5. **Atingir >90% de sucesso** na importação

**Status**: Sistema completo de logging de erros em banco de dados implementado! 🚀

**Execute a importação e verifique os logs detalhados que aparecerão no console do navegador.**