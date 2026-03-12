import avatarImg from '@/assets/avatar-user.png';

interface ClientAvatar {
  id: number;
  name: string;
  initial: string;
  color: string;
  img?: string;
}

const clients: ClientAvatar[] = [
  { id: 1, name: 'Anderson Silva', initial: 'A', color: 'bg-amber-500' },
  { id: 2, name: 'Sandra Costa', initial: 'S', color: 'bg-blue-500', img: avatarImg },
  { id: 3, name: 'Paulo Mendes', initial: 'P', color: 'bg-rose-500', img: avatarImg },
  { id: 4, name: 'Roberta Lima', initial: 'R', color: 'bg-emerald-600', img: avatarImg },
];

const NewCustomersCard = () => {
  const remaining = 42;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <span className="text-3xl font-bold text-foreground">6.3k</span>
        <p className="text-sm text-muted-foreground mt-1">Novos Clientes no Mês</p>
      </div>

      <div className="mt-auto">
        <p className="text-sm font-semibold text-foreground mb-3">Destaques do Dia</p>

        <div className="flex items-center">
          {clients.map((client, i) => (
            <div
              key={client.id}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-card ${client.color} overflow-hidden cursor-pointer ${i > 0 ? '-ml-2' : ''}`}
              title={client.name}
            >
              {client.img ? (
                <img src={client.img} alt={client.name} className="w-full h-full object-cover" />
              ) : (
                client.initial
              )}
            </div>
          ))}
          <div className="-ml-2 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-card cursor-pointer">
            +{remaining}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCustomersCard;
