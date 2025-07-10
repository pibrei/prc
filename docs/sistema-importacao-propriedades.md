# Sistema de Importação de Propriedades

## Visão Geral

O Sistema de Importação de Propriedades permite aos usuários com permissões adequadas (admin/team_leader) importar propriedades em lote através de arquivos CSV. O sistema oferece uma interface intuitiva em 3 etapas, validação robusta e processamento inteligente de dados.

## Funcionalidades Implementadas

### 1. Interface de Importação em 3 Etapas
- **Etapa 1**: Upload de arquivo CSV com drag & drop
- **Etapa 2**: Mapeamento de colunas com auto-detecção
- **Etapa 3**: Resultado da importação com estatísticas

### 2. Backend Robusto
- **Edge Function**: `import-properties` para processamento de arquivos
- **RPC Function**: `process_property_import` para importação em lote
- **Validação**: Funções SQL para detecção de duplicatas e validação de dados

### 3. Funcionalidades Inteligentes
- **Auto-detecção**: Sugestões automáticas de mapeamento de colunas
- **Validação**: Coordenadas, telefones e campos obrigatórios
- **Duplicatas**: Detecção inteligente por nome, proprietário ou localização

## Arquitetura

### Frontend (React)
```
src/pages/PropertyImport.tsx
├── Interface de upload (drag & drop)
├── Mapeamento de colunas
├── Preview dos dados
└── Relatório de resultados
```

### Backend (Supabase)
```
Edge Functions:
└── import-properties
    ├── Análise de arquivos CSV
    ├── Validação de permissões
    └── Processamento de dados

RPC Functions:
├── process_property_import
├── detect_duplicate_properties
├── validate_coordinates
└── validate_phone_number
```

## Estrutura de Dados

### Campos Obrigatórios
- `name`: Nome da propriedade
- `latitude`: Coordenada geográfica
- `longitude`: Coordenada geográfica
- `cidade`: Cidade
- `owner_name`: Nome do proprietário

### Campos Opcionais
- `bairro`: Bairro
- `owner_phone`: Telefone do proprietário
- `numero_placa`: Número da placa
- `description`: Descrição
- `contact_name`: Nome do contato
- `contact_phone`: Telefone do contato
- `contact_observations`: Observações do contato
- `observations`: Observações gerais
- `activity`: Atividade desenvolvida
- `has_cameras`: Possui câmeras (boolean)
- `cameras_count`: Quantidade de câmeras
- `has_wifi`: Possui WiFi (boolean)
- `wifi_password`: Senha do WiFi
- `residents_count`: Número de moradores

## Fluxo de Importação

### 1. Upload do Arquivo
```typescript
// Validação do arquivo
accept: {
  'text/csv': ['.csv'],
},
maxFiles: 1
```

### 2. Análise e Mapeamento
```typescript
// Auto-detecção de colunas
const suggestedMappings = {
  'nome': 'name',
  'proprietario': 'owner_name',
  'latitude': 'latitude',
  'longitude': 'longitude',
  'cidade': 'cidade'
};
```

### 3. Validação e Processamento
```sql
-- Validação de coordenadas
SELECT validate_coordinates(lat, lng);

-- Detecção de duplicatas
SELECT detect_duplicate_properties(name, owner, lat, lng);

-- Importação em lote
SELECT process_property_import(data, user_id);
```

## Validações Implementadas

### 1. Validação de Arquivos
- Formato CSV obrigatório
- Tamanho máximo de arquivo
- Estrutura de dados válida

### 2. Validação de Dados
- Campos obrigatórios preenchidos
- Coordenadas dentro dos limites válidos
- Formato de telefone brasileiro
- Detecção de duplicatas

### 3. Validação de Permissões
- Apenas admin/team_leader podem importar
- Validação de token de autenticação
- Controle de acesso por RLS

## Segurança

### 1. Autenticação
- Token JWT obrigatório
- Validação de sessão ativa
- Controle de permissões por role

### 2. Validação de Dados
- Sanitização de inputs
- Validação de tipos
- Proteção contra SQL injection

### 3. Auditoria
- Log de todas as importações
- Rastreamento de alterações
- Identificação do usuário responsável

## Performance

### 1. Processamento em Lote
- Inserção de múltiplas propriedades em uma transação
- Validação otimizada com índices
- Rollback automático em caso de erro

### 2. Interface Otimizada
- Carregamento assíncrono
- Feedback visual em tempo real
- Prevenção de múltiplas submissões

## Uso

### 1. Acessar a Importação
1. Navegar para "Propriedades"
2. Clicar em "Importar" (disponível para admin/team_leader)
3. Ser redirecionado para `/properties/import`

### 2. Fazer Upload do Arquivo
1. Arrastar arquivo CSV ou clicar para selecionar
2. Aguardar análise automática
3. Prosseguir para mapeamento

### 3. Mapear Colunas
1. Revisar mapeamento automático
2. Ajustar conforme necessário
3. Validar campos obrigatórios
4. Iniciar importação

### 4. Revisar Resultados
1. Verificar estatísticas de importação
2. Revisar erros, se houver
3. Iniciar nova importação se necessário

## Template de Arquivo CSV

```csv
nome,latitude,longitude,cidade,bairro,proprietario,telefone,placa,descricao
Propriedade Exemplo,-25.4284,-49.2733,Curitiba,Centro,João Silva,41999999999,ABC1234,Propriedade rural exemplo
```

## Integração com Sistema Existente

### 1. Páginas Modificadas
- **Properties.tsx**: Adicionado botão "Importar" para roles autorizadas
- **App.tsx**: Adicionada rota `/properties/import` com proteção de role

### 2. Componentes Reutilizados
- **LocationInput**: Para validação de coordenadas
- **TeamSelector**: Para seleção de equipes
- **UI Components**: Button, Card, Input, etc.

### 3. Contextos Utilizados
- **AuthContext**: Validação de permissões
- **GeolocationContext**: Funcionalidades de localização

## Tratamento de Erros

### 1. Erros de Arquivo
```typescript
// Formato inválido
"Apenas arquivos CSV são suportados"

// Arquivo vazio
"Arquivo não contém dados válidos"

// Estrutura inválida
"Arquivo CSV mal formatado"
```

### 2. Erros de Validação
```typescript
// Campos obrigatórios
"Campos obrigatórios não mapeados: name, latitude, longitude"

// Coordenadas inválidas
"Coordenadas fora dos limites válidos"

// Duplicatas
"Propriedade já existe com nome/localização similar"
```

### 3. Erros de Processamento
```typescript
// Erro de permissão
"Usuário não tem permissão para importar propriedades"

// Erro de rede
"Falha na comunicação com o servidor"

// Erro de banco
"Erro interno do servidor durante importação"
```

## Métricas de Implementação

### Linhas de Código
- **Frontend**: ~430 linhas (PropertyImport.tsx)
- **Backend**: ~200 linhas (Edge Function)
- **Database**: ~300 linhas (RPC Functions)
- **Documentação**: ~300 linhas

### Funcionalidades
- ✅ Upload de arquivos CSV
- ✅ Análise automática de estrutura
- ✅ Mapeamento flexível de colunas
- ✅ Validação robusta de dados
- ✅ Processamento em lote
- ✅ Detecção de duplicatas
- ✅ Relatório de resultados
- ✅ Controle de permissões
- ✅ Auditoria completa

## Próximos Passos

### 1. Melhorias Futuras
- [ ] Suporte a arquivos Excel (.xlsx)
- [ ] Importação de imagens das propriedades
- [ ] Agendamento de importações
- [ ] Importação incremental
- [ ] Validação de endereços via API

### 2. Otimizações
- [ ] Cache de mapeamentos frequentes
- [ ] Processamento em background
- [ ] Compressão de arquivos
- [ ] Paralelização de validações

### 3. UX/UI
- [ ] Pré-visualização avançada
- [ ] Histórico de importações
- [ ] Templates personalizados
- [ ] Assistente de mapeamento

## Manutenção

### 1. Monitoramento
- Logs de importação no Supabase Dashboard
- Métricas de performance das Edge Functions
- Alertas de erro em tempo real

### 2. Backup
- Backup automático antes de importações grandes
- Versionamento de dados
- Rollback de importações problemáticas

### 3. Atualizações
- Validação de novos formatos de arquivo
- Melhorias na detecção de duplicatas
- Otimizações de performance

## Conclusão

O Sistema de Importação de Propriedades representa um avanço significativo na eficiência operacional, permitindo:

- **Produtividade**: Importação em lote vs. cadastro manual
- **Precisão**: Validação automatizada de dados
- **Segurança**: Controle rigoroso de permissões
- **Auditoria**: Rastreamento completo de operações
- **Usabilidade**: Interface intuitiva e responsiva

O sistema está pronto para uso em produção e oferece base sólida para futuras expansões.

---

*Documentação criada: $(date)*
*Responsável: Sistema de Patrulha Rural - PMPR*
*Status: Implementação Completa ✅*