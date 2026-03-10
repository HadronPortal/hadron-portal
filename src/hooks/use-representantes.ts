import { useState, useEffect } from 'react';

export interface Representante {
  rep_codrep: number;
  rep_nomrep: string;
}

export function useRepresentantes() {
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReps = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/fetch-clients?page=1&limit=1`
        );
        if (!res.ok) return;
        const data = await res.json();
        setRepresentantes(data.representantes || []);
      } catch (err) {
        console.error('Failed to fetch representantes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReps();
  }, []);

  return { representantes, loading };
}
