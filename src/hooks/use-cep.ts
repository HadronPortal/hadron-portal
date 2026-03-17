import { useState, useCallback } from 'react';

interface CepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function useCep(onResult: (data: CepResult) => void) {
  const [loading, setLoading] = useState(false);

  const fetchCep = useCallback(async (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data: CepResult = await res.json();
      if (!data.erro) onResult(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [onResult]);

  return { fetchCep, loading };
}
