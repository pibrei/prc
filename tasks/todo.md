# Plano de Implementação: Sistema de Importação de Propriedades

## Análise do Estado Atual
- ✅ Sistema base implementado com database, frontend e backend
- ✅ Tabela properties com estrutura atual funcional
- ✅ RPC functions para gerenciamento de propriedades
- ✅ Interface de cadastro manual de propriedades
- ❌ Falta migração da tabela properties (adicionar contact_observations, remover address e contact_email)
- ❌ Falta sistema de importação via planilhas Excel/CSV

## Tarefas Prioritárias

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