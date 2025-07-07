-- Remover a constraint existente que não permite DELETE CASCADE
ALTER TABLE public.historico_otimizacoes
DROP CONSTRAINT IF EXISTS historico_otimizacoes_projeto_id_fkey;

-- Recriar a constraint com DELETE CASCADE
ALTER TABLE public.historico_otimizacoes
ADD CONSTRAINT historico_otimizacoes_projeto_id_fkey
FOREIGN KEY (projeto_id) REFERENCES public.projetos(id)
ON DELETE CASCADE;

-- Também adicionar CASCADE para estoque_sobras se necessário
ALTER TABLE public.estoque_sobras
DROP CONSTRAINT IF EXISTS estoque_sobras_projeto_origem_fkey;

ALTER TABLE public.estoque_sobras
ADD CONSTRAINT estoque_sobras_projeto_origem_fkey
FOREIGN KEY (projeto_origem) REFERENCES public.projetos(id)
ON DELETE CASCADE;