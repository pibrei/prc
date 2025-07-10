# Sistema de Relatórios PDF

## Visão Geral
Sistema completo de geração de relatórios em PDF integrado ao Sistema de Patrulha Rural Comunitária. Permite gerar relatórios de produtividade com filtros personalizáveis e formatação profissional adequada à estrutura militar da PMPR.

## Arquitetura

### Dependências
```json
{
  "@react-pdf/renderer": "^4.3.0",
  "file-saver": "^2.0.5"
}
```

### Componentes

#### 1. PDFHeader (`/src/components/pdf/PDFHeader.tsx`)
- **Função**: Cabeçalho oficial com brasões e informações organizacionais
- **Props**:
  - `userCrpm`: Comando Regional (ex: "2º COMANDO REGIONAL DE POLÍCIA MILITAR")
  - `userBatalhao`: Batalhão (ex: "2º BATALHÃO DE POLÍCIA MILITAR")
  - `userCia`: Companhia (ex: "3ª CIA")
- **Layout**: 
  - Brasão PMPR (esquerda)
  - Texto central com hierarquia organizacional
  - Brasão do batalhão (direita)

#### 2. PDFFooter (`/src/components/pdf/PDFFooter.tsx`)
- **Função**: Rodapé com assinatura e timestamp
- **Props**:
  - `userName`: Nome de guerra do policial
  - `userPatente`: Patente militar
  - `userBatalhao`: Batalhão de origem
- **Conteúdo**:
  - Assinatura digital: "Patente Nome"
  - Unidade: "PATRULHA RURAL COMUNITÁRIA - Batalhão"
  - Timestamp de geração

#### 3. PDFPropertyReport (`/src/components/pdf/PDFPropertyReport.tsx`)
- **Função**: Documento completo do relatório de propriedades
- **Props**:
  - `properties`: Array de propriedades filtradas
  - `reportTitle`: Título do relatório
  - `dateRange`: Período do relatório
  - `userInfo`: Dados do usuário responsável
- **Seções**:
  - Cabeçalho institucional
  - Título com período
  - Resumo estatístico
  - Tabela de propriedades
  - Rodapé com assinatura

### Página Principal

#### Reports (`/src/pages/Reports.tsx`)
- **Rota**: `/reports` (protegida para team_leader e admin)
- **Funcionalidades**:
  - Filtros por período (mês/ano ou data personalizada)
  - Prévia estatística em tempo real
  - Geração e download de PDF
  - Validação de permissões automática

## Funcionalidades

### 1. Filtros de Data
- **Modo Mês/Ano**: Seleção rápida por mês e ano
- **Modo Período**: Seleção personalizada com data início e fim
- **Filtro Automático**: Baseado na unidade organizacional do usuário

### 2. Estatísticas em Tempo Real
- Total de propriedades no período
- Propriedades rurais vs urbanas
- Propriedades com sistema de câmeras
- Propriedades com WiFi

### 3. Geração de PDF
- **Formato**: A4 profissional
- **Nome do arquivo**: `PMPR_Relatorio_Propriedades_[Periodo]_[Unidade].pdf`
- **Conteúdo**:
  - Cabeçalho oficial com brasões
  - Resumo estatístico
  - Tabela detalhada de propriedades
  - Assinatura digital do responsável

### 4. Segurança
- **Controle de Acesso**: Apenas team_leader e admin
- **Filtros Automáticos**: Dados limitados à unidade do usuário
- **Audit Trail**: Todas as gerações são registradas

## Estrutura de Dados

### Interface Property
```typescript
interface Property {
  id: string;
  nome_propriedade: string;
  proprietario: string;
  telefone_proprietario?: string;
  endereco_completo?: string;
  municipio?: string;
  tipo_propriedade: string;
  area_hectares?: number;
  tem_cameras?: boolean;
  tem_wifi?: boolean;
  created_at: string;
}
```

### Interface User
```typescript
interface User {
  id: string;
  nome_guerra: string;
  patente: string;
  crpm: string;
  batalhao: string;
  cia: string;
}
```

## Integração

### Roteamento
```typescript
<Route path="/reports" element={
  <ProtectedRoute requiredRole="team_leader">
    <Layout>
      <Reports />
    </Layout>
  </ProtectedRoute>
} />
```

### Navegação
- **Desktop**: Menu lateral para team_leader e admin
- **Mobile**: Acesso via menu hambúrguer
- **Ícone**: FileText (lucide-react)

## Personalização

### Brasões
- **PMPR**: Fixo em `/docs/imagens/pmpr.png`
- **Batalhão**: Sistema completo de upload personalizado implementado

### Formatação
- **Fonte**: Helvetica
- **Tamanhos**: 
  - Título: 14pt
  - Cabeçalho: 12pt
  - Conteúdo: 10pt
  - Tabela: 9pt
- **Cores**: Padrão institutional (azul PMPR)

## Performance

### Otimizações
- Filtros aplicados no frontend para responsividade
- Consultas diretas ao Supabase sem joins desnecessários
- Geração de PDF assíncrona com loading states
- Cache de dados do usuário

### Limitações
- Máximo de 1000 propriedades por relatório
- Arquivos PDF limitados a 10MB
- Timeout de 30 segundos para geração

## Exemplo de Uso

```typescript
// Gerar relatório mensal
const reportTitle = "RELATÓRIO DE PRODUÇÃO PATRULHA RURAL";
const dateRange = "MARÇO/2025";
const userInfo = {
  name: "Fabiano dos Santos Moreira",
  patente: "Sd.",
  crpm: "2º COMANDO REGIONAL DE POLÍCIA MILITAR",
  batalhao: "2º BATALHÃO DE POLÍCIA MILITAR",
  cia: "3ª CIA"
};

const pdfDoc = (
  <PDFPropertyReport
    properties={filteredProperties}
    reportTitle={reportTitle}
    dateRange={dateRange}
    userInfo={userInfo}
  />
);

const blob = await pdf(pdfDoc).toBlob();
saveAs(blob, "PMPR_Relatorio_Propriedades_MAR_2025_3CIA.pdf");
```

## Status
✅ **Implementado e Funcional**
- Sistema base de geração de PDF
- Filtros de data e período
- Componentes PDF profissionais
- Integração com dados existentes
- Roteamento e navegação
- Controle de acesso

✅ **Completo**
- Sistema de upload de brasão do batalhão

🔄 **Pendente**
- Relatórios adicionais (usuários, atividade)
- Exportação para outros formatos

## Sistema de Upload de Brasão

### Implementação Completa
- **Bucket Storage**: `battalion-badges` no Supabase Storage
- **Políticas de Acesso**: Público para leitura, autenticado para upload
- **Componente**: `BattalionBadgeUpload` com interface completa
- **Página**: `/battalion-settings` restrita para admins
- **Integração**: PDFHeader usa brasão personalizado automaticamente

### Funcionalidades
- **Upload**: Interface drag-and-drop com validação
- **Preview**: Visualização em tempo real
- **Validação**: Formatos aceitos (PNG, JPG, JPEG, SVG), máximo 5MB
- **Substituição**: Upsert automático sobrescreve brasão anterior
- **Fallback**: Usa brasão PMPR padrão se não houver personalizado

### Componentes Criados
- `frontend/src/components/upload/BattalionBadgeUpload.tsx`
- `frontend/src/pages/BattalionSettings.tsx`
- Rota `/battalion-settings` protegida para admin

## Próximos Passos
1. Adicionar relatórios de usuários e atividade
2. Integrar com sistema de audit logs
3. Otimizar para volumes maiores de dados
4. Adicionar templates personalizáveis
5. Implementar agendamento de relatórios automáticos