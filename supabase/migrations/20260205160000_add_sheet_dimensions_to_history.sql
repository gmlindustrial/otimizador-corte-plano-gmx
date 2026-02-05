-- Migration: Adicionar dimensoes da chapa de estoque no historico de otimizacao
-- Motivo: SheetVisualization precisa dessas dimensoes para calcular escala correta

-- Adicionar colunas para dimensoes da chapa de estoque
ALTER TABLE public.sheet_optimization_history
ADD COLUMN IF NOT EXISTS sheet_width numeric,
ADD COLUMN IF NOT EXISTS sheet_height numeric;

-- Comentarios para documentacao
COMMENT ON COLUMN public.sheet_optimization_history.sheet_width IS 'Largura da chapa de estoque usada na otimizacao (mm)';
COMMENT ON COLUMN public.sheet_optimization_history.sheet_height IS 'Altura da chapa de estoque usada na otimizacao (mm)';
