-- PHASE 1: CRITICAL SECURITY FIXES

-- 1. Enable RLS on usuarios table and create proper policies
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = user_id;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = user_id AND role IN ('admin', 'administrador')
  );
$$;

-- Usuarios table policies - users can only see their own data, admins can see all
CREATE POLICY "Users can view their own profile" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" 
ON public.usuarios 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create users" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile (except role)" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id AND public.get_user_role(auth.uid()) = OLD.role)
WITH CHECK (auth.uid() = id AND NEW.role = OLD.role);

CREATE POLICY "Admins can update any user" 
ON public.usuarios 
FOR UPDATE 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete users" 
ON public.usuarios 
FOR DELETE 
USING (public.is_admin(auth.uid()) AND id != auth.uid());

-- 2. Fix overly permissive policies on other tables
-- Replace "true" policies with proper user-based restrictions

-- Clientes - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em clientes" ON public.clientes;

CREATE POLICY "Authenticated users can view clientes" 
ON public.clientes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage clientes" 
ON public.clientes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Obras - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em obras" ON public.obras;

CREATE POLICY "Authenticated users can view obras" 
ON public.obras 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage obras" 
ON public.obras 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Materiais - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em materiais" ON public.materiais;

CREATE POLICY "Authenticated users can view materiais" 
ON public.materiais 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage materiais" 
ON public.materiais 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Operadores - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em operadores" ON public.operadores;

CREATE POLICY "Authenticated users can view operadores" 
ON public.operadores 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage operadores" 
ON public.operadores 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Inspetores QA - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em inspetores_qa" ON public.inspetores_qa;

CREATE POLICY "Authenticated users can view inspetores_qa" 
ON public.inspetores_qa 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage inspetores_qa" 
ON public.inspetores_qa 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Perfis materiais - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em perfis_materiais" ON public.perfis_materiais;

CREATE POLICY "Authenticated users can view perfis_materiais" 
ON public.perfis_materiais 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage perfis_materiais" 
ON public.perfis_materiais 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Material prices - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em material_prices" ON public.material_prices;

CREATE POLICY "Authenticated users can view material_prices" 
ON public.material_prices 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage material_prices" 
ON public.material_prices 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Tamanhos barras - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em tamanhos_barras" ON public.tamanhos_barras;

CREATE POLICY "Authenticated users can view tamanhos_barras" 
ON public.tamanhos_barras 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage tamanhos_barras" 
ON public.tamanhos_barras 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- System settings - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em system_settings" ON public.system_settings;

CREATE POLICY "Authenticated users can view system_settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage system_settings" 
ON public.system_settings 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Project-related tables - only authenticated users can manage
DROP POLICY IF EXISTS "Permitir tudo em projetos" ON public.projetos;

CREATE POLICY "Authenticated users can view projetos" 
ON public.projetos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage projetos" 
ON public.projetos 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir tudo em projeto_pecas" ON public.projeto_pecas;

CREATE POLICY "Authenticated users can view projeto_pecas" 
ON public.projeto_pecas 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage projeto_pecas" 
ON public.projeto_pecas 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir tudo em projeto_otimizacoes" ON public.projeto_otimizacoes;

CREATE POLICY "Authenticated users can view projeto_otimizacoes" 
ON public.projeto_otimizacoes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage projeto_otimizacoes" 
ON public.projeto_otimizacoes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir tudo em historico_otimizacoes" ON public.historico_otimizacoes;

CREATE POLICY "Authenticated users can view historico_otimizacoes" 
ON public.historico_otimizacoes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage historico_otimizacoes" 
ON public.historico_otimizacoes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir tudo em estoque_sobras" ON public.estoque_sobras;

CREATE POLICY "Authenticated users can view estoque_sobras" 
ON public.estoque_sobras 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage estoque_sobras" 
ON public.estoque_sobras 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Update audit logs policies to use security definer functions
DROP POLICY IF EXISTS "Administradores podem ver todos os audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Administradores podem ver todos os system_activity_logs" ON public.system_activity_logs;

CREATE POLICY "Admins can view audit_logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view system_activity_logs" 
ON public.system_activity_logs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 4. Create trigger to audit role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role changes in system_activity_logs
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.system_activity_logs (
      action_type,
      entity_type,
      entity_id,
      description,
      details,
      user_id,
      user_name
    ) VALUES (
      'ROLE_CHANGE',
      'usuario',
      NEW.id::text,
      'Mudança de papel de usuário',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user', NEW.nome
      ),
      auth.uid(),
      (SELECT nome FROM public.usuarios WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_role_audit_trigger
  AFTER UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();