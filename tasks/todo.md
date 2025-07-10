# User Deletion Error Analysis and Solution Plan

## Problem Analysis

The user deletion functionality in the Rural Sistema project is failing due to a foreign key constraint violation. Here's what I found:

### Current Implementation
1. **Frontend**: Users.tsx file calls a `delete-user` edge function at line 313
2. **Edge Function**: The `delete-user` edge function doesn't exist - it needs to be created
3. **Database Schema**: 
   - `audit_logs` table has a foreign key constraint on `user_id` referencing `users.id`
   - Constraint: `audit_logs_user_id_fkey` with `DELETE RULE: NO ACTION`
   - Current state: 318 users total, 2 users have audit logs

### Foreign Key Relationships
Multiple tables reference the users table:
- `audit_logs.user_id` → `users.id` (NO ACTION)
- `properties.created_by` → `users.id` (NO ACTION) 
- `team_options.created_by` → `users.id` (NO ACTION)
- `vehicles.created_by` → `users.id` (NO ACTION)

## Todo List

### ✅ Completed
- [x] Find and analyze the delete-user edge function
- [x] Examine Users.tsx file around line 313 for deletion handling
- [x] Review database schema for audit_logs and users foreign key relationships

### 🔄 In Progress
- [ ] Identify the best solution for handling user deletion with audit logs

### 📋 Pending
- [ ] Check RLS policies and functions related to user deletion
- [ ] Create the missing delete-user edge function
- [ ] Implement proper user deletion strategy
- [ ] Test the user deletion functionality

## Solution Options

### Option 1: Soft Delete (Recommended)
- Add a `deleted_at` timestamp column to users table
- Mark users as deleted instead of physically removing them
- Preserve audit trail integrity
- Filter out deleted users in queries

### Option 2: Handle Foreign Key Dependencies
- Delete/update audit logs to set user_id to NULL
- Handle other dependent records (properties, team_options, vehicles)
- Create a comprehensive deletion strategy

### Option 3: Change Foreign Key Constraints
- Modify constraints to CASCADE or SET NULL
- Risk: May lose audit trail data
- Not recommended for audit logs

## Recommended Approach

I recommend **Option 1 (Soft Delete)** because:
1. Preserves audit trail integrity (critical for security compliance)
2. Maintains referential integrity
3. Allows for "undelete" functionality if needed
4. Standard practice for systems with audit requirements

## Implementation Steps

1. Add `deleted_at` column to users table
2. Create `delete-user` edge function with soft delete logic
3. Update user queries to filter out deleted users
4. Update RLS policies to handle deleted users
5. Test deletion functionality

## Next Steps

Please confirm this approach before I proceed with implementation.

---

## Previous Tasks (Completed System)

### Fase 1: Correção da Estrutura Database (CRÍTICO)
- [ ] **Task 1**: Aplicar migration SQL para modificar tabela properties
  - Adicionar campo `contact_observations` (TEXT, nullable)
  - Remover campo `address` (TEXT, NOT NULL)
  - Remover campo `contact_email` (TEXT, nullable)
  
- [ ] **Task 2**: Atualizar RPC function `create_property_profile`
  - Remover parâmetros `property_address` e `property_contact_email`
  - Adicionar parâmetro `property_contact_observations`
  - Atualizar validações e INSERT statement

### Fase 2: Backend - Sistema de Importação
- [ ] **Task 3**: Criar Edge Function `import-properties`
  - Upload e validação de arquivos Excel/CSV
  - Parsing com biblioteca `xlsx`
  - Validação de permissões (admin/team_leader)
  - Retorno de preview dos dados

- [ ] **Task 4**: Criar RPC function `process_property_import`
  - Processamento em lote das propriedades
  - Validação de dados obrigatórios
  - Tratamento de duplicatas
  - Preenchimento automático (CRPM, batalhão)
  - Inserção com tratamento de erros

### Fase 3: Frontend - Interface de Importação
- [ ] **Task 5**: Criar página `PropertyImport.tsx`
  - Stepper para processo em etapas
  - Upload com drag & drop
  - Interface de mapeamento de colunas
  - Preview com validações em tempo real
  - Relatório final de importação

- [ ] **Task 6**: Criar componentes auxiliares
  - `FileUploader`: Upload com validação
  - `ColumnMapper`: Mapeamento flexível
  - `ImportPreview`: Preview com validação
  - `ImportResults`: Relatório final

### Fase 4: Funcionalidades Inteligentes
- [ ] **Task 7**: Implementar auto-detecção
  - Formatos de coordenadas (decimal, graus)
  - Padrões comuns de colunas
  - Validação de dados geográficos

- [ ] **Task 8**: Implementar validações avançadas
  - Campos obrigatórios
  - Duplicatas (por coordenadas/nome)
  - Formato de telefone
  - Coordenadas válidas

### Fase 5: Integração e Testes
- [ ] **Task 9**: Integrar com sistema existente
  - Adicionar link no menu para importação
  - Verificar permissões de acesso
  - Atualizar componentes existentes

- [ ] **Task 10**: Testes e validação
  - Testar migration
  - Testar RPC functions
  - Testar interface de importação
  - Validar segurança e permissões

### Fase 6: Documentação
- [ ] **Task 11**: Criar documentação técnica
  - Documentar sistema de importação
  - Atualizar CLAUDE.md
  - Guia de uso para usuários

## Próximos Passos Imediatos

1. **Corrigir estrutura database** (Tasks 1-2) - CRÍTICO
2. **Implementar backend** (Tasks 3-4) - ALTA PRIORIDADE
3. **Implementar frontend** (Tasks 5-6) - ALTA PRIORIDADE
4. **Adicionar funcionalidades inteligentes** (Tasks 7-8) - MÉDIA PRIORIDADE
5. **Integrar e testar** (Tasks 9-10) - MÉDIA PRIORIDADE
6. **Documentar** (Task 11) - BAIXA PRIORIDADE

## Tecnologias a Utilizar

### Backend
- **Supabase Edge Functions**: Para processamento de arquivos
- **Biblioteca xlsx**: Para parsing de Excel
- **PostgreSQL**: RPC functions para importação
- **RLS Policies**: Segurança e controle de acesso

### Frontend
- **React**: Interface principal
- **react-dropzone**: Upload com drag & drop
- **react-table**: Preview dos dados
- **Tailwind CSS**: Estilização
- **Lucide Icons**: Ícones

### Validação
- **Zod**: Schema validation
- **Real-time feedback**: Validação instantânea
- **Progress indicators**: UX durante processamento

## Estimativa de Tempo
- **Fase 1**: 4 horas (crítico)
- **Fase 2**: 8 horas (backend)
- **Fase 3**: 12 horas (frontend)
- **Fase 4**: 6 horas (funcionalidades)
- **Fase 5**: 4 horas (integração)
- **Fase 6**: 2 horas (documentação)

**Total**: ~36 horas (~4-5 dias de trabalho)

## Riscos e Mitigações

### Riscos
- Migration pode quebrar sistema existente
- Parsing de arquivos pode falhar
- Interface pode ser complexa para usuários

### Mitigações
- Testar migration em ambiente de desenvolvimento
- Validação robusta de arquivos
- Interface em etapas com feedback claro
- Documentação completa para usuários

---

*Plano criado: $(date)*
*Status: Aguardando aprovação para iniciar implementação*