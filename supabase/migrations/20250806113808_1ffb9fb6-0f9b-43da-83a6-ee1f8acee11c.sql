-- Corrigir funções com search_path mutable
CREATE OR REPLACE FUNCTION public.update_serras_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;