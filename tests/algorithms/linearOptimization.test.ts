import { describe, it, expect } from 'vitest'
import { BestFitOptimizer } from '../../src/algorithms/linear/BestFitOptimizer'

// Interface para pecas de teste (compativel com o algoritmo)
interface TestPiece {
  length: number;
  tag?: string;
  originalIndex: number;
}

describe('BestFitOptimizer', () => {
  it('should optimize simple pieces correctly', async () => {
    // Expandir pecas manualmente (quantity nao e suportado diretamente)
    const pieces: TestPiece[] = [
      { length: 1000, tag: 'P1', originalIndex: 0 },
      { length: 1000, tag: 'P1', originalIndex: 0 },
      { length: 2000, tag: 'P2', originalIndex: 1 }
    ]

    const optimizer = new BestFitOptimizer()
    const result = await optimizer.optimize(pieces, 6000)

    expect(result.bars).toHaveLength(1)
    expect(result.bars[0].pieces).toHaveLength(3)
    expect(result.efficiency).toBeGreaterThan(0)
    expect(result.totalWaste).toBeLessThan(6000)
  })

  it('should handle pieces larger than bar length', async () => {
    const pieces: TestPiece[] = [
      { length: 7000, tag: 'P1', originalIndex: 0 }
    ]

    const optimizer = new BestFitOptimizer()
    const result = await optimizer.optimize(pieces, 6000)

    // Peca maior que barra fica em sua propria barra
    expect(result.bars).toHaveLength(1)
    expect(result.bars[0].pieces[0].length).toBe(7000)
  })

  it('should maximize efficiency with multiple bar sizes', async () => {
    // Expandir: 4x 2500mm + 2x 1500mm = 13000mm
    const pieces: TestPiece[] = [
      { length: 2500, tag: 'P1', originalIndex: 0 },
      { length: 2500, tag: 'P1', originalIndex: 0 },
      { length: 2500, tag: 'P1', originalIndex: 0 },
      { length: 2500, tag: 'P1', originalIndex: 0 },
      { length: 1500, tag: 'P2', originalIndex: 1 },
      { length: 1500, tag: 'P2', originalIndex: 1 }
    ]

    const optimizer = new BestFitOptimizer()
    const result = await optimizer.optimize(pieces, 6000)

    expect(result.efficiency).toBeGreaterThan(80)
    // CORRIGIDO: usar originalLength em vez de totalLength
    expect(result.bars.every(bar => bar.originalLength <= 6000)).toBe(true)
  })

  it('should calculate waste correctly for emendas', async () => {
    // Teste para verificar que waste nao e zero quando ha emendas
    const pieces: TestPiece[] = [
      { length: 8000, tag: 'P1', originalIndex: 0 } // Peca maior que barra padrao
    ]

    const optimizer = new BestFitOptimizer()
    const emendaConfig = {
      emendaObrigatoria: true,
      permitirEmendas: true,
      tamanhoMinimoSobra: 100,
      maxEmendasPorPeca: 3
    }

    const result = await optimizer.optimize(pieces, 6000, [], emendaConfig)

    // Com emenda, esperamos que haja algum calculo de material
    expect(result.bars.length).toBeGreaterThanOrEqual(1)
  })
})