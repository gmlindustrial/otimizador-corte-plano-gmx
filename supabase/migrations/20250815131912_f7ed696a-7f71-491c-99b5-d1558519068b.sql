-- Adicionar coluna corte à tabela projeto_pecas
ALTER TABLE public.projeto_pecas ADD COLUMN corte boolean NOT NULL DEFAULT false;

-- Criar índice para melhor performance nas consultas de estatísticas
CREATE INDEX idx_projeto_pecas_corte ON public.projeto_pecas(projeto_id, corte);

-- Atualizar peças já cortadas baseadas no status atual (se existirem)
-- UPDATE public.projeto_pecas SET corte = true WHERE status = 'cortada';