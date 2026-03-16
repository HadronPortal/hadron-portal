import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth-refresh';

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE = `https://${projectId}.supabase.co/functions/v1`;

/** Map route paths to their primary data-fetching endpoints */
const routePrefetchMap: Record<string, { queryKey: string[]; endpoint: string; params?: Record<string, string> }> = {
  '/': { queryKey: ['dashboard'], endpoint: 'fetch-dashboard' },
  '/clientes': { queryKey: ['clients', '1', '50', '', '', ''], endpoint: 'fetch-clients', params: { page: '1', limit: '50' } },
  '/pedidos': { queryKey: ['orders', '1', '50', '', '', '', '', '', 'DESC'], endpoint: 'fetch-orders', params: { page: '1', limit: '50' } },
  '/catalogo': { queryKey: ['catalogo', '1', '12', '', ''], endpoint: 'fetch-catalogo', params: { page: '1', limit: '12' } },
  '/produtos': { queryKey: ['products', '1', '50', '', '', '', '', '', '', 'DESC'], endpoint: 'fetch-products', params: { page: '1', limit: '50' } },
};

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetch = useCallback((path: string) => {
    const config = routePrefetchMap[path];
    if (!config) return;

    // Only prefetch if data is not already cached
    const existing = queryClient.getQueryData(config.queryKey);
    if (existing) return;

    queryClient.prefetchQuery({
      queryKey: config.queryKey,
      queryFn: async () => {
        const url = new URL(`${BASE}/${config.endpoint}`);
        if (config.params) {
          Object.entries(config.params).forEach(([k, v]) => url.searchParams.set(k, v));
        }
        const res = await fetchWithAuth(url.toString());
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return prefetch;
}
