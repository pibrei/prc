# Plano de Implementação: Sistema de Importação de Propriedades

## Objetivo
Criar um sistema robusto e flexível para importação de propriedades via planilhas (Excel/CSV) com interface intuitiva de mapeamento de colunas.

## Análise dos Requisitos

### Campos Disponíveis nas Planilhas:
- Data
- Cidade
- Bairro  
- Nome da propriedade
- Número da placa
- Nome do proprietário
- Telefone
- Coordenadas (latitude/longitude)

### Campos do Sistema Atual:
- Obrigatórios: `name`, `latitude`, `longitude`, `cidade`, `owner_name`, `crpm`, `batalhao`
- Opcionais: `bairro`, `numero_placa`, `owner_phone`, `owner_rg`, `cia`, `equipe`, etc.

### Permissões:
- Administradores: Acesso total
- Comandantes de Equipe: Acesso restrito ao seu batalhão

## Estratégia de Importação

### 1. **Sistema de Mapeamento Flexível**
- Upload de arquivo (Excel/CSV)
- Interface de mapeamento de colunas
- Detecção automática de formatos comuns
- Validação em tempo real

### 2. **Processo em Etapas**
1. **Upload** → Análise do arquivo
2. **Mapeamento** → Associar colunas aos campos
3. **Validação** → Preview com erros/avisos
4. **Importação** → Processamento com relatório

### 3. **Funcionalidades Inteligentes**
- Auto-detecção de coordenadas (vários formatos)
- Preenchimento automático de CRPM/Batalhão
- Validação de dados obrigatórios
- Tratamento de duplicatas

## Fases de Implementação

### **Fase 1: Backend - Processamento de Arquivos**
1. **Edge Function**: `import-properties`
   - Upload e validação de arquivos
   - Parsing de Excel/CSV
   - Validação de permissões (admin/team_leader)
   
2. **RPC Function**: `process_property_import`
   - Processamento em lote
   - Validação de dados
   - Inserção com tratamento de erros

### **Fase 2: Frontend - Interface de Importação**
1. **Página**: `PropertyImport.tsx`
   - Upload de arquivo com drag & drop
   - Preview dos dados
   - Interface de mapeamento de colunas
   - Validação em tempo real

2. **Componentes**:
   - `FileUploader`: Upload com validação
   - `ColumnMapper`: Mapeamento flexível
   - `ImportPreview`: Preview com validação
   - `ImportResults`: Relatório final

### **Fase 3: Funcionalidades Inteligentes**
1. **Auto-detecção**:
   - Formatos de coordenadas (decimal, graus)
   - Padrões comuns de colunas
   - Validação de dados geográficos

2. **Validações**:
   - Campos obrigatórios
   - Duplicatas (por coordenadas/nome)
   - Formato de telefone
   - Coordenadas válidas

3. **Preenchimento Automático**:
   - CRPM/Batalhão do usuário
   - property_type = 'rural' (padrão)
   - Data de criação

### **Fase 4: Integração e Segurança**
1. **Controle de Acesso**:
   - Verificação de role (admin/team_leader)
   - Restrição por batalhão para team_leaders
   - Auditoria de importações

2. **Tratamento de Erros**:
   - Validação linha por linha
   - Relatório detalhado de erros
   - Opção de corrigir e reimportar

## Arquitetura Técnica

### **Backend**
- **Supabase Edge Function**: Processamento de arquivos
- **Biblioteca**: `xlsx` para parsing Excel
- **Validação**: Joi ou similar para schema validation
- **Segurança**: RLS policies + verificação de permissões

### **Frontend**
- **Upload**: `react-dropzone` para drag & drop
- **Tabela**: `react-table` para preview
- **Validação**: Real-time com feedback visual
- **UX**: Stepper para processo em etapas

### **Fluxo de Dados**
1. Upload → Parsing → Análise automática
2. Mapeamento → Validação → Preview
3. Confirmação → Importação → Relatório

## Fluxo de Trabalho Detalhado

### **1. Upload de Arquivo**
```
Usuario → Seleciona arquivo → Validação formato → Upload
                                ↓
                         Análise automática de colunas
                                ↓
                    Sugestões de mapeamento automático
```

### **2. Mapeamento de Colunas**
```
Interface visual:
[Coluna da Planilha] → [Campo do Sistema]
"Nome da Propriedade" → name (obrigatório)
"Cidade" → cidade (obrigatório)
"Telefone" → owner_phone (opcional)
"Latitude" → latitude (obrigatório)
"Longitude" → longitude (obrigatório)
```

### **3. Validação e Preview**
```
Validações:
✅ Campos obrigatórios preenchidos
✅ Coordenadas válidas (-90 a 90, -180 a 180)
✅ Formato de telefone
⚠️ Duplicatas encontradas
❌ Dados inválidos
```

### **4. Processamento**
```
Importação em lote:
- Preenchimento automático (CRPM, Batalhão)
- Validação RLS
- Inserção com tratamento de erros
- Relatório final
```

## Benefícios
- ✅ **Flexibilidade**: Suporta diferentes formatos de planilha
- ✅ **Validação**: Previne erros antes da importação
- ✅ **Segurança**: Controle de acesso baseado em roles
- ✅ **Usabilidade**: Interface intuitiva em etapas
- ✅ **Auditoria**: Rastreamento completo de importações
- ✅ **Escalabilidade**: Processamento eficiente em lote

## Casos de Uso Suportados

### **Caso 1: Planilha Padrão**
```
Colunas: Data, Cidade, Bairro, Nome, Placa, Proprietário, Telefone, Lat, Lng
Mapeamento: Automático por nomes similares
Validação: Completa
Resultado: Importação direta
```

### **Caso 2: Planilha Personalizada**
```
Colunas: Diferentes nomes/ordem
Mapeamento: Manual via interface
Validação: Campos obrigatórios
Resultado: Importação após mapeamento
```

### **Caso 3: Dados Incompletos**
```
Problema: Campos obrigatórios vazios
Solução: Relatório de erros + opção de correção
Resultado: Importação parcial ou correção manual
```

## Entregáveis
1. Sistema de importação completo
2. Interface de mapeamento flexível
3. Validação e tratamento de erros
4. Documentação de uso
5. Testes e validação

## Estimativas
- **Desenvolvimento**: 2-3 dias
- **Complexidade**: Média-Alta
- **Prioridade**: Alta (facilita adoção do sistema)

---

*Plano criado para Sistema de Patrulha Rural - PMPR*
*Data: $(date)*