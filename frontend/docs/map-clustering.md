# Map Clustering

## Visão Geral

O sistema de clustering de mapas foi implementado para melhorar a performance e usabilidade do mapa principal quando há muitos marcadores próximos. Esta funcionalidade agrupa marcadores geograficamente próximos em clusters visuais, reduzindo a poluição visual e melhorando o desempenho.

## Implementação

### 1. Biblioteca Utilizada
- **react-leaflet-cluster**: Extensão do React Leaflet para clustering
- **Instalação**: `npm install react-leaflet-cluster --legacy-peer-deps`

### 2. Configuração (`/src/pages/Map.tsx`)

**Importação:**
```typescript
import MarkerClusterGroup from 'react-leaflet-cluster'
import '../components/map/cluster-styles.css'
```

**Configuração do Clustering:**
```typescript
<MarkerClusterGroup
  chunkedLoading
  maxClusterRadius={50}
  spiderfyOnMaxZoom={true}
  showCoverageOnHover={false}
  zoomToBoundsOnClick={true}
  iconCreateFunction={(cluster) => {
    const childCount = cluster.getChildCount();
    let c = ' marker-cluster-';
    if (childCount < 10) {
      c += 'small';
    } else if (childCount < 50) {
      c += 'medium';
    } else {
      c += 'large';
    }
    
    return new L.DivIcon({
      html: `<div><span>${childCount}</span></div>`,
      className: 'marker-cluster' + c,
      iconSize: new L.Point(40, 40)
    });
  }}
>
  {/* Todos os marcadores aqui */}
</MarkerClusterGroup>
```

### 3. Estilos Customizados (`/src/components/map/cluster-styles.css`)

**Clusters Pequenos (< 10 marcadores):**
- Cor: Azul (#3B82F6)
- Indicam baixa densidade de marcadores

**Clusters Médios (10-49 marcadores):**
- Cor: Amarelo (#FBB924)
- Indicam densidade moderada

**Clusters Grandes (50+ marcadores):**
- Cor: Vermelho (#EF4444)
- Indicam alta densidade de marcadores

## Funcionalidades

### 1. Agrupamento Automático
- Marcadores próximos são automaticamente agrupados
- Raio de agrupamento configurável (50px)
- Reagrupamento dinâmico conforme zoom

### 2. Interatividade
- **Clique no cluster**: Zoom para mostrar marcadores individuais
- **Hover**: Sem preview (showCoverageOnHover: false)
- **Zoom máximo**: Spiderfy para mostrar todos os marcadores

### 3. Carregamento Otimizado
- **Chunked Loading**: Carregamento progressivo para melhor performance
- **Lazy Rendering**: Renderização sob demanda

### 4. Indicadores Visuais
- **Contagem**: Número de marcadores no cluster
- **Cores**: Indicam densidade (azul → amarelo → vermelho)
- **Tamanho**: Consistente (40x40px)

## Configurações

### Parâmetros Principais
```typescript
{
  chunkedLoading: true,           // Carregamento progressivo
  maxClusterRadius: 50,           // Raio máximo para agrupamento
  spiderfyOnMaxZoom: true,        // Spiderfy no zoom máximo
  showCoverageOnHover: false,     // Não mostrar cobertura no hover
  zoomToBoundsOnClick: true,      // Zoom ao clicar no cluster
}
```

### Classificação de Clusters
- **Pequeno**: < 10 marcadores (azul)
- **Médio**: 10-49 marcadores (amarelo)
- **Grande**: 50+ marcadores (vermelho)

## Benefícios

### 1. Performance
- Redução significativa na renderização de marcadores
- Melhor responsividade do mapa
- Menor uso de memória

### 2. Usabilidade
- Interface mais limpa e organizada
- Fácil navegação em áreas com muitos marcadores
- Indicação visual clara de densidade

### 3. Escalabilidade
- Suporta centenas de marcadores sem perda de performance
- Agrupamento automático conforme necessário
- Adaptação dinâmica ao nível de zoom

## Tipos de Marcadores Clusterizados

### 1. Propriedades
- Marcadores azuis padrão
- Informações: nome, endereço, contato
- Agrupados geograficamente

### 2. Veículos Suspeitos
- Marcadores coloridos por status
- Informações: placa, descrição, atividade
- Agrupados por proximidade

## Técnicas de Otimização

### 1. CSS Customizado
- Estilos otimizados para performance
- Uso de flexbox para centralização
- Transições suaves

### 2. Configuração de Ícones
- DivIcon para melhor performance que ImageIcon
- HTML simples para reduzir overhead
- Tamanhos fixos para consistência

### 3. Gestão de Eventos
- Eventos otimizados para reduzir re-renders
- Debouncing implícito na biblioteca
- Lazy loading de conteúdo

## Manutenção

### Dependências
- `react-leaflet-cluster`: Clustering
- `leaflet`: Biblioteca base
- `react-leaflet`: Integração React

### Configuração
- Raio de cluster: 50px
- Tamanho do ícone: 40x40px
- Cores: Azul/Amarelo/Vermelho

### Troubleshooting
1. **Clusters não aparecem**: Verificar import do CSS
2. **Performance lenta**: Ajustar maxClusterRadius
3. **Cores incorretas**: Verificar estilos CSS
4. **Clique não funciona**: Verificar zoomToBoundsOnClick

## Melhorias Futuras

1. **Clustering Personalizado**: Diferentes tipos de agrupamento
2. **Filtros**: Clustering por categoria
3. **Animações**: Transições suaves entre estados
4. **Métricas**: Indicadores de performance
5. **Configuração**: Painel de controle para ajustes