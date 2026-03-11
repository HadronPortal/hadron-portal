import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/auth-refresh';

export interface Representante {
  rep_codrep: number;
  rep_nomrep: string;
}

const fetchReps = async (): Promise<Representante[]> => {
  const token = localStorage.getItem('hadron_token');
  if (!token) return [];

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetchWithAuth(
    `https://${projectId}.supabase.co/functions/v1/fetch-reps`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || data.representantes || [];
};

export function useRepresentantes() {
  const { data: representantes = [], isLoading: loading } = useQuery({
    queryKey: ['representantes'],
    queryFn: fetchReps,
    staleTime: 15 * 60 * 1000,
  });

  return { representantes, loading };
}
