# Correção de Autenticação na Edge Function

## Problema
Sistema apresentava erro 400 (Bad Request) ao tentar criar usuários. A edge function `create-user` não estava recebendo o token de autenticação necessário.

## Causa
O frontend verificava a sessão do usuário mas não enviava o token `access_token` no header `Authorization` da requisição para a edge function.

## Solução
Adicionado header de autorização na chamada da edge function:

```typescript
// Antes
const { data: createResult, error: createError } = await supabase.functions.invoke('create-user', {
  body: { ... }
})

// Depois  
const { data: createResult, error: createError } = await supabase.functions.invoke('create-user', {
  body: { ... },
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  }
})
```

## Arquivo Modificado
- `/frontend/src/pages/Users.tsx` - Linha 174-176

## Resultado
- Criação de usuários funciona corretamente
- Autenticação adequada para edge function
- Validação de permissões admin mantida
- Erro 400 Bad Request resolvido

## Data
09/01/2025