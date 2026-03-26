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

async function getServiceToken(): Promise<string> {
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
  return loginData.access_token;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const dateIni = url.searchParams.get('date_ini');
    const dateEnd = url.searchParams.get('date_end');
    const repParam = url.searchParams.get('rep');
    const search = url.searchParams.get('search') || null;

    // Convert YYYY-MM-DD → DD/MM/YY for the Hádron API
    const formatDateBr = (d: string | null) => {
      if (!d) return null;
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
      return d;
    };

    const token = extractUserToken(req) || await getServiceToken();

    // Build the exact payload per the official API docs:
    // POST /app/pages/apiItemReports
    const requestBody = {
      search,
      filter: {
        date_ini: formatDateBr(dateIni),
        date_end: formatDateBr(dateEnd),
        group_id: "",
        representante: repParam || null,
      },
      pagination: { page, limit },
      sort: { field: "code", direction: "DESC" },
    };

    // The documented URL is /app/pages/apiItemReports (no context prefix)
    const endpoint = `${API_BASE_URL}/app/pages/apiItemReports`;

    console.log('fetch-item-reports → endpoint:', endpoint);
    console.log('fetch-item-reports → body:', JSON.stringify(requestBody));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    console.log('fetch-item-reports → status:', res.status, '| length:', responseText.length);

    if (!res.ok) throw new Error(`apiItemReports failed [${res.status}]: ${responseText.substring(0, 500)}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Response is not JSON: ${responseText.substring(0, 500)}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
