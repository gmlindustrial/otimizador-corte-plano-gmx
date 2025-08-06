-- Corrigir função para ter search_path seguro
CREATE OR REPLACE FUNCTION public.registrar_mudanca_status_serra()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Só registra se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.serra_status_historico (
      serra_id,
      status_anterior,
      status_novo,
      data_mudanca,
      motivo
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      now(),
      'Mudança automática via sistema'
    );
  END IF;
  
  RETURN NEW;
END;
$$;