# Sistema de Propriedades - Documentação Técnica

## Visão Geral

O Sistema de Propriedades é um módulo completo para gerenciamento de propriedades rurais e urbanas no Sistema de Patrulha Rural Comunitária do Paraná. Este sistema permite cadastro, edição, visualização e mapeamento de propriedades com informações detalhadas sobre infraestrutura, proprietários e responsabilidade militar.

## Arquitetura do Sistema

### Backend (Supabase)

#### 1. Tabela Properties
```sql
-- Campos principais
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
name TEXT NOT NULL
address TEXT NOT NULL  
latitude FLOAT NOT NULL
longitude FLOAT NOT NULL
property_type TEXT CHECK (property_type IN ('rural', 'urban', 'mixed')) DEFAULT 'rural'

-- Localização detalhada
cidade TEXT NOT NULL
bairro TEXT
numero_placa TEXT

-- Responsabilidade militar
crpm TEXT NOT NULL
batalhao TEXT NOT NULL
cia TEXT
equipe TEXT

-- Informações do proprietário
owner_name TEXT NOT NULL
owner_phone TEXT
owner_rg TEXT

-- Infraestrutura
has_wifi BOOLEAN DEFAULT FALSE
wifi_password TEXT
has_cameras BOOLEAN DEFAULT FALSE
cameras_count INTEGER DEFAULT 0
residents_count INTEGER
activity TEXT

-- Campos extras
bou TEXT
observations TEXT
contact_name TEXT
contact_phone TEXT
contact_email TEXT

-- Auditoria
created_by UUID NOT NULL REFERENCES users(id)
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

#### 2. Tabela Team Options
```sql
CREATE TABLE team_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batalhao TEXT NOT NULL,
    equipe_name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(batalhao, equipe_name)
);
```

#### 3. Funções RPC

##### create_property_profile
```sql
CREATE OR REPLACE FUNCTION create_property_profile(
    property_name TEXT,
    property_address TEXT,
    property_latitude FLOAT,
    property_longitude FLOAT,
    property_cidade TEXT,
    property_batalhao TEXT,
    property_crpm TEXT,
    property_owner_name TEXT,
    property_created_by UUID,
    -- Campos opcionais com defaults
    property_description TEXT DEFAULT NULL,
    property_bairro TEXT DEFAULT NULL,
    -- ... outros campos
) RETURNS JSON[]
SECURITY DEFINER
```

##### get_teams_by_battalion
```sql
CREATE OR REPLACE FUNCTION get_teams_by_battalion(battalion_name TEXT)
RETURNS TABLE(equipe_name TEXT, created_by UUID, created_at TIMESTAMP WITH TIME ZONE)
SECURITY DEFINER
```

##### add_team_to_battalion
```sql
CREATE OR REPLACE FUNCTION add_team_to_battalion(
    battalion_name TEXT,
    team_name TEXT,
    user_id UUID
) RETURNS JSON[]
SECURITY DEFINER
```

### Frontend (React + TypeScript)

#### 1. Interface Principal
```typescript
interface Property {
  id: string
  name: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  cidade: string
  bairro: string | null
  numero_placa: string | null
  crpm: string
  batalhao: string
  cia: string | null
  equipe: string | null
  owner_name: string
  owner_phone: string | null
  owner_rg: string | null
  has_wifi: boolean
  wifi_password: string | null
  has_cameras: boolean
  cameras_count: number
  residents_count: number | null
  activity: string | null
  bou: string | null
  observations: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  property_type: 'rural' | 'urban' | 'mixed'
  created_by: string
  created_at: string
  updated_at: string
}
```

#### 2. Componentes Principais

##### Properties.tsx
- Página principal de gerenciamento
- Formulário completo organizado em seções
- Lista de propriedades com filtros
- Integração com LocationInput para coordenadas GPS

##### TeamSelector.tsx
- Componente reutilizável para seleção de equipes
- Carregamento dinâmico baseado no batalhão
- Permite adicionar novas equipes
- Integração com RPC functions

##### Map.tsx
- Visualização geográfica das propriedades
- Ícones diferenciados para propriedades com câmeras
- Filtros avançados
- Integração com clustering de marcadores

## Funcionalidades Implementadas

### 1. Cadastro de Propriedades
- **Formulário Organizado**: Dividido em seções lógicas
  - Informações da Propriedade
  - Informações do Proprietário
  - Responsabilidade Militar
  - Infraestrutura
  - Informações Extras
  - Contato Adicional

- **Auto-preenchimento**: CRPM e batalhão preenchidos automaticamente do usuário logado

- **Validação**: Campos obrigatórios e validação de tipos

### 2. Seleção de Coordenadas GPS
- **LocationInput**: Componente integrado para seleção de coordenadas
- **Múltiplas Opções**: Clique no mapa, busca por endereço, geolocalização, entrada manual
- **Validação**: Coordenadas obrigatórias para cadastro

### 3. Sistema de Equipes Dinâmicas
- **TeamSelector**: Equipes carregadas dinamicamente por batalhão
- **Equipes Padrão**: Alpha, Bravo, Charlie, Delta
- **Equipes Personalizadas**: Usuários podem adicionar novas equipes
- **Persistência**: Equipes personalizadas ficam disponíveis para todo o batalhão

### 4. Visualização no Mapa
- **Ícones Diferenciados**: 
  - Azul: Propriedades normais
  - Vermelho: Propriedades com câmeras de segurança
- **Informações Detalhadas**: Popup com dados completos da propriedade
- **Clustering**: Agrupamento automático de marcadores próximos

### 5. Filtros Avançados
- **Filtros de Propriedade**:
  - Tipo de propriedade (Rural, Urbana, Mista)
  - Câmeras de segurança (Com/Sem)
  - WiFi (Com/Sem)
  - CRPM (dinâmico)
  - Batalhão (dinâmico)
- **Filtros de Veículos**: Status (Ativo, Resolvido, Falso Alarme)
- **Estatísticas**: Contadores atualizados em tempo real

## Integração com Sistema de Usuários

### 1. Auto-preenchimento
- CRPM e batalhão preenchidos automaticamente
- Baseado no perfil do usuário logado
- Campos desabilitados para edição

### 2. Equipes Dinâmicas
- Mesmo sistema usado em usuários e propriedades
- Consistência entre módulos
- Facilita manutenção e expansão

### 3. Auditoria
- Todas as operações registram usuário responsável
- Histórico completo de modificações
- Integração com sistema de logs

## Segurança

### 1. Row Level Security (RLS)
- Políticas de acesso baseadas em função do usuário
- Controle de visualização e edição
- Isolamento de dados por organização

### 2. Funções SECURITY DEFINER
- Bypass seguro de RLS para operações específicas
- Validação de permissões dentro das funções
- Prevenção de escalação de privilégios

### 3. Validação de Dados
- Validação no frontend e backend
- Sanitização de inputs
- Prevenção de injeção SQL

## Performance

### 1. Clustering de Marcadores
- Agrupamento automático para melhor visualização
- Performance otimizada para grandes volumes
- Configuração personalizada de distância

### 2. Filtros Eficientes
- Filtragem client-side para resposta rápida
- Carregamento dinâmico de opções
- Otimização de consultas no banco

### 3. Componentes Reutilizáveis
- TeamSelector usado em múltiplas páginas
- LocationInput compartilhado
- Redução de código duplicado

## Próximos Passos

### 1. Melhorias Sugeridas
- Histórico de modificações de propriedades
- Notificações de alterações
- Relatórios de propriedades por região
- Integração com sistema de alertas

### 2. Funcionalidades Futuras
- Upload de imagens das propriedades
- Documentos anexos
- Integração com sistemas externos
- App mobile para coleta de dados

### 3. Otimizações
- Cache de dados frequentemente acessados
- Paginação para grandes volumes
- Otimização de consultas complexas
- Melhorias na interface mobile

## Troubleshooting

### 1. Problemas Comuns
- **Erro de coordenadas**: Verificar se latitude/longitude são válidas
- **Equipe não carrega**: Verificar se batalhão está selecionado
- **Erro de permissão**: Verificar RLS policies e função do usuário

### 2. Logs
- Consultar logs da aplicação para erros específicos
- Verificar logs do Supabase para problemas de banco
- Monitorar performance das consultas

### 3. Manutenção
- Backup regular da tabela properties
- Limpeza de dados órfãos
- Monitoramento de uso de recursos

---

*Documentação atualizada em: $(date)*
*Versão do sistema: 1.0.0*
*Responsável: Sistema de Patrulha Rural - PMPR*