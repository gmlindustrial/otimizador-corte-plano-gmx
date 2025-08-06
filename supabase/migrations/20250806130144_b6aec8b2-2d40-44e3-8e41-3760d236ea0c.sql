-- Criar tabela para histórico de status das serras
CREATE TABLE public.serra_status_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serra_id UUID NOT NULL REFERENCES public.serras(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  data_mudanca TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  motivo TEXT,
  operador_id UUID REFERENCES public.operadores(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.serra_status_historico ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage serra_status_historico" 
ON public.serra_status_historico 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX idx_serra_status_historico_serra_id ON public.serra_status_historico(serra_id);
CREATE INDEX idx_serra_status_historico_data_mudanca ON public.serra_status_historico(data_mudanca);

-- Criar função para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.registrar_mudanca_status_serra()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para registrar mudanças automaticamente
CREATE TRIGGER trigger_serra_status_change
  AFTER UPDATE ON public.serras
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_mudanca_status_serra();

-- Migrar dados existentes - criar registro inicial para cada serra
INSERT INTO public.serra_status_historico (serra_id, status_anterior, status_novo, data_mudanca, motivo)
SELECT 
  id,
  NULL,
  status,
  data_instalacao,
  'Registro inicial - migração de dados'
FROM public.serras
WHERE NOT EXISTS (
  SELECT 1 FROM public.serra_status_historico 
  WHERE serra_id = serras.id
);