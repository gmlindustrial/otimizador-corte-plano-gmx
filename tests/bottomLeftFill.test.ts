import { describe, it, expect } from 'vitest'
import { BottomLeftFillOptimizer } from '../src/algorithms/sheet/BottomLeftFill'
import type { SheetCutPiece } from '../src/types/sheet'

describe('BottomLeftFillOptimizer', () => {
  it('places two small rectangles on one sheet', () => {
    const optimizer = new BottomLeftFillOptimizer(500, 500)
    const pieces: SheetCutPiece[] = [
      { id: '1', width: 100, height: 100, quantity: 1, tag: 'P1', allowRotation: false },
      { id: '2', width: 100, height: 100, quantity: 1, tag: 'P2', allowRotation: false }
    ]

    const result = optimizer.optimize(pieces)

    expect(result.totalSheets).toBe(1)
    expect(result.sheets).toHaveLength(1)
    expect(result.sheets[0].pieces).toHaveLength(2)
  })
})
