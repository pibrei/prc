# Ajustes Automáticos por Município - Sistema Rural

## Visão Geral

Sistema implementado para realizar ajustes automáticos de distribuição geográfica de propriedades por batalhão e companhia, utilizando a MCP do Supabase para operações diretas no banco de dados.

## Exemplo Realizado

### Transferência: Ribeirão do Pinhal
- **Situação anterior**: 121 propriedades no **2º BPM - 3ª CIA**
- **Situação atual**: 121 propriedades no **2º BPM - 4ª CIA**
- **Comando executado**:
```sql
UPDATE properties 
SET cia = '4ª CIA', updated_at = NOW()
WHERE cidade ILIKE '%ribeirão do pinhal%' 
  AND batalhao = '2º BPM' 
  AND cia = '3ª CIA';
```

## Funções SQL Criadas

### 1. Função de Transferência
```sql
transfer_properties_by_city(city_name, new_battalion, new_company)
```

**Parâmetros:**
- `city_name`: Nome do município (busca parcial)
- `new_battalion`: Novo batalhão (ex: "2º BPM")
- `new_company`: Nova companhia (ex: "4ª CIA")

**Retorna:**
- Quantidade de propriedades transferidas
- Array com IDs das propriedades afetadas

**Exemplo de uso:**
```sql
SELECT * FROM transfer_properties_by_city('Jacarezinho', '2º BPM', '4ª CIA');
```

### 2. Função de Consulta Geográfica
```sql
get_geographic_distribution(battalion_filter)
```

**Parâmetros:**
- `battalion_filter`: Filtrar por batalhão específico (opcional)

**Retorna:**
- Cidade
- Batalhão
- Companhia
- Total de propriedades
- Percentual do batalhão

**Exemplo de uso:**
```sql
-- Ver distribuição completa do 2º BPM
SELECT * FROM get_geographic_distribution('2º BPM');

-- Ver distribuição geral
SELECT * FROM get_geographic_distribution();
```

## Distribuição Atual - 2º BPM

### 3ª CIA (1.772 propriedades - 93.66%)
| Cidade | Propriedades | % do Batalhão |
|--------|-------------|---------------|
| Ibaiti | 226 | 11.94% |
| Jacarezinho | 186 | 9.83% |
| Japira | 111 | 5.86% |
| Santo Antonio da Platina | 106 | 5.60% |
| Tomazina | 104 | 5.49% |
| Ribeirão Claro | 97 | 5.12% |
| Jaboti | 91 | 4.81% |
| Abatiá | 87 | 4.60% |
| Pinhalão | 82 | 4.33% |
| Cambará | 74 | 3.91% |
| **+ 30 outros municípios** | 608 | 32.17% |

### 4ª CIA (121 propriedades - 6.34%)
| Cidade | Propriedades | % do Batalhão |
|--------|-------------|---------------|
| Ribeirão do Pinhal | 121 | 6.34% |

## Como Usar para Novos Ajustes

### Exemplo 1: Transferir município completo
```sql
-- Transferir todas as propriedades de Jacarezinho para 4ª CIA
SELECT * FROM transfer_properties_by_city('Jacarezinho', '2º BPM', '4ª CIA');
```

### Exemplo 2: Consultar antes de transferir
```sql
-- Ver situação atual de um município específico
SELECT * FROM get_geographic_distribution('2º BPM') 
WHERE cidade ILIKE '%jacarezinho%';
```

### Exemplo 3: Balanceamento por tamanho
```sql
-- Ver maiores concentrações para balancear
SELECT * FROM get_geographic_distribution('2º BPM') 
WHERE total_propriedades > 50
ORDER BY total_propriedades DESC;
```

## Comandos Úteis

### Verificar distribuição por CIA
```sql
SELECT cia, COUNT(*) as total, 
       ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentual
FROM properties 
WHERE batalhao = '2º BPM'
GROUP BY cia
ORDER BY cia;
```

### Buscar municípios com variações de nome
```sql
SELECT DISTINCT cidade
FROM properties 
WHERE cidade ILIKE '%carlos%' OR cidade ILIKE '%joaquim%'
ORDER BY cidade;
```

### Backup antes de grandes mudanças
```sql
-- Criar backup da distribuição atual
CREATE TABLE properties_backup_$(date) AS 
SELECT id, cidade, batalhao, cia, updated_at 
FROM properties 
WHERE batalhao = '2º BPM';
```

## Impacto no Sistema

### Páginas Afetadas
- ✅ **Página Properties**: Filtros por CIA agora mostram distribuição correta
- ✅ **Página Map**: Filtros geográficos funcionam adequadamente
- ✅ **Sistema de Usuários**: Hierarquia militar reflete organização real

### Logs e Auditoria
- ✅ **Campo updated_at**: Atualizado automaticamente
- ✅ **Triggers de auditoria**: Registram todas as mudanças
- ✅ **Consistência**: Mantida em todas as operações

## Próximos Passos Sugeridos

### Balanceamento Estratégico
1. **Analisar distribuição atual**: Usar `get_geographic_distribution()`
2. **Identificar desbalanceamentos**: 3ª CIA com 93.66% vs 4ª CIA com 6.34%
3. **Transferir municípios estratégicos**: Mover cidades grandes para equilibrar

### Sugestões de Transferência
```sql
-- Exemplo: Balancear transferindo Ibaiti (226 propriedades)
SELECT * FROM transfer_properties_by_city('Ibaiti', '2º BPM', '4ª CIA');

-- Resultado esperado: 3ª CIA ≈ 81%, 4ª CIA ≈ 19%
```

### Automação Futura
- **Script de balanceamento**: Função que equilibra automaticamente
- **Monitoramento**: Alertas quando uma CIA fica sobrecarregada
- **Interface administrativa**: Painel para gestão geográfica

## Status

✅ **SISTEMA FUNCIONAL E TESTADO**

**Funcionalidades implementadas:**
- ✅ Transferência manual por município via SQL
- ✅ Funções automatizadas para transferência
- ✅ Consultas de distribuição geográfica
- ✅ Logs e auditoria completos
- ✅ Impacto positivo nos filtros das páginas

**Teste realizado:**
- ✅ 121 propriedades de Ribeirão do Pinhal transferidas
- ✅ Filtros funcionando corretamente
- ✅ Dados consistentes em Properties e Map

O sistema está pronto para ajustes estratégicos de distribuição geográfica! 🗺️🚔