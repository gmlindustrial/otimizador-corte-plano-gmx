-- Tabela para registro de ocorrências/exceções durante corte (G11)
-- Protocolos para: barra defeituosa, corte errado, lâmina quebrou.

CREATE TABLE IF NOT EXISTS ocorrencias_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_otimizacao_id UUID REFERENCES projeto_otimizacoes(id) ON DELETE CASCADE,
  barra_id TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'barra_defeituosa',
    'corte_errado',
    'lamina_quebrou',
    'material_fora_especificacao',
    'parada_emergencia',
    'desvio_dimensional',
    'outro'
  )),
  severidade TEXT NOT NULL DEFAULT 'media' CHECK (severidade IN ('baixa', 'media', 'alta', 'critica')),
  descricao TEXT NOT NULL,
  acao_tomada TEXT,
  pecas_afetadas INTEGER DEFAULT 0,
  material_perdido_mm INTEGER DEFAULT 0,
  operador_id UUID REFERENCES operadores(id),
  resolvido BOOLEAN DEFAULT FALSE,
  resolvido_por UUID REFERENCES operadores(id),
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ocorrencias_corte_otimizacao ON ocorrencias_corte(projeto_otimizacao_id);
CREATE INDEX idx_ocorrencias_corte_tipo ON ocorrencias_corte(tipo);
CREATE INDEX idx_ocorrencias_corte_resolvido ON ocorrencias_corte(resolvido);

COMMENT ON TABLE ocorrencias_corte IS
  'Registro de ocorrências e exceções durante o processo de corte. Permite rastreabilidade de falhas e ações corretivas.';
