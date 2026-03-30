-- Tabela para registrar execução real vs planejado (G15)
-- Operador registra o que foi realmente cortado após otimização.

CREATE TABLE IF NOT EXISTS execucao_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_otimizacao_id UUID REFERENCES projeto_otimizacoes(id) ON DELETE CASCADE,
  barra_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'desvio', 'rejeitado')),
  observacoes TEXT,
  operador_id UUID REFERENCES operadores(id),
  data_execucao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execucao_corte_otimizacao ON execucao_corte(projeto_otimizacao_id);

COMMENT ON TABLE execucao_corte IS
  'Registro de execução real dos cortes vs planejado. Permite rastreabilidade do que foi cortado.';
