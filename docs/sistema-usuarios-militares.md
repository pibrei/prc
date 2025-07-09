# Sistema de Usuários Militares

## Visão Geral

Sistema de gerenciamento de usuários adaptado para a organização militar da Polícia Militar do Paraná (PMPR), incluindo hierarquia organizacional baseada nos Comandos Regionais de Polícia Militar (CRPM).

## Estrutura de Dados

### Campos Adicionados na Tabela `users`

```sql
-- Campos pessoais
nome_guerra TEXT,        -- Nome de guerra do policial
patente TEXT,           -- Patente militar
telefone TEXT,          -- Telefone de contato

-- Organização militar
crpm TEXT,              -- Comando Regional (1º CRPM, 2º CRPM, etc.)
batalhao TEXT,          -- Batalhão de origem
cia TEXT,               -- Companhia (1ª CIA, 2ª CIA, etc.)
equipe TEXT             -- Equipe operacional (Alpha, Bravo, Charlie, Delta)
```

## Hierarquia Organizacional

### Comandos Regionais de Polícia Militar (CRPM)

1. **1º CRPM** - Curitiba
2. **2º CRPM** - Londrina  
3. **3º CRPM** - Maringá
4. **4º CRPM** - Ponta Grossa
5. **5º CRPM** - Cascavel
6. **6º CRPM** - São José dos Pinhais
7. **Coordenadoria** - Unidades especiais e administrativas

### Estrutura Operacional

- **Batalhão**: Unidade base da organização (ex: 1º BPM, 2º BPM, Coordenadoria)
- **Companhia**: Subdivisão do batalhão (1ª CIA, 2ª CIA, 3ª CIA, 4ª CIA, 5ª CIA, Coordenadoria)
- **Equipe**: Unidade operacional (Alpha, Bravo, Charlie, Delta, Não informado)

## Funcionalidades Implementadas

### Formulário de Usuário
- Campos organizados em seções: Dados Pessoais e Organização Militar
- Seleção de CRPM via dropdown
- Seleção de patente via dropdown (Sd., Cb., Sgt., Asp., Ten., Maj., Cap., TC., Cel.)
- Seleção de batalhão dinâmica baseada no CRPM selecionado
- Campos para nome de guerra e telefone
- Validação apenas para campos obrigatórios (Nome Completo e Email)

### Exibição de Usuários
- Cartões de usuário com informações militares
- Busca integrada por todos os campos militares
- Filtros por função no sistema, CRPM e batalhão

### Busca e Filtros
- Busca por nome completo, email, nome de guerra, patente, telefone
- Busca por organização militar (CRPM, batalhão, companhia, equipe)
- Filtro por CRPM (1º ao 6º CRPM + Coordenadoria)
- Filtro por batalhão (dinâmico baseado no CRPM selecionado)

## Migração Implementada

```sql
-- Migração: add_military_fields_to_users
ALTER TABLE users 
ADD COLUMN nome_guerra text,
ADD COLUMN patente text,
ADD COLUMN telefone text,
ADD COLUMN crpm text,
ADD COLUMN batalhao text,
ADD COLUMN cia text,
ADD COLUMN equipe text;
```

## Arquivos Modificados

- `/frontend/src/pages/Users.tsx` - Componente principal de gerenciamento de usuários
- Database: Migração `add_military_fields_to_users`

## Melhorias Implementadas (Atualização 2025-01-09)

1. **Seleção de Patente**: Implementado dropdown com todas as patentes da PMPR
2. **Seleção Dinâmica de Batalhão**: Batalhões são carregados automaticamente baseado no CRPM
3. **Filtros Avançados**: Implementados filtros por CRPM e batalhão na interface
4. **Nomenclatura Correta**: "Líder de Equipe" alterado para "Comandante de Equipe"
5. **Interface Organizada**: Patente posicionada antes do nome de guerra no formulário
6. **Flexibilidade Organizacional**: Opção "Não informado" adicionada para equipes quando não há divisão por equipes
7. **Coordenadoria**: Adicionada opção "Coordenadoria" nos seletores de CRPM, batalhão e companhia
8. **Filtros Simplificados**: Removido filtro por função, mantendo apenas CRPM, batalhão e busca por nome

## Melhorias Futuras

1. **Validação de Dados**: Implementar validação específica para campos como telefone
2. **Relatórios**: Gerar relatórios por organização militar
3. **Importação**: Sistema de importação em lote de usuários
4. **Hierarquia**: Implementar permissões baseadas na hierarquia militar
5. **Histórico**: Rastreamento de mudanças organizacionais

## Uso

O sistema permite que administradores criem e gerenciem usuários com informações militares completas, facilitando a organização e identificação dos membros da patrulha rural por sua origem organizacional na PMPR.