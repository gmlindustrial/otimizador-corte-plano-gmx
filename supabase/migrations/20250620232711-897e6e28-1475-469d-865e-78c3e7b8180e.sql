
-- Criar tabela para histórico de otimização de chapas
CREATE TABLE public.sheet_optimization_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  project_name text NOT NULL,
  pieces jsonb NOT NULL,
  results jsonb NOT NULL,
  algorithm text NOT NULL DEFAULT 'MultiObjective',
  optimization_time integer NOT NULL DEFAULT 0,
  efficiency numeric NOT NULL DEFAULT 0,
  total_sheets integer NOT NULL DEFAULT 0,
  total_weight numeric NOT NULL DEFAULT 0,
  material_cost numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Adicionar índices para performance
CREATE INDEX idx_sheet_optimization_history_project_id ON public.sheet_optimization_history(project_id);
CREATE INDEX idx_sheet_optimization_history_created_at ON public.sheet_optimization_history(created_at);
CREATE INDEX idx_sheet_optimization_history_efficiency ON public.sheet_optimization_history(efficiency);

-- RLS (Row Level Security) - permitir acesso público por enquanto
ALTER TABLE public.sheet_optimization_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (será refinada depois)
CREATE POLICY "Allow all operations on sheet_optimization_history" 
  ON public.sheet_optimization_history 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
