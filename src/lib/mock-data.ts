export interface Order {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_cnpj: string;
  localizacao: string;
  status: 'aprovado' | 'confirmado' | 'pendente';
  valor: number;
  data_pedido: string;
}

export interface Client {
  id: string;
  nome: string;
  localizacao: string;
  data_cadastro: string;
}

export interface DashboardData {
  enviados: number;
  aprovados: number;
  faturados: number;
  clientes_positivados: number;
  orders: Order[];
  clients: Client[];
}

export const mockDashboardData: DashboardData = {
  enviados: 36.88,
  aprovados: 1225.67,
  faturados: 0,
  clientes_positivados: 0,
  orders: [
    {
      id: '1',
      codigo: '00120',
      cliente_nome: 'A SP DISTRIBUIDOR SAO PAULO LTDA',
      cliente_cnpj: '67.567.339/0001-45',
      localizacao: 'São Paulo, SP',
      status: 'aprovado',
      valor: 450.0,
      data_pedido: '08/03/2026',
    },
    {
      id: '2',
      codigo: '00119',
      cliente_nome: 'COMERCIAL BRASIL EIRELI',
      cliente_cnpj: '12.345.678/0001-90',
      localizacao: 'Campinas, SP',
      status: 'confirmado',
      valor: 775.67,
      data_pedido: '07/03/2026',
    },
    {
      id: '3',
      codigo: '00118',
      cliente_nome: 'MEGASTORE DISTRIBUIDORA LTDA',
      cliente_cnpj: '98.765.432/0001-10',
      localizacao: 'Rio de Janeiro, RJ',
      status: 'pendente',
      valor: 36.88,
      data_pedido: '06/03/2026',
    },
    {
      id: '4',
      codigo: '00117',
      cliente_nome: 'FAST SUPPLY COMERCIO LTDA',
      cliente_cnpj: '11.222.333/0001-44',
      localizacao: 'Belo Horizonte, MG',
      status: 'aprovado',
      valor: 1200.00,
      data_pedido: '05/03/2026',
    },
    {
      id: '5',
      codigo: '00116',
      cliente_nome: 'NOVA ERA ATACADISTA SA',
      cliente_cnpj: '55.666.777/0001-88',
      localizacao: 'Curitiba, PR',
      status: 'confirmado',
      valor: 890.50,
      data_pedido: '04/03/2026',
    },
  ],
  clients: [
    {
      id: '1',
      nome: 'A SP DISTRIBUIDOR SAO PAULO LTDA',
      localizacao: 'São Paulo, SP',
      data_cadastro: '08/03/2026',
    },
    {
      id: '2',
      nome: 'COMERCIAL BRASIL EIRELI',
      localizacao: 'Campinas, SP',
      data_cadastro: '07/03/2026',
    },
    {
      id: '3',
      nome: 'MEGASTORE DISTRIBUIDORA LTDA',
      localizacao: 'Rio de Janeiro, RJ',
      data_cadastro: '05/03/2026',
    },
    {
      id: '4',
      nome: 'FAST SUPPLY COMERCIO LTDA',
      localizacao: 'Belo Horizonte, MG',
      data_cadastro: '03/03/2026',
    },
  ],
};

export async function fetchDashboard(): Promise<DashboardData> {
  // Simulates API call — replace with real endpoint later
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDashboardData), 300);
  });
}
