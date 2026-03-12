const data = [
  { name: 'Enviado', value: 7660, color: '#2ab5a0', dark: '#1d8a7a', light: '#3edcbf' },
  { name: 'Aprovado', value: 2820, color: '#e67e22', dark: '#b5621a', light: '#f0a050' },
  { name: 'Faturado', value: 45257, color: '#27ae60', dark: '#1e8449', light: '#4ecc7a' },
  { name: 'Cancelado', value: 1230, color: '#e74c3c', dark: '#b53a2e', light: '#f07060' },
];

const total = data.reduce((s, d) => s + d.value, 0);

function polar(cx: number, cy: number, rx: number, ry: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number) {
  const steps = Math.max(2, Math.ceil((ea - sa) / 2));
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = sa + (ea - sa) * (i / steps);
    const p = polar(cx, cy, rx, ry, a);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts;
}

function topSlice(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number) {
  const s = polar(cx, cy, rx, ry, sa);
  const e = polar(cx, cy, rx, ry, ea);
  const lg = ea - sa > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x.toFixed(2)},${s.y.toFixed(2)} A${rx},${ry} 0 ${lg} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} Z`;
}

function wallSlice(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number, h: number) {
  const topPts = arcPath(cx, cy, rx, ry, sa, ea);
  const botPts = arcPath(cx, cy, rx, ry, ea, sa).map(p => {
    const [x, y] = p.split(',');
    return `${x},${(parseFloat(y) + h).toFixed(2)}`;
  });
  return `M${topPts[0]} ${topPts.slice(1).map(p => `L${p}`).join(' ')} ${botPts.map(p => `L${p}`).join(' ')} Z`;
}

const Pie3D = () => {
  const cx = 70, cy = 42, rx = 52, ry = 26, height = 18;
  let cur = 0;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * 360;
    const obj = { ...d, sa: cur, ea: cur + sweep };
    cur += sweep;
    return obj;
  });

  // Sort walls: render back walls first (angles 0-180 top of ellipse) then front walls
  const backWalls = slices.filter(s => {
    const mid = (s.sa + s.ea) / 2;
    return mid > 90 && mid < 270;
  });
  const frontWalls = slices.filter(s => {
    const mid = (s.sa + s.ea) / 2;
    return !(mid > 90 && mid < 270);
  });

  return (
    <svg viewBox="0 0 140 85" className="w-full h-full drop-shadow-lg">
      <defs>
        {slices.map((s, i) => (
          <linearGradient key={`g${i}`} id={`grad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={s.light} />
            <stop offset="100%" stopColor={s.color} />
          </linearGradient>
        ))}
      </defs>
      {/* Back walls */}
      {backWalls.map((s, i) => (
        <path key={`bw${i}`} d={wallSlice(cx, cy, rx, ry, s.sa, s.ea, height)} fill={s.dark} />
      ))}
      {/* Front walls */}
      {frontWalls.map((s, i) => (
        <path key={`fw${i}`} d={wallSlice(cx, cy, rx, ry, s.sa, s.ea, height)} fill={s.dark} />
      ))}
      {/* Top faces */}
      {slices.map((s, i) => (
        <path key={`t${i}`} d={topSlice(cx, cy, rx, ry, s.sa, s.ea)} fill={`url(#grad${i})`} stroke="white" strokeWidth="0.8" />
      ))}
    </svg>
  );
};

const EarningsCard = () => (
  <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
    <div className="mb-4">
      <div className="flex items-baseline gap-1">
        <span className="text-xs text-muted-foreground">R$</span>
        <span className="text-3xl font-bold text-foreground">
          {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Total</p>
    </div>
    <div className="flex items-center gap-5 flex-1">
      <div className="w-32 h-24 flex-shrink-0">
        <Pie3D />
      </div>
      <div className="space-y-2.5 text-sm flex-1">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground w-20">{item.name}</span>
            <span className="font-semibold text-foreground tabular-nums text-right ml-auto">
              R${item.value.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EarningsCard;
