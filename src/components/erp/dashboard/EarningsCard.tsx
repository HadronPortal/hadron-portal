const data = [
  { name: 'Enviado', value: 7660, color: '#2ab5a0', dark: '#1a8070', light: '#45d4be' },
  { name: 'Aprovado', value: 2820, color: '#e67e22', dark: '#a85a15', light: '#f5a623' },
  { name: 'Faturado', value: 45257, color: '#27ae60', dark: '#1a7a40', light: '#4cd680' },
  { name: 'Cancelado', value: 1230, color: '#e74c3c', dark: '#a5332a', light: '#f27066' },
];

const total = data.reduce((s, d) => s + d.value, 0);

function polar(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const r = ((deg - 90) * Math.PI) / 180;
  return { x: cx + rx * Math.cos(r), y: cy + ry * Math.sin(r) };
}

function arc(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number, reverse = false) {
  const n = Math.max(2, Math.ceil(Math.abs(ea - sa) / 3));
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = reverse ? ea - (ea - sa) * (i / n) : sa + (ea - sa) * (i / n);
    pts.push(polar(cx, cy, rx, ry, t));
  }
  return pts;
}

function topPath(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number) {
  const s = polar(cx, cy, rx, ry, sa);
  const e = polar(cx, cy, rx, ry, ea);
  const lg = ea - sa > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x.toFixed(2)},${s.y.toFixed(2)} A${rx},${ry} 0 ${lg} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} Z`;
}

function wallPath(cx: number, cy: number, rx: number, ry: number, sa: number, ea: number, h: number) {
  const top = arc(cx, cy, rx, ry, sa, ea);
  const bot = arc(cx, cy, rx, ry, sa, ea, true).map(p => ({ x: p.x, y: p.y + h }));
  const d = top.map((p, i) => (i === 0 ? `M${p.x.toFixed(2)},${p.y.toFixed(2)}` : `L${p.x.toFixed(2)},${p.y.toFixed(2)}`)).join(' ')
    + ' ' + bot.map(p => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z';
  return d;
}

const Pie3D = () => {
  const cx = 65, cy = 40, rx = 50, ry = 25, h = 16;
  let cur = 0;
  const slices = data.map(d => {
    const sweep = (d.value / total) * 360;
    const o = { ...d, sa: cur, ea: cur + sweep, mid: cur + sweep / 2 };
    cur += sweep;
    return o;
  });

  const back = slices.filter(s => s.mid >= 0 && s.mid < 180);
  const front = slices.filter(s => s.mid >= 180 || s.mid < 0);

  return (
    <svg viewBox="0 0 130 80" className="w-full h-full drop-shadow-md">
      <defs>
        {slices.map((s, i) => (
          <linearGradient key={i} id={`tg${i}`} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={s.light} />
            <stop offset="100%" stopColor={s.color} />
          </linearGradient>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Back walls */}
      {back.map((s, i) => (
        <path key={`bw${i}`} d={wallPath(cx, cy, rx, ry, s.sa, s.ea, h)} fill={s.dark} />
      ))}
      {/* Front walls */}
      {front.map((s, i) => (
        <path key={`fw${i}`} d={wallPath(cx, cy, rx, ry, s.sa, s.ea, h)} fill={s.dark} />
      ))}
      {/* Top faces */}
      {slices.map((s, i) => (
        <path key={`t${i}`} d={topPath(cx, cy, rx, ry, s.sa, s.ea)} fill={`url(#tg${i})`} stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" filter="url(#glow)" />
      ))}
      {/* Highlight arc on top */}
      <ellipse cx={cx} cy={cy} rx={rx * 0.55} ry={ry * 0.55} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
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
