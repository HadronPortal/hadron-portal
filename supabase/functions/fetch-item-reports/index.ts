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

    let representante: number[] | null = null;
    if (repParam && repParam !== 'all') {
      representante = repParam.split(',').map(Number).filter(n => !isNaN(n));
      if (representante.length === 0) representante = null;
    }

    const formatDateBr = (d: string | null) => {
      if (!d) return null;
      const parts = d.split('-');
      // Convert 2025-01-01 to 01/01/25 (exactly like Postman)
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
      return d;
    };

    const token = extractUserToken(req) || await getServiceToken();

    // HARDCODING THE DEV ENDPOINT FOR DEBUGGING - MATCHING POSTMAN
    const endpoint = "https://dev.hadronweb.com.br/app/pages/apiItemReports";

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search,
        filter: {
          date_ini: formatDateBr(dateIni),
          date_end: formatDateBr(dateEnd),
          group_id: "",
          representante: repParam || null
        },
        pagination: {
          page,
          limit
        },
        sort: {
          field: "code",
          direction: "DESC"
        }
      }),
    });

    const responseText = await res.text();
    if (!res.ok) throw new Error(`apiItemReports fetch failed [${res.status}]: ${responseText.substring(0, 500)}`);

    let data;
    try { 
      data = JSON.parse(responseText); 
    } catch { 
      throw new Error(`Response is not JSON: ${responseText.substring(0, 500)}`); 
    }

    // Adding debug info to help the user verify in the Network tab
    const finalData = {
      ...data,
      antigravity_debug: {
        endpoint,
        date_ini_sent: formatDateBr(dateIni),
        date_end_sent: formatDateBr(dateEnd),
        search_sent: search
      }
    };

    return new Response(JSON.stringify(finalData), {
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
