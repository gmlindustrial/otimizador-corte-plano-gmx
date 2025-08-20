-- Inserir peças da Lista 2 - W310x28.3 na tabela projeto_pecas
-- Baseado nos resultados JSON da otimização 393d0cec-f878-47e2-9916-1d066e4cb857

DO $$
DECLARE
    optimization_id UUID := '393d0cec-f878-47e2-9916-1d066e4cb857';
    project_id UUID := '67018f44-2bec-4395-8530-49e44602552d';
    profile_id UUID := '55766d92-d087-40e4-90ce-95f17c411b7c';
    profile_kg_per_meter NUMERIC := 28.3;
    piece_record RECORD;
    pieces_inserted INTEGER := 0;
BEGIN
    RAISE NOTICE 'Inserindo peças da Lista 2 - W310x28.3...';
    
    -- Inserir todas as peças extraídas dos resultados JSON
    FOR piece_record IN 
        SELECT DISTINCT
            piece_data->>'tag' as piece_tag,
            piece_data->>'posicao' as piece_posicao,
            (piece_data->>'length_mm')::integer as piece_length_mm,
            (piece_data->>'weight')::numeric as piece_weight,
            (piece_data->>'cortada')::boolean as piece_cortada
        FROM projeto_otimizacoes po,
             jsonb_array_elements(po.resultados::jsonb->'bars') as bar_data,
             jsonb_array_elements(bar_data->'pieces') as piece_data
        WHERE po.id = optimization_id
        AND piece_data ? 'tag'
        AND piece_data ? 'posicao'
        AND piece_data->>'tag' IS NOT NULL
        AND piece_data->>'posicao' IS NOT NULL
    LOOP
        -- Verificar se a peça já existe para evitar duplicatas
        IF NOT EXISTS (
            SELECT 1 FROM projeto_pecas 
            WHERE projeto_id = project_id 
            AND tag = piece_record.piece_tag 
            AND posicao = piece_record.piece_posicao
        ) THEN
            -- Inserir a peça
            INSERT INTO projeto_pecas (
                projeto_id,
                posicao,
                tag,
                perfil_id,
                comprimento_mm,
                quantidade,
                peso_por_metro,
                peso,
                perfil_nao_encontrado,
                status,
                corte,
                projeto_otimizacao_id
            ) VALUES (
                project_id,
                piece_record.piece_posicao,
                piece_record.piece_tag,
                profile_id,
                piece_record.piece_length_mm,
                1, -- quantidade padrão
                profile_kg_per_meter,
                piece_record.piece_weight,
                false, -- perfil encontrado
                'otimizada', -- status otimizada
                piece_record.piece_cortada, -- status de corte
                optimization_id
            );
            
            pieces_inserted := pieces_inserted + 1;
            
            RAISE NOTICE 'Inserida peça: % (posição: %, comprimento: %mm, peso: %kg, cortada: %)', 
                piece_record.piece_tag, 
                piece_record.piece_posicao, 
                piece_record.piece_length_mm, 
                piece_record.piece_weight,
                piece_record.piece_cortada;
        ELSE
            RAISE NOTICE 'Peça já existe: % (posição: %)', 
                piece_record.piece_tag, piece_record.piece_posicao;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'INSERÇÃO CONCLUÍDA: % peças da Lista 2 inseridas na tabela projeto_pecas', pieces_inserted;
    
    -- Mostrar estatísticas finais
    RAISE NOTICE 'Estatísticas finais da Lista 2:';
    RAISE NOTICE '- Total de peças inseridas: %', pieces_inserted;
    RAISE NOTICE '- Projeto ID: %', project_id;
    RAISE NOTICE '- Perfil ID: % (W310x28.3)', profile_id;
    RAISE NOTICE '- Otimização ID: %', optimization_id;
    
END $$;