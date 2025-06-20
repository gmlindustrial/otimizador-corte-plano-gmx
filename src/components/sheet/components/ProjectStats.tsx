
interface ProjectStatsProps {
  projectStats: {
    totalPieces: number;
    totalArea: number;
    estimatedSheets: number;
    estimatedWeight: number;
    estimatedCost: number;
  } | null;
}

export const ProjectStats = ({ projectStats }: ProjectStatsProps) => {
  if (!projectStats) return null;

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-3">Estimativas do Projeto</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{projectStats.totalPieces}</div>
          <div className="text-gray-600">Peças</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{(projectStats.totalArea / 1000000).toFixed(2)} m²</div>
          <div className="text-gray-600">Área Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{projectStats.estimatedSheets}</div>
          <div className="text-gray-600">Chapas Est.</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{projectStats.estimatedWeight.toFixed(1)} kg</div>
          <div className="text-gray-600">Peso Est.</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">R$ {projectStats.estimatedCost.toFixed(2)}</div>
          <div className="text-gray-600">Custo Est.</div>
        </div>
      </div>
    </div>
  );
};
