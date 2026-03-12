import { useState } from 'react';
import { X } from 'lucide-react';

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
  const remaining = positivados - visibleClients.length;

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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Blue top accent line */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-blue-400" />

            {/* Header */}
            <div className="relative px-8 pt-8 pb-5 text-center">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-5 top-5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-foreground">Clientes Positivados</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {positivados} clientes no período · <a href="/clientes" className="text-primary font-medium cursor-pointer hover:underline">Ver todos</a>
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mx-8" />

            {/* List */}
            <div className="flex-1 overflow-y-auto px-8 py-2">
              {clientes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado</p>
              ) : (
                clientes.map((client, i) => {
                  const formattedDate = client.data
                    ? new Date(client.data).toLocaleDateString('pt-BR')
                    : '';
                  return (
                    <div
                      key={client.codigo}
                      className="flex items-center gap-4 py-5 border-b border-border last:border-b-0"
                    >
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground ${COLORS[i % COLORS.length]} flex-shrink-0 ring-2 ring-border/30`}>
                        {client.nome.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{client.nome}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Cód. {client.codigo}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{client.localizacao}</p>
                      </div>

                      {/* Date */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{formattedDate}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewCustomersCard;
