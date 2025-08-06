-- Corrigir função update_emendas_otimizacao_updated_at com search_path
CREATE OR REPLACE FUNCTION public.update_emendas_otimizacao_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;