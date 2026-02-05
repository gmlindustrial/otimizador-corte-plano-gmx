-- Migration: Alterar comprimento_mm de INTEGER para NUMERIC
-- Motivo: Permitir valores decimais como 507.8mm que vem do Inventor

-- Alterar tipo da coluna comprimento_mm
ALTER TABLE public.projeto_pecas
ALTER COLUMN comprimento_mm TYPE NUMERIC USING comprimento_mm::NUMERIC;

-- Comentário para documentação
COMMENT ON COLUMN public.projeto_pecas.comprimento_mm IS 'Comprimento da peça em mm (permite decimais)';
