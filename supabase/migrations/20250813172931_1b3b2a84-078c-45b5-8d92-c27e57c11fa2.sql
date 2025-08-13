-- Adicionar colunas de status e vínculo com otimização na tabela projeto_pecas
ALTER TABLE public.projeto_pecas 
ADD COLUMN status text NOT NULL DEFAULT 'aguardando_otimizacao',
ADD COLUMN projeto_otimizacao_id uuid REFERENCES public.projeto_otimizacoes(id) ON DELETE SET NULL;

-- Adicionar constraint para validar valores de status
ALTER TABLE public.projeto_pecas 
ADD CONSTRAINT projeto_pecas_status_check 
CHECK (status IN ('aguardando_otimizacao', 'otimizada', 'cortada'));

-- Criar índices para melhorar performance
CREATE INDEX idx_projeto_pecas_status ON public.projeto_pecas(status);
CREATE INDEX idx_projeto_pecas_projeto_otimizacao ON public.projeto_pecas(projeto_otimizacao_id);
CREATE INDEX idx_projeto_pecas_projeto_status ON public.projeto_pecas(projeto_id, status);

-- Adicionar constraint única para evitar peças duplicadas
-- Considerando tag, posicao, comprimento_mm e perfil_id como identificadores únicos
CREATE UNIQUE INDEX idx_projeto_pecas_unique_combination 
ON public.projeto_pecas(projeto_id, COALESCE(tag, ''), posicao, comprimento_mm, COALESCE(perfil_id::text, ''));