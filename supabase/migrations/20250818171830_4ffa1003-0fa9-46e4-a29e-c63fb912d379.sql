-- Sincronizar dados existentes: extrair peças cortadas dos JSONs de resultados
-- e atualizar a coluna corte correspondente na tabela projeto_pecas

DO $$
DECLARE
    optimization_record RECORD;
    bar_data JSONB;
    piece_data JSONB;
    piece_id TEXT;
BEGIN
    -- Percorrer todas as otimizações que têm resultados
    FOR optimization_record IN 
        SELECT id, projeto_id, resultados 
        FROM projeto_otimizacoes 
        WHERE resultados IS NOT NULL 
        AND resultados::jsonb ? 'bars'
    LOOP
        -- Percorrer todas as barras nos resultados
        FOR bar_data IN 
            SELECT jsonb_array_elements(optimization_record.resultados::jsonb->'bars')
        LOOP
            -- Verificar se a barra tem peças
            IF bar_data ? 'pieces' THEN
                -- Percorrer todas as peças da barra
                FOR piece_data IN 
                    SELECT jsonb_array_elements(bar_data->'pieces')
                LOOP
                    -- Verificar se a peça tem ID e está marcada como cortada
                    IF piece_data ? 'id' AND piece_data ? 'cortada' AND (piece_data->>'cortada')::boolean = true THEN
                        piece_id := piece_data->>'id';
                        
                        -- Atualizar a coluna corte para true
                        UPDATE projeto_pecas 
                        SET corte = true 
                        WHERE id::text = piece_id 
                        AND projeto_id = optimization_record.projeto_id;
                        
                        RAISE NOTICE 'Sincronizada peça cortada: %', piece_id;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;