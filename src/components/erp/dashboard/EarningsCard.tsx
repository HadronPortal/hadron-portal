const data = [
  { name: 'Enviado', value: 7660, color: 'hsl(173, 58%, 39%)', dark: 'hsl(173, 58%, 28%)' },
  { name: 'Aprovado', value: 2820, color: 'hsl(25, 95%, 53%)', dark: 'hsl(25, 95%, 38%)' },
  { name: 'Faturado', value: 45257, color: 'hsl(152, 69%, 31%)', dark: 'hsl(152, 69%, 20%)' },
  { name: 'Cancelado', value: 1230, color: 'hsl(0, 84%, 60%)', dark: 'hsl(0, 84%, 42%)' },
];

const total = data.reduce((s, d) => s + d.value, 0);

function polar(cx: number, cy: number, rx: number, ry: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

function topPath(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number) {
  const s = polar(cx, cy, rx, ry, sa);
  const e = polar(cx, cy, rx, ry, ea);
  const lg = ea - sa > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x},${s.y} A${rx},${ry} 0 ${lg} 1 ${e.x},${e.y} Z`;
}

function sidePath(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number, d: number) {
  const s = polar(cx, cy, rx, ry, sa);
  const e = polar(cx, cy, rx, ry, ea);
  const lg = ea - sa > 180 ? 1 : 0;
  return `M${s.x},${s.y} A${rx},${ry} 0 ${lg} 1 ${e.x},${e.y} L${e.x},${e.y + d} A${rx},${ry} 0 ${lg} 0 ${s.x},${s.y + d} Z`;
}

const Pie3D = () => {
  const cx = 60, cy = 38, rx = 48, ry = 24, depth = 12;
  let cur = 0;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * 360;
    const obj = { ...d, sa: cur, ea: cur + sweep };
    cur += sweep;
    return obj;
  });

  return (
    <svg viewBox="0 0 120 78" className="w-full h-full">
      {slices.map((s, i) => (
        <path key={`s${i}`} d={sidePath(cx, cy, rx, ry, s.sa, s.ea, depth)} fill={s.dark} />
      ))}
      {slices.map((s, i) => (
        <path key={`t${i}`} d={topPath(cx, cy, rx, ry, s.sa, s.ea)} fill={s.color} stroke="white" strokeWidth="0.5" />
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
    <div className="flex items-center gap-6 flex-1">
      <div className="w-28 h-20 flex-shrink-0">
        <Pie3D />
      </div>
      <div className="space-y-2.5 text-sm flex-1">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
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
