import { useQuery } from '@tanstack/react-query';

export interface Representante {
  rep_codrep: number;
  rep_nomrep: string;
}

const fetchReps = async (): Promise<Representante[]> => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/fetch-reps`
  );
  if (!res.ok) return [];
  const data = await res.json();
  // Support both { data: [...] } and { representantes: [...] } formats
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
