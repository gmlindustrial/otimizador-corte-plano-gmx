-- PHASE 1D: Fix remaining security functions and update audit policies

-- Fix the search_path security issue for our functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.usuarios WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = user_id AND role IN ('admin', 'administrador')
  );
$$;

-- Update existing audit log functions that may have search_path issues
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(user_id uuid, user_name text)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    u.id,
    u.nome
  FROM public.usuarios u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_info RECORD;
BEGIN
  -- Obter informações do usuário atual
  SELECT * INTO user_info FROM public.get_current_user_info();
  
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action_type,
    user_id,
    user_name,
    old_values,
    new_values,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    user_info.user_id,
    user_info.user_name,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update audit logs policies to use our secure functions
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