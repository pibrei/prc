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

### Implementação Completa
- **Documentação**: `docs/implementacao-completa.md`
- **Resumo**: Visão geral de toda a implementação do sistema de propriedades
- **Conteúdo**: Métricas, arquitetura, padrões, próximos passos
- **Status**: Sistema pronto para produção com documentação completa