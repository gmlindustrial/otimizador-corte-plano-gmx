-- Atualizar peças já cortadas baseadas no status atual (se existirem)
UPDATE public.projeto_pecas SET corte = true WHERE status = 'cortada';