-- Atualizar enum de status da serra para valores simplificados
ALTER TABLE public.serras DROP CONSTRAINT IF EXISTS serras_status_check;

-- Primeiro migrar dados existentes para novos status
UPDATE public.serras 
SET status = CASE 
  WHEN status = 'ativa' THEN 'ativada'
  WHEN status IN ('substituida', 'manutencao') THEN 'desativada'
  WHEN status IN ('cega', 'quebrada') THEN 'descartada'
  ELSE 'desativada'
END;

-- Adicionar nova constraint com os novos valores
ALTER TABLE public.serras 
ADD CONSTRAINT serras_status_check 
CHECK (status IN ('ativada', 'desativada', 'descartada'));