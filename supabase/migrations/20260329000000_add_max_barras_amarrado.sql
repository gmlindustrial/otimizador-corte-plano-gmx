-- Adiciona campo max_barras_amarrado ao perfil de material
-- Usado para otimização em amarrado (bundle cutting):
-- define quantas barras do mesmo perfil a serra fita corta simultaneamente.
-- Default 1 = sem amarrado (comportamento atual).

ALTER TABLE perfis_materiais
ADD COLUMN IF NOT EXISTS max_barras_amarrado INTEGER DEFAULT 1;

-- Constraint: mínimo 1, máximo 20 barras por amarrado
ALTER TABLE perfis_materiais
ADD CONSTRAINT check_max_barras_amarrado
CHECK (max_barras_amarrado >= 1 AND max_barras_amarrado <= 20);

COMMENT ON COLUMN perfis_materiais.max_barras_amarrado IS
  'Máximo de barras cortadas simultaneamente na serra fita (amarrado). 1 = corte individual.';
