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
  const loginRes = await fetch(`${API_BASE_URL}/DEV/app/AuthUsuarios/apiLogin`, {
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
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const repParam = url.searchParams.get('rep') || '';

    const token = extractUserToken(req) || await getServiceToken();

    const requestBody = {
      search,
      filter: { cod_rep: repParam },
      pagination: { page, limit },
    };

    const catalogoRes = await fetch(`${API_BASE_URL}/DEV/app/pages/apiCatalogs`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const responseText = await catalogoRes.text();
    if (!catalogoRes.ok) throw new Error(`Catalogo fetch failed [${catalogoRes.status}]: ${responseText.substring(0, 500)}`);

    let catalogoData;
    try { catalogoData = JSON.parse(responseText); } catch { throw new Error(`Response is not JSON`); }

    return new Response(JSON.stringify(catalogoData), {
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
