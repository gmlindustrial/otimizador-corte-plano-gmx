-- Criar tabela de serras
CREATE TABLE public.serras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  data_instalacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'substituida', 'manutencao')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de substituições de serra
CREATE TABLE public.serra_substituicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serra_anterior_id UUID NOT NULL REFERENCES public.serras(id),
  serra_nova_id UUID NOT NULL REFERENCES public.serras(id),
  data_substituicao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  motivo TEXT NOT NULL,
  operador_id UUID REFERENCES public.operadores(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de uso de serras para cortes
CREATE TABLE public.serra_uso_cortes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serra_id UUID NOT NULL REFERENCES public.serras(id),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id),
  otimizacao_id UUID REFERENCES public.projeto_otimizacoes(id),
  peca_id UUID REFERENCES public.projeto_pecas(id),
  quantidade_cortada INTEGER NOT NULL DEFAULT 1,
  operador_id UUID REFERENCES public.operadores(id),
  data_corte TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.serras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serra_substituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serra_uso_cortes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para serras
CREATE POLICY "Authenticated users can manage serras" 
ON public.serras 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar políticas RLS para serra_substituicoes
CREATE POLICY "Authenticated users can manage serra_substituicoes" 
ON public.serra_substituicoes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar políticas RLS para serra_uso_cortes
CREATE POLICY "Authenticated users can manage serra_uso_cortes" 
ON public.serra_uso_cortes 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_serras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamps
CREATE TRIGGER update_serras_updated_at
  BEFORE UPDATE ON public.serras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_serras_updated_at();

-- Criar índices para melhor performance
CREATE INDEX idx_serras_codigo ON public.serras(codigo);
CREATE INDEX idx_serras_status ON public.serras(status);
CREATE INDEX idx_serra_uso_cortes_serra_id ON public.serra_uso_cortes(serra_id);
CREATE INDEX idx_serra_uso_cortes_projeto_id ON public.serra_uso_cortes(projeto_id);
CREATE INDEX idx_serra_uso_cortes_data_corte ON public.serra_uso_cortes(data_corte);