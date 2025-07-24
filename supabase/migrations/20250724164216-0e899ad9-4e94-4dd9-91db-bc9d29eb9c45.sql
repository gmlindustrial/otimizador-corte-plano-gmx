-- PHASE 1A: Enable RLS and create security functions

-- 1. Enable RLS on usuarios table
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = user_id;
$$;

-- 3. Create function to check if user is admin
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