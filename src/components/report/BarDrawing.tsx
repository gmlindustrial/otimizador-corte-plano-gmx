interface BarDrawingProps {
  bar: any;
  barLength: number;
}

export const BarDrawing = ({ bar, barLength }: BarDrawingProps) => {
  const isLeftover = bar.type === 'leftover';
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <svg
        width="100%"
        height="80"
        viewBox={`0 0 ${(bar.originalLength || barLength) / 10} 80`}
        className="border rounded"
      >
        {/* Bar segments */}
        {(() => {
          let currentX = 0;
          return bar.pieces.map((piece: any, pieceIndex: number) => {
            const segmentWidth = piece.length / 10;
            const segmentColor = isLeftover ? '#10B981' : piece.color;
            const segment = (
              <g key={pieceIndex}>
                <rect
                  x={currentX}
                  y={20}
                  width={segmentWidth}
                  height={40}
                  fill={segmentColor}
                  stroke="#fff"
                  strokeWidth="1"
                  opacity={isLeftover ? 0.8 : 1}
                />
                <text
                  x={currentX + segmentWidth / 2}
                  y={45}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                >
                  {piece.tag || (piece.length > 500 ? `${piece.length}` : '')}
                </text>
                {isLeftover && (
                  <text
                    x={currentX + segmentWidth / 2}
                    y={35}
                    textAnchor="middle"
                    fontSize="8"
                    fill="white"
                  >
                    ♻
                  </text>
                )}
              </g>
            );
            currentX += segmentWidth;
            return segment;
          });
        })()}

        {/* Waste segment */}
        {bar.waste > 0 && (
          <g>
            <rect
              x={bar.totalUsed / 10}
              y={20}
              width={bar.waste / 10}
              height={40}
              fill="#9CA3AF"
              stroke="#fff"
              strokeWidth="1"
            />
            <text
              x={(bar.totalUsed + bar.waste / 2) / 10}
              y={45}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              fontWeight="bold"
            >
              {bar.waste > 200 ? `${bar.waste}` : ''}
            </text>
          </g>
        )}

        {/* Scale marks */}
        {Array.from({ length: Math.ceil((bar.originalLength || barLength) / 1000) + 1 }, (_, i) => (
          <g key={i}>
            <line
              x1={i * 100}
              y1={15}
              x2={i * 100}
              y2={65}
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <text
              x={i * 100}
              y={12}
              textAnchor="middle"
              fontSize="8"
              fill="#666"
            >
              {i}m
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
