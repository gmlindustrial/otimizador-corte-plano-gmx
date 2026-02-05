-- Migration: Criar tabela projeto_chapas para armazenar chapas do projeto
-- Similar à projeto_pecas, mas para peças de corte 2D

CREATE TABLE public.projeto_chapas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,

  -- Identificacao
  tag text NOT NULL,                    -- Item numero do Inventor
  posicao text NOT NULL,                -- Projeto Numero
  descricao text,                       -- Descricao original (ex: "Chapa 6,4")

  -- Dimensoes
  largura_mm numeric NOT NULL,          -- Largura em mm
  altura_mm numeric NOT NULL,           -- Altura/comprimento em mm
  espessura_mm numeric,                 -- Espessura em mm

  -- Material (vinculo com tabela materiais)
  material_id uuid REFERENCES public.materiais(id) ON DELETE SET NULL,
  material_descricao_raw text,          -- Descricao original para matching
  material_nao_encontrado boolean DEFAULT false,

  -- Quantidades e status
  quantidade integer NOT NULL DEFAULT 1,
  peso numeric,                         -- Peso em kg
  fase text,                            -- Fase/modulo do projeto

  -- Status de otimizacao
  status text NOT NULL DEFAULT 'aguardando_otimizacao'
    CHECK (status IN ('aguardando_otimizacao', 'otimizada', 'cortada')),
  projeto_otimizacao_chapa_id uuid,     -- Vinculo com otimizacao (futuro)

  -- Metadados
  created_at timestamp with time zone DEFAULT now()
);

-- Indices
CREATE INDEX idx_projeto_chapas_projeto ON public.projeto_chapas(projeto_id);
CREATE INDEX idx_projeto_chapas_status ON public.projeto_chapas(status);
CREATE INDEX idx_projeto_chapas_espessura ON public.projeto_chapas(espessura_mm);
CREATE INDEX idx_projeto_chapas_material ON public.projeto_chapas(material_id);

-- Constraint unica para evitar duplicatas (mesma logica de projeto_pecas)
CREATE UNIQUE INDEX idx_projeto_chapas_unique
ON public.projeto_chapas(
  projeto_id,
  COALESCE(tag, ''),
  posicao,
  largura_mm,
  altura_mm,
  COALESCE(espessura_mm::text, '')
);

-- RLS (Row Level Security) - mesmo padrao das outras tabelas
ALTER TABLE public.projeto_chapas ENABLE ROW LEVEL SECURITY;

-- Politica para permitir acesso a usuarios autenticados
CREATE POLICY "Usuarios autenticados podem ver chapas de projetos"
  ON public.projeto_chapas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados podem inserir chapas"
  ON public.projeto_chapas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar chapas"
  ON public.projeto_chapas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem deletar chapas"
  ON public.projeto_chapas FOR DELETE
  TO authenticated
  USING (true);

-- Comentarios
COMMENT ON TABLE public.projeto_chapas IS 'Chapas do projeto para otimizacao de corte 2D';
COMMENT ON COLUMN public.projeto_chapas.tag IS 'Item numero do arquivo Inventor';
COMMENT ON COLUMN public.projeto_chapas.posicao IS 'Projeto Numero do arquivo';
COMMENT ON COLUMN public.projeto_chapas.espessura_mm IS 'Espessura da chapa em mm';
COMMENT ON COLUMN public.projeto_chapas.material_id IS 'Referencia ao material cadastrado (tipo_corte=chapa)';
COMMENT ON COLUMN public.projeto_chapas.status IS 'Status: aguardando_otimizacao, otimizada, cortada';
