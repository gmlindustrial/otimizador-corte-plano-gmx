
-- Adicionar campo tipo_corte na tabela materiais
ALTER TABLE public.materiais 
ADD COLUMN tipo_corte TEXT NOT NULL DEFAULT 'barra' 
CHECK (tipo_corte IN ('barra', 'chapa'));

-- Atualizar materiais existentes para definir o tipo de corte
-- Por padrão, vamos considerar todos como 'barra' inicialmente
UPDATE public.materiais 
SET tipo_corte = 'barra' 
WHERE tipo_corte IS NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_materiais_tipo_corte ON public.materiais(tipo_corte);
