# GPS Coordinate Picker

## Visão Geral

O sistema de seleção de coordenadas GPS foi implementado para facilitar a entrada precisa de localizações geográficas no Sistema de Patrulha Rural. Esta funcionalidade permite aos usuários selecionar coordenadas através de múltiplos métodos intuitivos.

## Componentes Implementados

### 1. LocationPicker (`/src/components/map/LocationPicker.tsx`)
Componente principal que fornece interface completa para seleção de coordenadas.

**Funcionalidades:**
- Mapa interativo com Leaflet
- Seleção por clique no mapa
- Busca por endereço (geocoding)
- Captura de localização atual do usuário
- Entrada manual de coordenadas
- Preview em tempo real das coordenadas selecionadas

**Métodos de Seleção:**
1. **Clique no mapa**: Permite seleção visual direta
2. **Busca por endereço**: Utiliza API Nominatim para geocoding
3. **Localização atual**: Usa GPS do dispositivo via `navigator.geolocation`
4. **Entrada manual**: Campos para latitude e longitude

### 2. LocationInput (`/src/components/ui/location-input.tsx`)
Componente de campo de formulário reutilizável para entrada de coordenadas.

**Características:**
- Interface limpa e intuitiva
- Modal para seleção avançada
- Validação de coordenadas
- Formatação automática
- Entrada manual opcional

### 3. LocationPickerModal (`/src/components/map/LocationPickerModal.tsx`)
Modal que envolve o LocationPicker para uso em formulários.

### 4. useLocationPicker (`/src/hooks/useLocationPicker.ts`)
Hook personalizado para gerenciar estado da seleção de localização.

## Integração

### Páginas Atualizadas
1. **Properties** (`/src/pages/Properties.tsx`)
   - Substituição dos campos latitude/longitude por LocationInput
   - Melhor UX na definição de localização de propriedades

2. **Vehicles** (`/src/pages/Vehicles.tsx`)
   - Seleção de local onde veículo foi avistado
   - Facilita registro preciso de ocorrências

## Tecnologias Utilizadas

- **React Leaflet**: Mapa interativo
- **Nominatim API**: Geocoding gratuito
- **Geolocation API**: Localização atual do usuário
- **React Hooks**: Gerenciamento de estado
- **TypeScript**: Tipagem estática

## Configuração e Uso

### Uso Básico
```typescript
import LocationInput from '../components/ui/location-input'

<LocationInput
  latitude={latitude}
  longitude={longitude}
  onLocationChange={(lat, lng) => {
    // Atualizar estado com novas coordenadas
  }}
  label="Localização"
  required
/>
```

### Personalização
```typescript
<LocationInput
  latitude={-25.4284}
  longitude={-49.2733}
  onLocationChange={handleLocationChange}
  label="Localização da Propriedade"
  placeholder="Selecione no mapa"
  required={true}
  disabled={false}
/>
```

## Características Técnicas

### Validação
- Verificação de coordenadas válidas
- Tratamento de erros de geocoding
- Timeout para requisições de localização

### Performance
- Lazy loading do mapa
- Debounce nas buscas por endereço
- Caching de resultados

### Acessibilidade
- Suporte a teclado
- Labels adequados
- Feedback visual claro

## Melhorias Futuras

1. **Offline Support**: Cache de mapas para uso offline
2. **Histórico**: Salvar localizações frequentes
3. **Precisão**: Integração com GPS de alta precisão
4. **Validação**: Verificação de coordenadas dentro do Paraná
5. **Geocoding Reverso**: Mostrar endereço das coordenadas selecionadas

## Manutenção

### Dependências
- `react-leaflet`: Mapa interativo
- `leaflet`: Biblioteca de mapas
- `lucide-react`: Ícones

### Configuração
- Coordenadas padrão: Curitiba (-25.4284, -49.2733)
- API Nominatim: https://nominatim.openstreetmap.org/
- Timeout geolocation: 5000ms

### Troubleshooting
1. **Erro de geocoding**: Verificar conectividade
2. **Geolocalização falha**: Permissões do navegador
3. **Mapa não carrega**: Verificar imports do Leaflet CSS