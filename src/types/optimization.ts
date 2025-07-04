
export interface OptimizationResult {
  bars: Array<{
    id: string;
    pieces: Array<{ length: number; color: string; label: string }>;
    waste: number;
    totalUsed: number;
  }>;
  totalBars: number;
  totalWaste: number;
  wastePercentage: number;
  efficiency: number;
}
