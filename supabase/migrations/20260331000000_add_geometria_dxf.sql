-- Adiciona campo para preservar geometria complexa de peças DXF
-- Armazena: { type, points[], holes[], boundingBox, area, perimeter }

ALTER TABLE projeto_chapas ADD COLUMN IF NOT EXISTS geometria_dxf JSONB;

COMMENT ON COLUMN projeto_chapas.geometria_dxf IS
  'Geometria complexa importada de DXF (contorno, furos, polígonos). NULL para peças retangulares simples.';
