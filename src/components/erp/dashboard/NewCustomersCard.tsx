import { useState } from 'react';
import { X } from 'lucide-react';
import avatarImg from '@/assets/avatar-user.png';

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
  const [modalOpen, setModalOpen] = useState(false);
  const visibleClients = clientes.slice(0, 4);
  const remaining = Math.max(positivados - visibleClients.length, 0);

  return (
    <>
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
              <div
                onClick={() => setModalOpen(true)}
                className="-ml-2 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-card cursor-pointer hover:bg-muted-foreground/20 transition-colors"
              >
                +{remaining}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de clientes */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 text-center border-b border-border">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-foreground">Clientes Positivados</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {positivados} clientes no período
              </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border">
              {clientes.map((client, i) => {
                const formattedDate = client.data
                  ? new Date(client.data).toLocaleDateString('pt-BR')
                  : '';
                return (
                  <div key={client.codigo} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ${COLORS[i % COLORS.length]} flex-shrink-0`}
                    >
                      {client.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{client.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.localizacao}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{formattedDate}</p>
                    </div>
                  </div>
                );
              })}

              {clientes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewCustomersCard;
