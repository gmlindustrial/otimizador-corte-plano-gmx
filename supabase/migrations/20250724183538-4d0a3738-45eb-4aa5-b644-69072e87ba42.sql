-- Criar enum para tipos de ação no histórico
CREATE TYPE public.project_action_type AS ENUM (
  'PECA_CORTADA',
  'PECA_DELETADA', 
  'OTIMIZACAO_CRIADA',
  'OTIMIZACAO_DELETADA'
);

-- Criar enum para tipos de entidade
CREATE TYPE public.project_entity_type AS ENUM (
  'PECA',
  'OTIMIZACAO'
);

-- Criar tabela de histórico do projeto
CREATE TABLE public.project_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  action_type project_action_type NOT NULL,
  entity_type project_entity_type NOT NULL,
  entity_id TEXT NOT NULL,
  user_id UUID,
  user_name TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações aos usuários autenticados
CREATE POLICY "Authenticated users can manage project_history" 
ON public.project_history 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX idx_project_history_project_id ON public.project_history(project_id);
CREATE INDEX idx_project_history_timestamp ON public.project_history(timestamp DESC);
CREATE INDEX idx_project_history_action_type ON public.project_history(action_type);

-- Adicionar foreign key para projetos
ALTER TABLE public.project_history 
ADD CONSTRAINT fk_project_history_project_id 
FOREIGN KEY (project_id) REFERENCES public.projetos(id) ON DELETE CASCADE;