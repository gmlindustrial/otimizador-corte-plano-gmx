-- Atualizar enum de status da serra para incluir novos valores
ALTER TABLE serras 
DROP CONSTRAINT IF EXISTS serras_status_check;

ALTER TABLE serras 
ADD CONSTRAINT serras_status_check 
CHECK (status IN ('ativa', 'substituida', 'manutencao', 'cega', 'quebrada'));

-- Adicionar novos campos na tabela serra_uso_cortes para melhor rastreamento
ALTER TABLE serra_uso_cortes 
ADD COLUMN IF NOT EXISTS peca_posicao text,
ADD COLUMN IF NOT EXISTS peca_tag text,
ADD COLUMN IF NOT EXISTS perfil_id uuid;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_serra_uso_cortes_perfil_id ON serra_uso_cortes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_serra_uso_cortes_peca_posicao ON serra_uso_cortes(peca_posicao);

-- Atualizar trigger para serras
DROP TRIGGER IF EXISTS update_serras_updated_at_trigger ON serras;
CREATE TRIGGER update_serras_updated_at_trigger
    BEFORE UPDATE ON serras
    FOR EACH ROW
    EXECUTE FUNCTION update_serras_updated_at();