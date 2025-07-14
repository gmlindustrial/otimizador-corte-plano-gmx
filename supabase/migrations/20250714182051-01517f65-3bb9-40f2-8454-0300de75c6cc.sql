-- Migração para alterar campos: conjunto → tag, tag_peca → posicao
-- Remover campo conjunto

-- Primeiro, adicionar a nova coluna 'tag'
ALTER TABLE public.projeto_pecas 
ADD COLUMN tag text;

-- Migrar dados: conjunto → novo campo tag
UPDATE public.projeto_pecas 
SET tag = conjunto 
WHERE conjunto IS NOT NULL;

-- Renomear tag_peca para posicao
ALTER TABLE public.projeto_pecas 
RENAME COLUMN tag_peca TO posicao;

-- Remover a coluna conjunto
ALTER TABLE public.projeto_pecas 
DROP COLUMN conjunto;

-- Atualizar constraints se necessário
ALTER TABLE public.projeto_pecas 
ALTER COLUMN posicao SET NOT NULL;