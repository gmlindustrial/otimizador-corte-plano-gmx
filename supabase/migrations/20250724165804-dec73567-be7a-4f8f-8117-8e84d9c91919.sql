-- PHASE 1C: Enable RLS on remaining tables and fix permissive policies

-- Enable RLS on all remaining tables that need it
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspetores_qa ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policies and replace with proper authentication-based ones

-- Clientes - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em clientes" ON public.clientes;
CREATE POLICY "Authenticated users can manage clientes" 
ON public.clientes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Obras - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em obras" ON public.obras;
CREATE POLICY "Authenticated users can manage obras" 
ON public.obras 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Materiais - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em materiais" ON public.materiais;
CREATE POLICY "Authenticated users can manage materiais" 
ON public.materiais 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Operadores - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em operadores" ON public.operadores;
CREATE POLICY "Authenticated users can manage operadores" 
ON public.operadores 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Inspetores QA - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em inspetores_qa" ON public.inspetores_qa;
CREATE POLICY "Authenticated users can manage inspetores_qa" 
ON public.inspetores_qa 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);