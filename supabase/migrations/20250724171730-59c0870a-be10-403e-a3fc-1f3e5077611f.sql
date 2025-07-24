-- Criar tabela para armazenar informações de emendas na otimização
CREATE TABLE IF NOT EXISTS public.emendas_otimizacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_otimizacao_id UUID REFERENCES public.projeto_otimizacoes(id) ON DELETE CASCADE,
  peca_id TEXT NOT NULL,
  peca_tag TEXT,
  comprimento_original INTEGER NOT NULL,
  quantidade_emendas INTEGER NOT NULL DEFAULT 0,
  segmentos JSONB NOT NULL DEFAULT '[]'::jsonb,
  emendas JSONB NOT NULL DEFAULT '[]'::jsonb,
  status_qualidade TEXT NOT NULL DEFAULT 'pendente' CHECK (status_qualidade IN ('pendente', 'aprovada', 'reprovada')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.emendas_otimizacao ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações para usuários autenticados
CREATE POLICY "Permitir tudo em emendas_otimizacao" 
ON public.emendas_otimizacao 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_emendas_otimizacao_projeto_id 
ON public.emendas_otimizacao(projeto_otimizacao_id);

CREATE INDEX IF NOT EXISTS idx_emendas_otimizacao_peca_id 
ON public.emendas_otimizacao(peca_id);

CREATE INDEX IF NOT EXISTS idx_emendas_otimizacao_status 
ON public.emendas_otimizacao(status_qualidade);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_emendas_otimizacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_emendas_otimizacao_updated_at
  BEFORE UPDATE ON public.emendas_otimizacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_emendas_otimizacao_updated_at();