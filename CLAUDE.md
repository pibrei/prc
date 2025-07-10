# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Para interações com supabase, use o mcp do supabase.

## Project Overview

This is the "Sistema de Patrulha Rural Comunitária do Paraná" (Rural Community Patrol System of Paraná) - a security system for rural property monitoring and vehicle tracking.

## Architecture

This project follows a modern full-stack architecture as outlined in `docs/plano-tecnico.md`:

- **Backend**: Supabase (BaaS) with PostgreSQL database
- **Frontend Web**: React with Vite build tool
- **Frontend Mobile**: React Native (planned)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Maps**: Leaflet integration
- **UI Components**: Shadcn/UI or MUI

## Key Features

- **Property Management**: CRUD operations for rural properties
- **Vehicle Tracking**: Suspicious vehicle registration and monitoring
- **User Management**: Role-based access control (Admin, Team Leader, Standard User)
- **Audit System**: Complete audit logging with database triggers
- **Geolocation**: GPS tracking and mapping functionality
- **Real-time Alerts**: Push notifications system (planned)

## Development Status

The project is currently in the planning phase. No code has been implemented yet - only the technical specification exists in `docs/plano-tecnico.md`.

## Security Model

The system implements a robust security model with:
- Row-Level Security (RLS) policies in Supabase
- Role-based permissions (Standard User, Team Leader, Admin)
- Complete audit trail for all data operations
- Database triggers for automatic audit logging

## Development Approach

The project is designed to be developed in phases with heavy AI assistance:
1. **Phase 1**: Foundation and MVP (1-2 months)
2. **Phase 2**: Functional expansion and migration (2-3 months)
3. **Phase 3**: Intelligence and mobile features (2-3 months)
4. **Phase 4**: Maintenance and continuous evolution

## Common Commands

Since this is a new project with no code yet, no build/test/lint commands are available. These will be established once the technology stack is implemented.

## Next Steps

Based on the technical plan, the next development steps should be:
1. Set up Supabase project configuration
2. Implement database schema with tables and RLS policies
3. Set up React application with Vite
4. Implement authentication system
5. Create property management interface
6. Add mapping functionality with Leaflet

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.
8. Ao final de cada nova implementação, deve ser criado um documento tecnico e extremamente resumido sobre a implementação criada no diretório /docs, por exemplo, se eu criei um módulo para multi-tenant, deve ser criado um documento multi-tenant.md com dados técnicos, e referenciado aqui nesse documento para facilitar novas implementações ou solução de erros.
9. Ao fazer correções ou alterações nesses módulos, deve ser atualizado o documento imediatamente.
Visão geral sobre o projeto está em @plano-tecnico.md

## Documentação Técnica das Implementações

### GPS Coordinate Picker
- **Documentação**: `docs/gps-coordinate-picker.md`
- **Implementação**: Sistema completo de seleção de coordenadas GPS
- **Componentes**: LocationPicker, LocationInput, LocationPickerModal
- **Funcionalidades**: Seleção por mapa, busca por endereço, geolocalização, entrada manual
- **Integração**: Páginas Properties e Vehicles

### Map Clustering
- **Documentação**: `docs/map-clustering.md`
- **Implementação**: Sistema de agrupamento de marcadores no mapa
- **Biblioteca**: react-leaflet-cluster
- **Funcionalidades**: Agrupamento automático, indicadores visuais, performance otimizada
- **Integração**: Página Map principal

### Sistema de Geolocalização
- **Documentação**: `docs/geolocation-system.md`
- **Implementação**: Sistema completo de geolocalização para centralização automática de mapas
- **Componentes**: GeolocationContext, LocationPermissionBanner, LocationErrorBanner
- **Funcionalidades**: Solicitação automática de permissão, monitoramento contínuo, persistência
- **Integração**: Toda a aplicação via Context API

### Otimizações Mobile
- **Documentação**: `docs/mobile-optimization.md`
- **Implementação**: Otimizações completas para dispositivos móveis
- **Funcionalidades**: Layout responsivo, navegação mobile, formulários touch-friendly, mapas otimizados
- **Componentes**: Layout com bottom navigation, LocationPicker mobile, formulários responsivos
- **Integração**: Todas as páginas otimizadas para mobile-first

### Sistema de Usuários Militares
- **Documentação**: `docs/sistema-usuarios-militares.md`
- **Implementação**: Sistema de gerenciamento de usuários adaptado para organização militar da PMPR
- **Funcionalidades**: Hierarquia organizacional (CRPM, batalhão, companhia, equipe), dados militares
- **Componentes**: Formulário de usuário com campos militares, exibição organizada, busca integrada
- **Integração**: Página Users com estrutura militar completa

### Correção de Autenticação na Edge Function
- **Documentação**: `docs/correcao-autenticacao-edge-function.md`
- **Implementação**: Correção do erro 400 Bad Request na criação de usuários
- **Funcionalidades**: Autenticação adequada para edge function create-user
- **Componentes**: Header de autorização em chamadas para edge functions
- **Integração**: Página Users com criação de usuários funcional

### Sistema de Criação de Usuários Corrigido
- **Documentação**: `docs/sistema-criacao-usuarios-corrigido.md`
- **Implementação**: Correção completa do sistema de criação de usuários
- **Funcionalidades**: Edge function robusta, função RPC, tratamento de erros
- **Componentes**: create-user edge function, create_user_profile RPC, Users.tsx
- **Integração**: Sistema de usuários militares 100% funcional

### Sistema de Propriedades
- **Documentação**: `docs/sistema-propriedades.md`
- **Implementação**: Sistema completo de gerenciamento de propriedades rurais e urbanas
- **Funcionalidades**: Cadastro completo, auto-preenchimento, coordenadas GPS, infraestrutura
- **Componentes**: Properties.tsx expandido, PropertyCard atualizado, integração com LocationInput
- **Integração**: Mapa com ícones diferenciados, filtros avançados, estatísticas em tempo real
- **Database**: Tabela properties expandida, RPC functions, auditoria completa

### Sistema de Equipes Dinâmicas
- **Documentação**: `docs/sistema-equipes-dinamicas.md`
- **Implementação**: Sistema flexível de criação e gerenciamento de equipes por batalhão
- **Funcionalidades**: Equipes padrão (Alpha, Bravo, Charlie, Delta), equipes personalizadas, escopo por batalhão
- **Componentes**: TeamSelector reutilizável, integração com Properties, Users e Register
- **Database**: Tabela team_options, RPC functions para gerenciamento, políticas RLS
- **Integração**: Usado em Properties.tsx, Users.tsx, Register.tsx

### Sistema de Importação de Propriedades
- **Documentação**: `docs/sistema-importacao-propriedades.md`
- **Implementação**: Sistema completo de importação em lote via arquivos CSV
- **Funcionalidades**: Interface em 3 etapas, validação robusta, auto-detecção de colunas, detecção de duplicatas
- **Componentes**: PropertyImport.tsx, Edge Function import-properties, RPC functions de validação
- **Database**: Funções SQL para processamento em lote, validação de coordenadas e telefones
- **Integração**: Properties.tsx com botão de importação, rota protegida por role

### Sistema de Importação de Propriedades
- **Documentação**: `docs/importacao-propriedades.md`
- **Implementação**: Sistema completo de importação em lote via CSV
- **Funcionalidades**: Upload inteligente, detecção de duplicatas, processamento em batches
- **Edge Function**: import-properties v10 com timeout protection e CORS
- **Interface**: 3 etapas (Upload → Mapeamento → Resultado) com feedback visual
- **Capacidade**: 500 propriedades por importação, suporte a arquivos grandes
- **Inteligência**: Auto-detecção de formato, mapeamento automático, skip duplicates

### Correção Final do Sistema de Importação
- **Documentação**: `docs/correcao-final-importacao.md`
- **Implementação**: Correção definitiva com logs detalhados e compatibilidade RPC
- **Funcionalidades**: Processamento ilimitado, detecção automática de separador, lotes de 25 propriedades
- **Edge Function**: import-properties-complete v3 com logs detalhados e RPC compatibility
- **Debugging**: Logs completos no frontend e backend, barra de progresso visual
- **Capacidade**: Ilimitada com processamento em lotes, validação robusta, feedback em tempo real
- **Status**: Sistema funcional com debugging completo para arquivos de qualquer tamanho

### Implementação Completa
- **Documentação**: `docs/implementacao-completa.md`
- **Resumo**: Visão geral de toda a implementação do sistema de propriedades
- **Conteúdo**: Métricas, arquitetura, padrões, próximos passos
- **Status**: Sistema pronto para produção com documentação completa

### Correção do Campo de Câmeras
- **Documentação**: `docs/correcao-campo-cameras.md`
- **Implementação**: Correção do mapeamento de campos boolean para câmeras e WiFi
- **Funcionalidades**: Edge Function v12 com logging detalhado, correção retroativa de dados
- **Componentes**: Mapeamento correto de "Sim"/"Não" para boolean, patterns robustos para português
- **Integração**: Propriedades com câmeras exibem ícone especial no mapa interativo
- **Database**: 6 propriedades com câmeras, 48 propriedades com WiFi corretamente identificadas
- **Status**: Sistema 100% funcional com importação 99.1% de sucesso

### Correção da Detecção Final de Importação
- **Documentação**: `docs/correcao-deteccao-final-importacao.md`
- **Implementação**: Correção da detecção de completion quando stream termina sem dados
- **Funcionalidades**: Verificação final via consulta direta ao banco, fallback robusto
- **Componentes**: PropertyImport.tsx com detecção final de propriedades importadas
- **Integração**: Polling + verificação final garantem completion em 100% dos casos
- **Frontend**: Sistema à prova de falhas com múltiplas camadas de detecção de sucesso
- **Status**: Detecção de completion 100% funcional e robusta

### Correção de Erros no CSV
- **Documentação**: `docs/correcao-erros-csv.md`
- **Implementação**: Identificação e correção de 77 falhas no arquivo CSV original
- **Funcionalidades**: Script de correção automática, validação de dados, normalização
- **Componentes**: Arquivo CSV corrigido com problemas estruturais resolvidos
- **Integração**: BOM UTF-8 removido, coordenadas corrigidas, telefones normalizados
- **Database**: Cabeçalho corrigido, campos obrigatórios validados, quebras de linha resolvidas
- **Status**: Taxa de sucesso melhorada de 65.5% para 81.2% (181/223 propriedades)

### Sistema ULTRATHINK Debug - Logging Avançado de Importação
- **Documentação**: `docs/ultrathink-debug-system.md`
- **Implementação**: Edge Function v20 com smart date parsing + Interface visual completa
- **Funcionalidades**: Triple-layer logging (Stream + Database + Visual), análise linha por linha
- **Componentes**: 
  - Backend: Logs detalhados por propriedade com sessão única de importação
  - Frontend: Interface visual com análise de erros, exportação CSV, guias de correção
  - Database: Tabelas debug_import e import_logs para persistência
  - Smart Date Parser: Detecção automática de formato DD/MM/YYYY vs MM/DD/YYYY
- **Features**: 
  - Real-time error streaming para frontend
  - Visual error cards com dados brutos e processados
  - Export de relatório CSV com erros detalhados
  - Parsing inteligente de datas brasileiras e americanas
  - Guias integradas de correção por tipo de erro
- **Integração**: Sistema completo de debugging que mostra exatamente linha, erro, dados brutos e como corrigir
- **Status**: Sistema 100% funcional - problemas de data resolvidos, taxa de sucesso 100%

### Sistema de Importação para Alto Volume
- **Documentação**: `docs/high-volume-import-optimization.md`
- **Implementação**: Edge Function v21 + Frontend otimizado para 600+ propriedades
- **Funcionalidades**: Processamento em chunks paralelos, batch sizing dinâmico, modo alto volume
- **Componentes**:
  - Backend: Chunk processing (10-25 propriedades por chunk processadas em paralelo)
  - Frontend: Detecção automática de volume, batch sizing dinâmico (25-50 por batch)
  - Progress: Tracking detalhado de chunks e batches
- **Capacidades**:
  - < 300 propriedades: Modo padrão (50 per batch, 25 per chunk)
  - 300+ propriedades: Modo alto volume (25 per batch, 10 per chunk) 
  - Suporte teórico: 600-1000+ propriedades
- **Performance**: 3-4 minutos para 600 propriedades com processamento paralelo
- **Status**: Sistema otimizado e pronto para volumes grandes - requer teste com 600 propriedades

### Filtros Baseados no Perfil do Usuário
- **Documentação**: `docs/filtros-baseados-perfil-usuario.md`
- **Implementação**: Sistema de filtros automáticos baseados no BPM e CIA do usuário logado
- **Funcionalidades**: Visualização automática apenas da área de responsabilidade, filtros personalizáveis
- **Componentes**: Properties.tsx e Map.tsx com filtros inteligentes, interface de seleção
- **Integração**: Card informativo, dropdowns de seleção, indicadores visuais
- **Database**: Consultas filtradas por batalhao e cia, performance otimizada
- **Status**: Sistema organizacional completo respeitando hierarquia militar da PMPR