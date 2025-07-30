-- Remove a coluna conjunto e adiciona a nova coluna fase
ALTER TABLE projeto_pecas DROP COLUMN IF EXISTS conjunto;
ALTER TABLE projeto_pecas ADD COLUMN fase text;