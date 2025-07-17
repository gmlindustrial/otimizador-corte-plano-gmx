-- Adicionar coluna peso na tabela projeto_pecas
ALTER TABLE projeto_pecas 
ADD COLUMN peso NUMERIC;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN projeto_pecas.peso IS 'Peso total da peça extraído do arquivo CAD (kg)';