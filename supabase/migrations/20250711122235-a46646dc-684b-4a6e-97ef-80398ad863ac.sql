-- Criar tabela para tamanhos de barras padrão
CREATE TABLE public.tamanhos_barras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comprimento INTEGER NOT NULL,
  descricao TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tamanhos_barras ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Permitir tudo em tamanhos_barras" 
ON public.tamanhos_barras 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Inserir tamanhos padrão
INSERT INTO public.tamanhos_barras (comprimento, descricao, is_default) VALUES
(6000, 'Barra padrão 6m', true),
(12000, 'Barra longa 12m', false),
(3000, 'Barra curta 3m', false);