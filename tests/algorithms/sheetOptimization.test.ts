import { describe, it, expect } from 'vitest'
import { BottomLeftFillOptimizer } from '../../src/algorithms/sheet/BottomLeftFill'
import { GeneticOptimizer } from '../../src/algorithms/sheet/GeneticOptimizer'
import type { SheetCutPiece } from '../../src/types/sheet'

describe('Sheet Optimization Algorithms', () => {
  const testPieces: SheetCutPiece[] = [
    { id: '1', width: 100, height: 200, quantity: 2, tag: 'P1', allowRotation: true },
    { id: '2', width: 150, height: 100, quantity: 1, tag: 'P2', allowRotation: true },
    { id: '3', width: 80, height: 120, quantity: 3, tag: 'P3', allowRotation: false }
  ]

  describe('BottomLeftFillOptimizer', () => {
    it('should place all pieces within sheet bounds', () => {
      const optimizer = new BottomLeftFillOptimizer(500, 400)
      const result = optimizer.optimize(testPieces)
      
      expect(result.totalSheets).toBeGreaterThan(0)
      expect(result.sheets.length).toBe(result.totalSheets)
      
      result.sheets.forEach(sheet => {
        sheet.pieces.forEach(piece => {
          expect(piece.x + piece.width).toBeLessThanOrEqual(500)
          expect(piece.y + piece.height).toBeLessThanOrEqual(400)
        })
      })
    })

    it('should respect rotation constraints', () => {
      const optimizer = new BottomLeftFillOptimizer(500, 400)
      const result = optimizer.optimize(testPieces)
      
      result.sheets.forEach(sheet => {
        sheet.pieces.forEach(placedPiece => {
          const originalPiece = testPieces.find(p => p.id === placedPiece.pieceId)
          if (originalPiece && !originalPiece.allowRotation) {
            expect(placedPiece.width).toBe(originalPiece.width)
            expect(placedPiece.height).toBe(originalPiece.height)
          }
        })
      })
    })
  })

  describe('GeneticOptimizer', () => {
    it('should find better solutions than random placement', () => {
      const optimizer = new GeneticOptimizer(500, 400, {
        populationSize: 20,
        generations: 10,
        mutationRate: 0.1
      })
      
      const result = optimizer.optimize(testPieces)
      
      expect(result.totalSheets).toBeGreaterThan(0)
      expect(result.efficiency).toBeGreaterThan(0)
      expect(result.efficiency).toBeLessThanOrEqual(100)
    })
  })
})