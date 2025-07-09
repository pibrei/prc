# Sistema de Geolocalização

## Visão Geral

O sistema de geolocalização foi implementado para otimizar a experiência do usuário, centralizando automaticamente os mapas na localização atual do usuário. Isso é especialmente importante para usuários móveis que trabalham no campo.

## Implementação

### 1. GeolocationContext (`/src/contexts/GeolocationContext.tsx`)

Contexto React que gerencia a localização do usuário em toda a aplicação.

**Funcionalidades:**
- Solicitação automática de permissão de localização
- Monitoramento contínuo da posição do usuário
- Armazenamento da localização em localStorage
- Tratamento de erros de geolocalização
- Estados de loading e erro

**Estados Gerenciados:**
```typescript
interface GeolocationContextType {
  userLocation: { lat: number; lng: number } | null
  locationError: string | null
  isLocationLoading: boolean
  requestLocationPermission: () => Promise<void>
  hasLocationPermission: boolean
  watchId: number | null
}
```

### 2. Componentes de Notificação

#### LocationPermissionBanner (`/src/components/location/LocationPermissionBanner.tsx`)
- Banner informativo para solicitar permissão de localização
- Exibido apenas quando necessário
- Botões para permitir ou dispensar

#### LocationErrorBanner (`/src/components/location/LocationErrorBanner.tsx`)
- Banner de erro para problemas de geolocalização
- Botão para tentar novamente
- Diferentes mensagens de erro baseadas no tipo

### 3. Integração com Mapas

#### LocationPicker Atualizado
- Centraliza automaticamente na localização do usuário
- Botão "Usar minha localização" otimizado
- Indicação visual quando usando localização atual

#### Página Map Atualizada
- Centro do mapa baseado na localização do usuário
- Zoom automático mais próximo (14) quando localização disponível
- Fallback para Curitiba quando sem localização

## Fluxo de Funcionamento

### 1. Inicialização
```typescript
useEffect(() => {
  // Verificar se há localização armazenada
  const storedLocation = localStorage.getItem('userLocation')
  const storedPermission = localStorage.getItem('locationPermission')
  
  // Solicitar permissão automaticamente
  requestLocationPermission()
}, [])
```

### 2. Solicitação de Permissão
```typescript
const requestLocationPermission = async () => {
  // Verificar suporte do navegador
  if (!navigator.geolocation) return
  
  // Verificar permissão atual
  const permission = await navigator.permissions.query({ name: 'geolocation' })
  
  // Obter localização atual
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
  
  // Iniciar monitoramento contínuo
  startWatchingLocation()
}
```

### 3. Monitoramento Contínuo
```typescript
const startWatchingLocation = () => {
  const id = navigator.geolocation.watchPosition(
    updateLocation,
    handleError,
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
  )
  setWatchId(id)
}
```

## Configurações

### Parâmetros de Geolocalização
```typescript
{
  enableHighAccuracy: true,  // Máxima precisão
  timeout: 10000,           // 10 segundos inicial
  maximumAge: 300000        // Cache por 5 minutos
}

// Para monitoramento contínuo
{
  enableHighAccuracy: true,
  timeout: 30000,           // 30 segundos
  maximumAge: 60000         // Cache por 1 minuto
}
```

### Tratamento de Erros
- **PERMISSION_DENIED**: Permissão negada pelo usuário
- **POSITION_UNAVAILABLE**: Localização não disponível
- **TIMEOUT**: Timeout na obtenção da localização

## Otimizações Mobile

### 1. Solicitação Automática
- Permissão solicitada automaticamente ao carregar a app
- Banner discreto para não interromper workflow

### 2. Persistência
- Localização armazenada em localStorage
- Permissão lembrada entre sessões
- Validação de token de localização

### 3. Performance
- Monitoramento com throttling
- Cache de localização para reduzir API calls
- Cleanup automático de watchers

## Integração com Componentes

### LocationPicker
```typescript
const { userLocation, hasLocationPermission } = useGeolocation()

// Usar localização do usuário como padrão
const getInitialPosition = (): [number, number] => {
  if (userLocation && hasLocationPermission) {
    return [userLocation.lat, userLocation.lng]
  }
  return [defaultLat, defaultLng]
}
```

### Map Principal
```typescript
const getMapCenter = (): [number, number] => {
  if (userLocation && hasLocationPermission) {
    return [userLocation.lat, userLocation.lng]
  }
  return [-25.4284, -49.2733] // Curitiba
}
```

## Experiência do Usuário

### 1. Primeira Visita
- Banner solicita permissão de localização
- Explicação clara dos benefícios
- Opção de dispensar sem prejuízo

### 2. Permissão Concedida
- Mapas centralizados na localização atual
- Zoom automático otimizado
- Botão "Usar minha localização" destacado

### 3. Permissão Negada
- Banner de erro explicativo
- Opção de tentar novamente
- Fallback para localização padrão

### 4. Erro de Localização
- Mensagens de erro específicas
- Sugestões de solução
- Não interrompe funcionalidade principal

## Benefícios

### 1. Usabilidade
- Menor necessidade de navegação manual
- Contexto geográfico relevante
- Workflow mais rápido

### 2. Mobile-First
- Otimizado para uso em campo
- Aproveitamento do GPS do dispositivo
- Interface touch-friendly

### 3. Performance
- Cache inteligente
- Monitoramento eficiente
- Cleanup automático

## Manutenção

### Dependências
- Browser Geolocation API
- React Context
- localStorage para persistência

### Configuração
- Timeout inicial: 10 segundos
- Timeout monitoramento: 30 segundos
- Cache: 5 minutos (inicial), 1 minuto (contínuo)

### Troubleshooting
1. **Permissão negada**: Orientar usuário para configurações
2. **Localização imprecisa**: Verificar `enableHighAccuracy`
3. **Timeout**: Ajustar valores de timeout
4. **Performance**: Revisar frequência de monitoramento

## Melhorias Futuras

1. **Geofencing**: Alertas baseados em localização
2. **Offline Support**: Cache de localização offline
3. **Histórico**: Rastreamento de movimentação
4. **Precisão**: Integração com GPS de alta precisão
5. **Análise**: Métricas de uso de localização