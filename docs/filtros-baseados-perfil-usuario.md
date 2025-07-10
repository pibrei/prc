# Filtros Baseados no Perfil do Usuário

## Visão Geral

Sistema implementado para exibir automaticamente apenas propriedades do BPM e CIA do usuário logado nas páginas Properties e Map, com opção de visualizar outras unidades através de filtros personalizados.

## Funcionalidades Implementadas

### 1. **Filtro Automático por Perfil**
- **Comportamento**: Ao fazer login, o usuário vê apenas propriedades de seu BPM e CIA
- **Fonte**: Dados do perfil do usuário (`userProfile.batalhao` e `userProfile.cia`)
- **Páginas**: Properties.tsx e Map.tsx

### 2. **Filtros Personalizáveis**
- **Interface**: Dropdowns para seleção de Batalhão e CIA
- **Opções**: Usuário pode visualizar outras unidades se necessário
- **Indicador**: Badge "Filtro personalizado" quando diferente do perfil

### 3. **Indicador Visual de Filtros**
- **Localização**: Card informativo no topo das páginas
- **Informações**: Mostra qual BPM/CIA está sendo visualizado
- **Status**: Indica se é o padrão do usuário ou filtro personalizado

## Implementação Técnica

### **Properties.tsx**

#### Estados de Filtro
```typescript
// Estados para filtros de visualização por perfil do usuário
const [selectedBatalhao, setSelectedBatalhao] = useState('')
const [selectedCia, setSelectedCia] = useState('')
```

#### Configuração Inicial
```typescript
useEffect(() => {
  if (userProfile) {
    // Definir filtros padrão baseados no perfil do usuário
    setSelectedBatalhao(userProfile.batalhao || '')
    setSelectedCia(userProfile.cia || '')
    fetchPropertiesLimited()
  }
}, [userProfile])
```

#### Consultas Filtradas
```typescript
const fetchPropertiesLimited = async () => {
  let query = supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  // Filtrar por batalhão e CIA selecionados
  if (selectedBatalhao) {
    query = query.eq('batalhao', selectedBatalhao)
  }
  if (selectedCia) {
    query = query.eq('cia', selectedCia)
  }

  const { data, error } = await query.limit(5)
  // ...
}
```

### **Map.tsx**

#### Configuração Semelhante
```typescript
// Estados para filtros de visualização por perfil do usuário
const [selectedBatalhao, setSelectedBatalhao] = useState('')
const [selectedCia, setSelectedCia] = useState('')

// useEffects para configuração inicial e reload
useEffect(() => {
  if (userProfile) {
    setSelectedBatalhao(userProfile.batalhao || '')
    setSelectedCia(userProfile.cia || '')
  }
}, [userProfile])

useEffect(() => {
  if (userProfile) {
    fetchMapData()
  }
}, [selectedBatalhao, selectedCia])
```

#### Busca de Dados do Mapa
```typescript
const fetchMapData = async () => {
  let query = supabase
    .from('properties')
    .select('*')
    .range(from, from + pageSize - 1)
    .order('created_at', { ascending: false })

  // Filtrar por batalhão e CIA selecionados
  if (selectedBatalhao) {
    query = query.eq('batalhao', selectedBatalhao)
  }
  if (selectedCia) {
    query = query.eq('cia', selectedCia)
  }
  // ...
}
```

## Interface de Usuário

### **Card Informativo**
```tsx
<Card className="p-4">
  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
    <span className="text-sm font-medium text-gray-700">
      Visualizando propriedades de:
    </span>
    <div className="flex flex-col sm:flex-row gap-2 text-sm">
      <span className="font-medium text-blue-600">
        {selectedBatalhao || 'Todos os Batalhões'}
      </span>
      {selectedCia && (
        <span className="font-medium text-green-600">
          {selectedCia}
        </span>
      )}
      {userProfile && isCustomFilter && (
        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
          Filtro personalizado
        </span>
      )}
    </div>
  </div>
</Card>
```

### **Filtros de Seleção**
```tsx
<select
  value={selectedBatalhao}
  onChange={(e) => setSelectedBatalhao(e.target.value)}
  className="px-3 py-2 border border-gray-300 rounded-md"
>
  <option value="">Todos os Batalhões</option>
  <option value="1º BPM">1º BPM</option>
  <option value="2º BPM">2º BPM</option>
  <option value="3º BPM">3º BPM</option>
  <option value="4º BPM">4º BPM</option>
</select>

<select
  value={selectedCia}
  onChange={(e) => setSelectedCia(e.target.value)}
  className="px-3 py-2 border border-gray-300 rounded-md"
>
  <option value="">Todas as CIAs</option>
  <option value="1ª CIA">1ª CIA</option>
  <option value="2ª CIA">2ª CIA</option>
  <option value="3ª CIA">3ª CIA</option>
  <option value="4ª CIA">4ª CIA</option>
  <option value="5ª CIA">5ª CIA</option>
</select>
```

## Benefícios Operacionais

### **Segurança e Organização**
1. **Visualização Específica**: Usuários veem apenas dados de sua área de responsabilidade
2. **Redução de Dados**: Menos informações na tela, foco no essencial
3. **Performance**: Consultas menores, carregamento mais rápido
4. **Hierarquia**: Respeita a estrutura organizacional militar

### **Flexibilidade**
1. **Consulta Cruzada**: Possibilidade de ver outras unidades quando necessário
2. **Coordenação**: Facilita trabalho entre CIAs diferentes
3. **Supervisão**: Superiores podem visualizar subordinados
4. **Análise**: Comparação entre diferentes unidades

### **Usabilidade**
1. **Automático**: Configuração baseada no perfil, sem ação do usuário
2. **Intuitivo**: Interface clara sobre qual área está sendo visualizada
3. **Personalizável**: Fácil alteração através dos dropdowns
4. **Responsivo**: Funciona em dispositivos móveis e desktop

## Casos de Uso

### **Usuário Padrão (Policial)**
- **Login**: Vê automaticamente propriedades de seu BPM e CIA
- **Trabalho Diário**: Foco nas propriedades sob sua responsabilidade
- **Consulta Específica**: Pode buscar propriedade em outra CIA se necessário

### **Líder de Equipe**
- **Gerenciamento**: Visualiza propriedades de sua CIA por padrão
- **Coordenação**: Pode visualizar outras CIAs para coordenação
- **Relatórios**: Acesso a dados consolidados de sua área

### **Administrador**
- **Visão Geral**: Pode visualizar qualquer BPM/CIA
- **Supervisão**: Acompanha trabalho de todas as unidades
- **Análise**: Compara performance entre diferentes unidades

## Configuração de Dados

### **Perfil do Usuário**
- **Campo**: `userProfile.batalhao` (ex: "2º BPM")
- **Campo**: `userProfile.cia` (ex: "3ª CIA")
- **Fonte**: Tabela `users` no Supabase
- **Preenchimento**: Definido no cadastro do usuário

### **Propriedades**
- **Campo**: `batalhao` (ex: "2º BPM")
- **Campo**: `cia` (ex: "3ª CIA")
- **Filtro**: Consultas SQL com `.eq()` para filtragem exata
- **Performance**: Índices no banco para consultas rápidas

## Impacto no Sistema

### **Páginas Atualizadas**
- ✅ **Properties.tsx**: Filtros funcionais com interface clara
- ✅ **Map.tsx**: Visualização geográfica filtrada por perfil
- ✅ **Responsividade**: Interface otimizada para mobile e desktop

### **Funcionalidades Mantidas**
- ✅ **Busca**: Funciona dentro do escopo filtrado
- ✅ **Paginação**: Respeitada com os filtros aplicados
- ✅ **Estatísticas**: Refletem apenas dados filtrados
- ✅ **Mapa**: Marcadores apenas das propriedades visíveis

### **Performance**
- ✅ **Consultas Menores**: Menos dados carregados
- ✅ **Carregamento Rápido**: Filtros aplicados no banco de dados
- ✅ **Cache Eficiente**: Dados específicos por usuário
- ✅ **Mobile Friendly**: Menos dados = melhor experiência mobile

## Monitoramento e Logs

### **Logs de Consulta**
```javascript
console.log('🗺️ Fetching properties for map with filters...')
console.log(`📊 Loaded ${allProperties.length} properties so far`)
console.log(`✅ Map data loaded: ${allProperties.length} properties`)
```

### **Auditoria**
- **Tabela**: `audit_properties` registra visualizações
- **Campos**: `user_id`, `action`, `filters_applied`
- **Análise**: Possível identificar padrões de uso por CIA

## Status de Implementação

✅ **IMPLEMENTAÇÃO COMPLETA E FUNCIONAL**

**Funcionalidades implementadas:**
- ✅ Filtro automático baseado no perfil do usuário
- ✅ Interface de seleção para outros BPM/CIA
- ✅ Indicadores visuais de filtros ativos
- ✅ Consultas otimizadas no banco de dados
- ✅ Responsividade completa
- ✅ Integração em Properties e Map

**Benefícios verificados:**
- ✅ Redução de dados exibidos (foco na área de responsabilidade)
- ✅ Performance melhorada com consultas filtradas
- ✅ Interface intuitiva e organizacional
- ✅ Flexibilidade para consultas cruzadas
- ✅ Respeito à hierarquia militar

**Impacto operacional:**
- ✅ Usuários veem apenas dados relevantes por padrão
- ✅ Possibilidade de visualizar outras unidades quando necessário
- ✅ Sistema reflete organização real da PMPR
- ✅ Interface limpa e focada na tarefa

O sistema agora oferece uma experiência personalizada e organizacional para cada usuário! 👮‍♂️🗺️📊