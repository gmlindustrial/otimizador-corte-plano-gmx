import { describe, it, expect } from 'vitest'
import { BestFitOptimizer } from '../../src/algorithms/linear/BestFitOptimizer'
import type { OptimizationPiece } from '../../src/types/project'

describe('BestFitOptimizer', () => {
  it('should optimize simple pieces correctly', () => {
    const pieces: OptimizationPiece[] = [
      { id: '1', length: 1000, quantity: 2, tag: 'P1' },
      { id: '2', length: 2000, quantity: 1, tag: 'P2' }
    ]
    
    const optimizer = new BestFitOptimizer()
    const result = optimizer.optimize(pieces, 6000)
    
    expect(result.bars).toHaveLength(1)
    expect(result.bars[0].pieces).toHaveLength(3)
    expect(result.efficiency).toBeGreaterThan(0)
    expect(result.totalWaste).toBeLessThan(6000)
  })

  it('should handle pieces larger than bar length', () => {
    const pieces: OptimizationPiece[] = [
      { id: '1', length: 7000, quantity: 1, tag: 'P1' }
    ]
    
    const optimizer = new BestFitOptimizer()
    const result = optimizer.optimize(pieces, 6000)
    
    expect(result.bars).toHaveLength(1)
    expect(result.bars[0].pieces[0].length).toBe(7000)
    expect(result.totalWaste).toBe(0)
  })

  it('should maximize efficiency with multiple bar sizes', () => {
    const pieces: OptimizationPiece[] = [
      { id: '1', length: 2500, quantity: 4, tag: 'P1' },
      { id: '2', length: 1500, quantity: 2, tag: 'P2' }
    ]
    
    const optimizer = new BestFitOptimizer()
    const result = optimizer.optimize(pieces, 6000)
    
    expect(result.efficiency).toBeGreaterThan(80)
    expect(result.bars.every(bar => bar.totalLength <= 6000)).toBe(true)
  })
})