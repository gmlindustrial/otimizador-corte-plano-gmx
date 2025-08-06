-- Corrigir função audit_trigger_function com search_path
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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