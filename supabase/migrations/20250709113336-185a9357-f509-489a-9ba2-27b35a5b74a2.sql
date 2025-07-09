-- Criar tabela para perfis de materiais
CREATE TABLE public.perfis_materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao_perfil TEXT NOT NULL,
  kg_por_metro DECIMAL(10,4) NOT NULL,
  tipo_perfil TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para peças do projeto
CREATE TABLE public.projeto_pecas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL,
  tag_peca TEXT NOT NULL,
  conjunto TEXT,
  perfil_id UUID,
  descricao_perfil_raw TEXT,
  comprimento_mm INTEGER NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  peso_por_metro DECIMAL(10,4),
  perfil_nao_encontrado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (perfil_id) REFERENCES public.perfis_materiais(id) ON DELETE SET NULL
);

-- Criar tabela para otimizações do projeto
CREATE TABLE public.projeto_otimizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL,
  nome_lista TEXT NOT NULL,
  perfil_id UUID,
  tamanho_barra INTEGER NOT NULL,
  pecas_selecionadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  resultados JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (perfil_id) REFERENCES public.perfis_materiais(id) ON DELETE SET NULL
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.perfis_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_otimizacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para todas as tabelas (seguindo o padrão do projeto)
CREATE POLICY "Permitir tudo em perfis_materiais" 
ON public.perfis_materiais 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir tudo em projeto_pecas" 
ON public.projeto_pecas 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir tudo em projeto_otimizacoes" 
ON public.projeto_otimizacoes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Popular tabela de perfis com alguns exemplos comuns
INSERT INTO public.perfis_materiais (descricao_perfil, kg_por_metro, tipo_perfil) VALUES
('Cantoneira L 2"x1/4"', 2.38, 'L'),
('Cantoneira L 3"x1/4"', 3.57, 'L'),
('Cantoneira L 4"x1/4"', 4.76, 'L'),
('Perfil U 3"x1/4"', 4.68, 'U'),
('Perfil U 4"x1/4"', 6.24, 'U'),
('Perfil U 6"x1/4"', 9.36, 'U'),
('Viga I 6"', 12.00, 'I'),
('Viga I 8"', 18.40, 'I'),
('Viga I 10"', 25.40, 'I'),
('Perfil W 150x22.5', 22.50, 'W'),
('Perfil W 200x26.6', 26.60, 'W'),
('Perfil T 2"x1/4"', 1.75, 'T'),
('Barra Chata 1/4"x2"', 3.93, 'Barra Chata'),
('Barra Chata 1/4"x3"', 5.90, 'Barra Chata'),
('Tubo Redondo 2"', 4.69, 'Tubo Redondo'),
('Tubo Redondo 3"', 7.03, 'Tubo Redondo'),
('Tubo Quadrado 2"x2"', 5.41, 'Tubo Quadrado'),
('Tubo Quadrado 3"x3"', 8.11, 'Tubo Quadrado');

-- Criar índices para melhor performance
CREATE INDEX idx_perfis_materiais_descricao ON public.perfis_materiais(descricao_perfil);
CREATE INDEX idx_perfis_materiais_tipo ON public.perfis_materiais(tipo_perfil);
CREATE INDEX idx_projeto_pecas_projeto_id ON public.projeto_pecas(projeto_id);
CREATE INDEX idx_projeto_pecas_perfil_id ON public.projeto_pecas(perfil_id);
CREATE INDEX idx_projeto_otimizacoes_projeto_id ON public.projeto_otimizacoes(projeto_id);