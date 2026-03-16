import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractUserToken(req: Request): string | null {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getServiceToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const email = Deno.env.get('HADRON_API_EMAIL');
  const password = Deno.env.get('HADRON_API_PASSWORD');
  if (!email || !password) throw new Error('Missing API credentials');
  const loginRes = await fetch('https://dev.hadronweb.com.br/app/authUsuarios/apiLogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aus_email: email, aus_senha: password }),
    redirect: 'manual',
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed');
  cachedToken = loginData.access_token;
  tokenExpiry = Date.now() + 4 * 60 * 1000;
  return cachedToken!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const repParam = url.searchParams.get('rep') || '';
    const dateIni = url.searchParams.get('date_ini') || '';
    const dateEnd = url.searchParams.get('date_end') || '';
    const rawClientFilter = (url.searchParams.get('client_filter') || '').trim().toLowerCase();
    const sortField = url.searchParams.get('sort_field') || '';
    const sortDir = url.searchParams.get('sort_dir') || 'DESC';

    const clientFilterAliases: Record<string, string> = {
      '': 'all',
      all: 'all',
      todos: 'all',
      positivados: 'positive',
      positivado: 'positive',
      positive: 'positive',
      novos: 'new',
      novo: 'new',
      new: 'new',
    };
    const clientFilter = clientFilterAliases[rawClientFilter] ?? rawClientFilter;

    const token = extractUserToken(req) || await getServiceToken();

    const requestBody: Record<string, unknown> = {
      search,
      filter: { cod_rep: repParam, date_ini: dateIni, date_end: dateEnd, client_filter: clientFilter },
      pagination: { page, limit },
      sort: sortField ? { field: sortField, direction: sortDir } : undefined,
    };

    // Retry up to 3 times on connection errors
    let clientsRes: Response | null = null;
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        clientsRes = await fetch('https://dev.hadronweb.com.br/DEV/app/pages/apiClients', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        break;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.warn(`Attempt ${attempt + 1} failed:`, lastError.message);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    if (!clientsRes) throw new Error(`Clients fetch failed after 3 attempts: ${lastError?.message}`);

    const responseText = await clientsRes.text();
    if (!clientsRes.ok) throw new Error(`Clients fetch failed [${clientsRes.status}]: ${responseText.substring(0, 500)}`);

    let clientsData;
    try { clientsData = JSON.parse(responseText); } catch { throw new Error(`Response is not JSON`); }

    return new Response(JSON.stringify(clientsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
