-- Script para criar usuário de teste
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Primeiro, crie o usuário através do Supabase Dashboard:
--    Authentication > Users > Add User
--    Email: admin@patrulharural.com
--    Password: Admin123!
--    Auto Confirm User: YES

-- 2. Depois de criar o usuário no Auth, execute este script para criar o perfil:

-- Substitua 'USER_ID_HERE' pelo ID do usuário criado no passo 1
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  badge_number,
  department
) VALUES (
  'USER_ID_HERE', -- Substitua pelo ID real do usuário
  'admin@patrulharural.com',
  'Administrador do Sistema',
  'admin',
  'ADM001',
  'Administração'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;