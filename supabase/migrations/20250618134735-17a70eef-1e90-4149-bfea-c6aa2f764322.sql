
-- Verificar e ajustar políticas RLS para todas as tabelas
-- Desabilitar RLS temporariamente para permitir acesso público aos dados

-- Tabela obras
ALTER TABLE public.obras DISABLE ROW LEVEL SECURITY;

-- Tabela clientes  
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;

-- Tabela materiais
ALTER TABLE public.materiais DISABLE ROW LEVEL SECURITY;

-- Tabela operadores
ALTER TABLE public.operadores DISABLE ROW LEVEL SECURITY;

-- Tabela inspetores_qa
ALTER TABLE public.inspetores_qa DISABLE ROW LEVEL SECURITY;

-- Verificar se há dados existentes
SELECT 'obras' as tabela, count(*) as total FROM public.obras
UNION ALL
SELECT 'clientes' as tabela, count(*) as total FROM public.clientes
UNION ALL
SELECT 'materiais' as tabela, count(*) as total FROM public.materiais
UNION ALL
SELECT 'operadores' as tabela, count(*) as total FROM public.operadores
UNION ALL
SELECT 'inspetores_qa' as tabela, count(*) as total FROM public.inspetores_qa;
