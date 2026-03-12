interface Cliente {
  codigo: number;
  nome: string;
  localizacao: string;
  data: string;
}

interface Props {
  clientes: Cliente[];
  positivados: number;
}

const COLORS = [
  'bg-amber-500', 'bg-blue-500', 'bg-rose-500', 'bg-emerald-600',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
];

const NewCustomersCard = ({ clientes, positivados }: Props) => {
  const visibleClients = clientes.slice(0, 4);
  const remaining = Math.max(positivados - visibleClients.length, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
      <div className="mb-4">
        <span className="text-3xl font-bold text-foreground">{positivados}</span>
        <p className="text-sm text-muted-foreground mt-1">Clientes Positivados</p>
      </div>

      <div className="mt-auto">
        <p className="text-sm font-semibold text-foreground mb-3">Últimos Clientes</p>

        <div className="flex items-center">
          {visibleClients.map((client, i) => (
            <div
              key={client.codigo}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-card ${COLORS[i % COLORS.length]} overflow-hidden cursor-pointer ${i > 0 ? '-ml-2' : ''}`}
              title={`${client.nome} — ${client.localizacao}`}
            >
              {client.nome.charAt(0).toUpperCase()}
            </div>
          ))}
          {remaining > 0 && (
            <div className="-ml-2 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-card cursor-pointer">
              +{remaining}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewCustomersCard;
