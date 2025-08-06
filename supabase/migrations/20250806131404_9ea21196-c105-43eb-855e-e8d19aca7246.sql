-- Renomear tabelas de serra para lamina
ALTER TABLE serras RENAME TO laminas;
ALTER TABLE serra_status_historico RENAME TO lamina_status_historico;
ALTER TABLE serra_substituicoes RENAME TO lamina_substituicoes;
ALTER TABLE serra_uso_cortes RENAME TO lamina_uso_cortes;

-- Renomear colunas que referenciam serra
ALTER TABLE lamina_status_historico RENAME COLUMN serra_id TO lamina_id;
ALTER TABLE lamina_substituicoes RENAME COLUMN serra_anterior_id TO lamina_anterior_id;
ALTER TABLE lamina_substituicoes RENAME COLUMN serra_nova_id TO lamina_nova_id;
ALTER TABLE lamina_uso_cortes RENAME COLUMN serra_id TO lamina_id;

-- Renomear função
ALTER FUNCTION registrar_mudanca_status_serra() RENAME TO registrar_mudanca_status_lamina;

-- Recriar trigger para a nova tabela
DROP TRIGGER IF EXISTS trigger_mudanca_status_serra ON serras;
CREATE TRIGGER trigger_mudanca_status_lamina
  BEFORE UPDATE ON laminas
  FOR EACH ROW
  EXECUTE FUNCTION registrar_mudanca_status_lamina();

-- Recriar trigger de update timestamp
DROP TRIGGER IF EXISTS update_serras_updated_at ON serras;
CREATE TRIGGER update_laminas_updated_at
  BEFORE UPDATE ON laminas
  FOR EACH ROW
  EXECUTE FUNCTION update_serras_updated_at();

-- Renomear função de update timestamp
ALTER FUNCTION update_serras_updated_at() RENAME TO update_laminas_updated_at;