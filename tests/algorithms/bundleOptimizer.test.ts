import { describe, it, expect, beforeEach } from 'vitest';
import { BundleOptimizer } from '@/algorithms/linear/BundleOptimizer';
import type { LinearInputPiece } from '@/types/linear';

// Helper: cria lookup de perfis
function createProfileLookup(profiles: Array<{
  id: string;
  maxBarsPerBundle: number;
  description: string;
  type: string;
  kgPerMeter: number;
}>) {
  const map = new Map<string, { maxBarsPerBundle: number; description: string; type: string; kgPerMeter: number }>();
  for (const p of profiles) {
    map.set(p.id, { maxBarsPerBundle: p.maxBarsPerBundle, description: p.description, type: p.type, kgPerMeter: p.kgPerMeter });
  }
  return map;
}

// Helper: cria peça de entrada
function piece(opts: Partial<LinearInputPiece> & { length: number; quantity: number }): LinearInputPiece {
  return {
    length: opts.length,
    quantity: opts.quantity,
    tag: opts.tag || `P-${opts.length}`,
    perfil: opts.perfil || 'L 64x4.8',
    perfilId: opts.perfilId || 'perfil-L',
    ...opts,
  };
}

describe('BundleOptimizer', () => {
  const profileLookup = createProfileLookup([
    { id: 'perfil-L', maxBarsPerBundle: 6, description: 'L 64x4.8', type: 'L', kgPerMeter: 4.49 },
    { id: 'perfil-W', maxBarsPerBundle: 3, description: 'W 200x26.6', type: 'W', kgPerMeter: 26.6 },
    { id: 'perfil-U', maxBarsPerBundle: 1, description: 'U 100x10', type: 'U', kgPerMeter: 10 },
  ]);

  let optimizer: BundleOptimizer;

  beforeEach(() => {
    optimizer = new BundleOptimizer({
      barLength: 6000,
      cutLoss: 3,
      kerfFactor: 1.2,
      costPerBar: 50,
      setupTimePerCut: 2.5,
    });
  });

  describe('groupPiecesByProfile', () => {
    it('deve agrupar peças pelo perfil', () => {
      const pieces = [
        piece({ length: 1200, quantity: 5, perfilId: 'perfil-L' }),
        piece({ length: 1500, quantity: 3, perfilId: 'perfil-L' }),
        piece({ length: 2000, quantity: 2, perfilId: 'perfil-W', perfil: 'W 200x26.6' }),
      ];

      const { bundleGroups, individualPieces } = optimizer.groupPiecesByProfile(pieces, profileLookup);

      expect(bundleGroups.length).toBe(2); // L e W
      expect(individualPieces.length).toBe(0);

      const groupL = bundleGroups.find(g => g.profileId === 'perfil-L');
      expect(groupL).toBeDefined();
      expect(groupL!.totalPieces).toBe(8); // 5 + 3
      expect(groupL!.maxBarsPerBundle).toBe(6);

      const groupW = bundleGroups.find(g => g.profileId === 'perfil-W');
      expect(groupW).toBeDefined();
      expect(groupW!.totalPieces).toBe(2);
      expect(groupW!.maxBarsPerBundle).toBe(3);
    });

    it('deve enviar peças sem amarrado (max=1) para individual', () => {
      const pieces = [
        piece({ length: 1200, quantity: 3, perfilId: 'perfil-U', perfil: 'U 100x10' }),
      ];

      const { bundleGroups, individualPieces } = optimizer.groupPiecesByProfile(pieces, profileLookup);

      expect(bundleGroups.length).toBe(0);
      expect(individualPieces.length).toBe(1);
      expect(individualPieces[0].quantity).toBe(3);
    });

    it('deve enviar peças maiores que a barra para individual (emenda)', () => {
      const pieces = [
        piece({ length: 7000, quantity: 2, perfilId: 'perfil-L' }),
        piece({ length: 1200, quantity: 4, perfilId: 'perfil-L' }),
      ];

      const { bundleGroups, individualPieces } = optimizer.groupPiecesByProfile(pieces, profileLookup);

      expect(bundleGroups.length).toBe(1); // só peças de 1200
      expect(bundleGroups[0].totalPieces).toBe(4);
      expect(individualPieces.length).toBe(1); // peça de 7000
      expect(individualPieces[0].length).toBe(7000);
    });

    it('deve lidar com peças sem perfilId', () => {
      const pieces = [
        piece({ length: 1200, quantity: 3, perfilId: undefined }),
      ];

      const { bundleGroups, individualPieces } = optimizer.groupPiecesByProfile(pieces, profileLookup);

      // Sem perfil no lookup → sem maxBarsPerBundle → individual
      expect(bundleGroups.length).toBe(0);
      expect(individualPieces.length).toBe(1);
    });
  });

  describe('optimize', () => {
    it('deve gerar amarrados para peças do mesmo perfil', async () => {
      const pieces = [
        piece({ length: 1200, quantity: 6, perfilId: 'perfil-L' }),
      ];

      const result = await optimizer.optimize(pieces, profileLookup);

      expect(result.bundles.length).toBeGreaterThan(0);
      expect(result.bundles[0].bundleSize).toBe(6);
      expect(result.bundles[0].profileId).toBe('perfil-L');
      expect(result.summary.totalBundles).toBeGreaterThan(0);
    });

    it('deve gerar barras individuais para perfil com max=1', async () => {
      const pieces = [
        piece({ length: 1200, quantity: 3, perfilId: 'perfil-U', perfil: 'U 100x10' }),
      ];

      const result = await optimizer.optimize(pieces, profileLookup);

      expect(result.bundles.length).toBe(0);
      expect(result.individualBars.length).toBeGreaterThan(0);
    });

    it('deve separar perfis diferentes em grupos distintos', async () => {
      const pieces = [
        piece({ length: 1200, quantity: 6, perfilId: 'perfil-L' }),
        piece({ length: 2000, quantity: 3, perfilId: 'perfil-W', perfil: 'W 200x26.6' }),
      ];

      const result = await optimizer.optimize(pieces, profileLookup);

      const bundleL = result.bundles.find(b => b.profileId === 'perfil-L');
      const bundleW = result.bundles.find(b => b.profileId === 'perfil-W');

      expect(bundleL).toBeDefined();
      expect(bundleW).toBeDefined();
      expect(bundleL!.bundleSize).toBe(6);
      expect(bundleW!.bundleSize).toBe(3);
    });

    it('deve calcular eficiência corretamente', async () => {
      const pieces = [
        piece({ length: 2000, quantity: 6, perfilId: 'perfil-L' }),
      ];

      const result = await optimizer.optimize(pieces, profileLookup);

      expect(result.summary.averageEfficiency).toBeGreaterThan(0);
      expect(result.summary.averageEfficiency).toBeLessThanOrEqual(100);
    });

    it('deve usar kerf ajustado para amarrado', async () => {
      // Com kerfFactor = 1.2 e cutLoss = 3, bundleCutLoss = 4 (ceil(3.6))
      const pieces = [
        piece({ length: 2990, quantity: 6, perfilId: 'perfil-L' }),
      ];

      const result = await optimizer.optimize(pieces, profileLookup);

      // Com cutLoss = 4mm (amarrado), 2 peças de 2990 + 4mm kerf = 5984mm < 6000
      // Então cabe 2 peças por barra
      expect(result.bundles.length).toBeGreaterThan(0);
    });

    it('deve calcular tempo de setup economizado', async () => {
      const pieces = [
        piece({ length: 1200, quantity: 6, perfilId: 'perfil-L' }),
      ];

      const result = await optimizer.optimize(pieces, profileLookup);

      // Com 6 barras no amarrado, economiza 5 setups por corte
      expect(result.summary.setupTimeSaved).toBeGreaterThan(0);
    });

    it('deve funcionar com lista vazia', async () => {
      const result = await optimizer.optimize([], profileLookup);

      expect(result.bundles.length).toBe(0);
      expect(result.individualBars.length).toBe(0);
      expect(result.summary.totalBars).toBe(0);
    });

    it('deve lidar com mix de amarrado e individual', async () => {
      const pieces = [
        piece({ length: 1200, quantity: 6, perfilId: 'perfil-L' }),     // amarrado (max=6)
        piece({ length: 1500, quantity: 2, perfilId: 'perfil-U', perfil: 'U 100x10' }), // individual (max=1)
        piece({ length: 7000, quantity: 1, perfilId: 'perfil-L' }),     // individual (> barra)
      ];

      const result = await optimizer.optimize(pieces, profileLookup);

      expect(result.bundles.length).toBeGreaterThan(0); // L em amarrado
      expect(result.individualBars.length).toBeGreaterThan(0); // U + oversize
    });
  });
});
