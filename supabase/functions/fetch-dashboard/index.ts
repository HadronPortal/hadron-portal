import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const _API_ENV = Deno.env.get('ENVIRONMENT') || 'development';
const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : 'https://dev.hadronweb.com.br');


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  const loginRes = await fetch(`${API_BASE_URL}/app/authUsuarios/apiLogin`, {
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
    const repParam = url.searchParams.get('rep') || '';
    const dateIni = url.searchParams.get('date_ini') || '';
    const dateEnd = url.searchParams.get('date_end') || '';

    const token = extractUserToken(req) || await getServiceToken();

    // Build filter - only include non-empty values
    const filter: Record<string, unknown> = {};
    if (repParam) filter.cod_rep = Number(repParam) || repParam;
    if (dateIni) filter.date_ini = dateIni;
    if (dateEnd) filter.date_end = dateEnd;

    const requestBody: Record<string, unknown> = {
      search: '',
      filter,
      pagination: { page: 1, limit: 50 },
    };

    console.log('Dashboard request body:', JSON.stringify(requestBody));
    console.log('Using token (first 20 chars):', token?.substring(0, 20));

    const res = await fetch(`${API_BASE_URL}/DEV/app/pages/apiDashboard`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    console.log('Dashboard response status:', res.status, 'length:', responseText.length);

    if (!res.ok) throw new Error(`Dashboard fetch failed [${res.status}]: ${responseText.substring(0, 500)}`);

    let data;
    try { data = JSON.parse(responseText); } catch { throw new Error(`Response is not JSON`); }

    console.log('Dashboard cards:', JSON.stringify(data?.cards || {}));

    return new Response(JSON.stringify(data), {
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
