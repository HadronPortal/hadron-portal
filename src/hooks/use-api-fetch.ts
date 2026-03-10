import { useQuery } from '@tanstack/react-query';

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE = `https://${projectId}.supabase.co/functions/v1`;

interface UseApiFetchOptions<T = any> {
  queryKey: string[];
  endpoint: string;
  params?: Record<string, string | number | undefined>;
  enabled?: boolean;
  staleTime?: number;
  placeholderData?: (prev: T | undefined) => T | undefined;
}

export function useApiFetch<T = any>({
  queryKey,
  endpoint,
  params = {},
  enabled = true,
  staleTime,
  placeholderData,
}: UseApiFetchOptions<T>) {
  return useQuery<T>({
    queryKey,
    queryFn: async ({ signal }) => {
      const url = new URL(`${BASE}/${endpoint}`);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
      });
      const res = await fetch(url.toString(), { signal });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      return res.json();
    },
    enabled,
    staleTime,
    placeholderData: placeholderData as any,
  });
}
