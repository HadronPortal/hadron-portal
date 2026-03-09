export interface Order {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_cnpj: string;
  localizacao: string;
  status: 'aprovado' | 'confirmado' | 'pendente';
  valor: number;
  data_pedido: string;
  erp_code?: string;
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
      codigo: '454',
      cliente_nome: 'A SP DISTRIBUIDOR SAO PAULO LTDA',
      cliente_cnpj: '67.567.339/0001-45',
      localizacao: 'ARARAQUARA - SP',
      status: 'aprovado',
      valor: 1225.67,
      data_pedido: '18/02/2026, 11:58',
      erp_code: 'ERP:2274',
    },
    {
      id: '2',
      codigo: '453',
      cliente_nome: 'A SP PROCION SISTEMAS, SAO PAULO',
      cliente_cnpj: '57.711.657/0001-84',
      localizacao: 'SAO CARLOS - SP',
      status: 'confirmado',
      valor: 18.44,
      data_pedido: '08/01/2026, 00:31',
    },
    {
      id: '3',
      codigo: '452',
      cliente_nome: 'A SP PROCION SISTEMAS, SAO PAULO',
      cliente_cnpj: '57.711.657/0001-84',
      localizacao: 'SAO CARLOS - SP',
      status: 'pendente',
      valor: 18.44,
      data_pedido: '08/01/2026, 00:31',
    },
  ],
  clients: [],
};

export async function fetchDashboard(): Promise<DashboardData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDashboardData), 300);
  });
}
