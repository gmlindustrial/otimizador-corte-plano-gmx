-- Corrigir campo fase nas peças da Lista 2
-- Copiar o campo fase das peças originais para as peças da otimização

DO $$
DECLARE
    pieces_updated INTEGER := 0;
    piece_record RECORD;
BEGIN
    RAISE NOTICE 'Corrigindo campo fase nas peças da Lista 2...';
    
    -- Atualizar peças da Lista 2 com o campo fase das peças originais
    FOR piece_record IN 
        SELECT DISTINCT
            pp_new.id as new_piece_id,
            pp_new.tag as new_tag,
            pp_new.posicao as new_posicao,
            pp_original.fase as original_fase
        FROM projeto_pecas pp_new
        INNER JOIN projeto_pecas pp_original 
            ON pp_new.projeto_id = pp_original.projeto_id
            AND pp_new.tag = pp_original.tag 
            AND pp_new.posicao = pp_original.posicao
        WHERE pp_new.projeto_otimizacao_id = '393d0cec-f878-47e2-9916-1d066e4cb857'
        AND pp_new.fase IS NULL
        AND pp_original.fase IS NOT NULL
        AND pp_original.projeto_otimizacao_id IS NULL
    LOOP
        -- Atualizar a peça nova com a fase da peça original
        UPDATE projeto_pecas 
        SET fase = piece_record.original_fase
        WHERE id = piece_record.new_piece_id;
        
        pieces_updated := pieces_updated + 1;
        
        RAISE NOTICE 'Atualizada peça % (posição: %) com fase: %', 
            piece_record.new_tag, 
            piece_record.new_posicao, 
            piece_record.original_fase;
    END LOOP;
    
    RAISE NOTICE 'CORREÇÃO CONCLUÍDA: % peças da Lista 2 tiveram o campo fase corrigido', pieces_updated;
    
    -- Mostrar estatísticas finais
    RAISE NOTICE 'Verificando peças da Lista 2 após correção:';
    RAISE NOTICE '- Peças com fase definida: %', (
        SELECT COUNT(*) 
        FROM projeto_pecas 
        WHERE projeto_otimizacao_id = '393d0cec-f878-47e2-9916-1d066e4cb857' 
        AND fase IS NOT NULL
    );
    RAISE NOTICE '- Peças sem fase: %', (
        SELECT COUNT(*) 
        FROM projeto_pecas 
        WHERE projeto_otimizacao_id = '393d0cec-f878-47e2-9916-1d066e4cb857' 
        AND fase IS NULL
    );
    
END $$;