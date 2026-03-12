const data = [
  { name: 'Enviado', value: 7660, color: '#2ab5a0', dark: '#1d8a7a', side: '#23a08c' },
  { name: 'Aprovado', value: 2820, color: '#e67e22', dark: '#b5621a', side: '#cc6e1c' },
  { name: 'Faturado', value: 45257, color: '#27ae60', dark: '#1e8449', side: '#22994f' },
  { name: 'Cancelado', value: 1230, color: '#e74c3c', dark: '#b53a2e', side: '#d04535' },
];

const total = data.reduce((s, d) => s + d.value, 0);

const Bar3D = () => {
  const maxVal = Math.max(...data.map(d => d.value));
  const chartH = 120;
  const barW = 32;
  const gap = 14;
  const depth = 10;
  const totalW = data.length * barW + (data.length - 1) * gap + depth;
  const svgW = totalW + 40;
  const svgH = chartH + depth + 30;
  const baseY = chartH + 10;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = baseY - chartH * frac;
        return (
          <line key={i} x1="15" y1={y} x2={svgW - 5} y2={y} stroke="#e0e0e0" strokeWidth="0.5" strokeDasharray="3,3" />
        );
      })}

      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = 20 + i * (barW + gap);
        const y = baseY - barH;

        return (
          <g key={d.name}>
            {/* Front face */}
            <rect x={x} y={y} width={barW} height={barH} fill={d.color} rx="1" />

            {/* Top face (parallelogram) */}
            <polygon
              points={`${x},${y} ${x + depth},${y - depth} ${x + barW + depth},${y - depth} ${x + barW},${y}`}
              fill={d.color}
              opacity="0.85"
            />

            {/* Right side face */}
            <polygon
              points={`${x + barW},${y} ${x + barW + depth},${y - depth} ${x + barW + depth},${baseY - depth} ${x + barW},${baseY}`}
              fill={d.dark}
            />

            {/* Value label */}
            <text x={x + barW / 2} y={y - depth - 4} textAnchor="middle" fontSize="7" fill="#666" fontWeight="600">
              {(d.value / 1000).toFixed(1)}k
            </text>

            {/* Bottom label */}
            <text x={x + barW / 2} y={baseY + 12} textAnchor="middle" fontSize="6.5" fill="#999">
              {d.name}
            </text>
          </g>
        );
      })}

      {/* Base line */}
      <line x1="15" y1={baseY} x2={svgW - 5} y2={baseY} stroke="#ccc" strokeWidth="0.8" />
    </svg>
  );
};

const EarningsCard = () => (
  <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
    <div className="mb-2">
      <div className="flex items-baseline gap-1">
        <span className="text-xs text-muted-foreground">R$</span>
        <span className="text-3xl font-bold text-foreground">
          {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Total</p>
    </div>
    <div className="flex-1 min-h-0">
      <Bar3D />
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{item.name}</span>
          <span className="font-semibold text-foreground tabular-nums">
            R${item.value.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default EarningsCard;
