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

async function getServiceToken(): Promise<string> {
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
  return loginData.access_token;
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
    const productFilter = url.searchParams.get('product_filter') || '';
    const sortField = url.searchParams.get('sort_field') || '';
    const sortDir = url.searchParams.get('sort_dir') || 'DESC';

    const token = extractUserToken(req) || await getServiceToken();

    const requestBody: Record<string, unknown> = {
      search,
      filter: {
        cod_rep: repParam,
        date_ini: dateIni,
        date_end: dateEnd,
        product_filter: productFilter,
      },
      pagination: { page, limit },
      sort: sortField ? { field: sortField, direction: sortDir } : undefined,
    };

    const res = await fetch('https://dev.hadronweb.com.br/DEV/app/pages/apiProducts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    if (!res.ok) throw new Error(`Products fetch failed [${res.status}]: ${responseText.substring(0, 500)}`);

    let data;
    try { data = JSON.parse(responseText); } catch { throw new Error(`Response is not JSON: ${responseText.substring(0, 500)}`); }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
