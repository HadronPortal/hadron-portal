import avatarImg from '@/assets/avatar-user.png';

const heroes = [
  { initial: 'A', color: 'bg-emerald-500' },
  { initial: 'S', color: 'bg-cyan-500', img: avatarImg },
  { initial: 'P', color: 'bg-amber-500' },
  { initial: 'R', color: 'bg-rose-500' },
];

const NewCustomersCard = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <span className="text-3xl font-bold text-foreground">6.3k</span>
        <p className="text-sm text-muted-foreground mt-1">Novos Clientes no Mês</p>
      </div>

      <div className="mt-auto">
        <p className="text-sm font-semibold text-foreground mb-3">Destaques do Dia</p>
        <div className="flex items-center -space-x-2">
          {heroes.map((h, i) => (
            <div
              key={i}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-card ${h.color} overflow-hidden`}
            >
              {h.img ? (
                <img src={h.img} alt="" className="w-full h-full object-cover" />
              ) : (
                h.initial
              )}
            </div>
          ))}
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-card">
            +42
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCustomersCard;
