-- Tabela para registro de inspeção pré-corte (G14)
-- Operador ou inspetor verifica material antes de autorizar o corte.

CREATE TABLE IF NOT EXISTS inspecao_pre_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_otimizacao_id UUID REFERENCES projeto_otimizacoes(id) ON DELETE CASCADE,
  material_id UUID,
  inspetor_id UUID REFERENCES inspetores_qa(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'condicional')),
  tipo_inspecao TEXT NOT NULL DEFAULT 'visual' CHECK (tipo_inspecao IN ('visual', 'dimensional', 'ultrassom', 'magnetica', 'completa')),
  observacoes TEXT,
  defeitos_encontrados TEXT[],
  foto_evidencia TEXT,
  data_inspecao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspecao_pre_corte_otimizacao ON inspecao_pre_corte(projeto_otimizacao_id);
CREATE INDEX idx_inspecao_pre_corte_status ON inspecao_pre_corte(status);

COMMENT ON TABLE inspecao_pre_corte IS
  'Registro de inspeção pré-corte. Material deve ser aprovado antes de ser cortado.';
