# Sistema de Contato Dinâmico Multi-Tenant

## Visão Geral

Sistema multi-tenant que permite a cada batalhão da PMPR ter sua própria página de contato personalizada. Cada batalhão gera um link único (ex: `/contato/2bpm`, `/contato/5bpm`) para compartilhar nas redes sociais, facilitando o acesso dos cidadãos ao batalhão correto.

## Arquitetura

### Frontend
- **Página Pública**: `/contato/:slug` - Acesso sem autenticação por batalhão
- **Página Administrativa**: `/tools` - Gerenciamento isolado por batalhão (admins)
- **Responsivo**: Otimizado para mobile-first
- **Multi-Tenant**: Cada batalhão vê apenas suas configurações

### Backend
- **Tabela**: `contact_configs` - Configurações de contato isoladas por batalhão
- **Tabela**: `battalion_configs` - Configurações gerais do batalhão e slug
- **Edge Function**: `contact-configs` - API pública com parâmetro slug
- **RLS**: Políticas de isolamento por batalhão e leitura pública

## Funcionalidades

### Página Pública (/contato/:slug)
- **Isolamento por Batalhão**: Cada slug mostra apenas as cidades do respectivo batalhão
- **Seleção de Cidade**: Organizada por Companhia do batalhão
- **Formulário Dinâmico**: Nome e bairro com mensagem personalizada
- **Geração WhatsApp**: Link automático para o número correto
- **Branding Dinâmico**: Nome do batalhão exibido automaticamente
- **Error Handling**: Página de erro para slugs inválidos

### Interface Administrativa (/tools)
- **Link Personalizado**: URL única baseada no batalhão do admin
- **Isolamento de Dados**: Admin vê apenas configurações do seu batalhão
- **Auto-Configuração**: Criação automática da configuração do batalhão
- **CRUD Isolado**: Operações restritas ao batalhão do usuário
- **Preview Específico**: Visualização da página do próprio batalhão

## Estrutura do Banco de Dados

### Tabela: contact_configs

```sql
- id: UUID (PK)
- city: VARCHAR(100) - Nome da cidade
- batalhao: VARCHAR(50) - Batalhão responsável 
- cia: VARCHAR(10) - Companhia (1, 2, 3, 4)
- equipe: VARCHAR(50) - Equipe opcional
- whatsapp_number: VARCHAR(20) - Número do WhatsApp
- battalion_slug: VARCHAR(20) - Slug único do batalhão
- is_active: BOOLEAN - Status ativo/inativo
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- created_by: UUID (FK users)
- updated_by: UUID (FK users)
```

### Tabela: battalion_configs

```sql
- id: UUID (PK)
- battalion_number: VARCHAR(10) - Número do batalhão
- battalion_slug: VARCHAR(20) UNIQUE - Slug único (ex: 2bpm, 5bpm)
- battalion_name: VARCHAR(100) - Nome completo do batalhão
- is_active: BOOLEAN - Status ativo/inativo
- created_at: TIMESTAMP
- created_by: UUID (FK users)
```

### Políticas RLS
- **Leitura Pública por Slug**: Qualquer pessoa pode ver configs ativas do slug
- **Isolamento por Batalhão**: Admins gerenciam apenas seu batalhão
- **Auto-Inserção**: Inserções restritas ao batalhão do usuário

## Edge Function

### contact-configs v2
- **URL**: `${SUPABASE_URL}/functions/v1/contact-configs?slug=2bpm`
- **Método**: GET
- **Parâmetro**: `slug` (obrigatório) - Identificador do batalhão
- **CORS**: Habilitado para acesso público
- **Validação**: Retorna 404 se slug não encontrado

```typescript
// Resposta estruturada:
{
  battalion: {
    name: string,           // "2º Batalhão de Polícia Militar"
    slug: string,           // "2bpm" 
    number: string          // "1"
  },
  configs: [{
    id: string,
    city: string,
    batalhao: string,
    cia: string,
    equipe?: string,
    whatsapp_number: string
  }]
}
```

## Fluxo de Uso

### Cidadão
1. Acessa link específico do batalhão `/contato/2bpm`
2. Vê apenas cidades do 2º BPM organizadas por Cia
3. Seleciona sua cidade específica
4. Preenche nome e bairro  
5. Clica em "Falar via WhatsApp"
6. Redirecionado para WhatsApp do batalhão correto

### Administrador do 2º BPM
1. Acessa `/tools` (autenticado como admin do 2º BPM)
2. Vê apenas configurações do 2º BPM
3. Gerencia cidades e números do seu batalhão
4. Copia link `/contato/2bpm` para compartilhar
5. Visualiza preview específico do 2º BPM

### Administrador do 5º BPM
1. Acessa `/tools` (autenticado como admin do 5º BPM)
2. Sistema cria automaticamente configuração para 5º BPM
3. Obtém link único `/contato/5bpm`
4. Gerencia apenas dados do 5º BPM (isolamento completo)

## Implementação

### Componentes Principais
- `ContactPage.tsx` - Página pública responsiva
- `Tools.tsx` - Interface administrativa 
- `Layout.tsx` - Navegação atualizada com "Ferramentas"

### Roteamento
- Rota pública: `/contato` (sem Layout)
- Rota protegida: `/tools` (com Layout e auth)

### API Integration
- Fetch direto para Edge Function (sem auth)
- Supabase client para admin operations (com auth)

## Benefícios

- **Simplicidade**: Interface intuitiva para cidadãos
- **Flexibilidade**: Admins podem atualizar sem código
- **Escalabilidade**: Suporta qualquer número de cidades/equipes
- **Mobile-First**: Otimizado para uso em campo
- **SEO Friendly**: Página estática para compartilhamento

## Benefícios do Multi-Tenancy

- **Isolamento Total**: Cada batalhão vê apenas seus dados
- **Links Únicos**: URLs personalizadas para cada batalhão
- **Escalabilidade**: Suporte ilimitado de batalhões
- **Autonomia**: Cada batalhão gerencia independentemente
- **Segurança**: RLS garante isolamento no banco
- **Auto-Configuração**: Setup automático para novos batalhões

## Dados Iniciais

- **2º BPM**: 23 cidades em 4 Cias com slug `2bpm`
- **Outros Batalhões**: Configuração criada automaticamente conforme necessário
- **Slug Pattern**: `{numero}bpm` (ex: 1bpm, 2bpm, 5bpm, 10bpm)

## Exemplos de URLs

- **2º BPM**: `https://sistema.pmpr.gov.br/contato/2bpm`
- **5º BPM**: `https://sistema.pmpr.gov.br/contato/5bpm`
- **10º BPM**: `https://sistema.pmpr.gov.br/contato/10bpm`

## Próximos Passos

- [ ] Customização visual por batalhão (cores, logos)
- [ ] Analytics de uso por batalhão
- [ ] Templates de mensagem personalizáveis por batalhão
- [ ] Relatórios de solicitações por batalhão
- [ ] Integração com outros canais (Telegram, etc.)