import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  const loginRes = await fetch('https://dev.hadronweb.com.br/DEV/app/AuthUsuarios/apiLogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aus_email: email, aus_senha: password }),
    redirect: 'manual',
  });
  const loginData = await loginRes.json();
  if (!loginData?.success || !loginData?.access_token) throw new Error('Login failed');
  cachedToken = loginData.access_token;
  tokenExpiry = Date.now() + 4 * 60 * 1000; // 4 min cache
  return cachedToken!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const codter = url.searchParams.get('codter') || '';
    const repParam = url.searchParams.get('rep') || '';
    const dateIni = url.searchParams.get('date_ini') || '';
    const dateEnd = url.searchParams.get('date_end') || '';
    const sortField = url.searchParams.get('sort_field') || '';
    const sortDir = url.searchParams.get('sort_dir') || 'DESC';

    const token = extractUserToken(req) || await getServiceToken();

    // Hadron API only supports single cod_ter; for multiple, we filter after fetch
    const codterList = codter ? codter.split(',').map(s => s.trim()).filter(Boolean) : [];
    const singleCodter = codterList.length === 1 ? codterList[0] : '';

    const requestBody: Record<string, unknown> = {
      search,
      filter: { cod_ter: singleCodter, cod_rep: repParam, date_ini: dateIni, date_end: dateEnd },
      pagination: { page, limit: codterList.length > 1 ? 500 : limit },
      sort: sortField ? { field: sortField, direction: sortDir } : undefined,
    };

    const res = await fetch('https://dev.hadronweb.com.br/DEV/app/pages/apiOrders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    if (!res.ok) throw new Error(`Orders fetch failed [${res.status}]: ${responseText.substring(0, 500)}`);

    let data;
    try { data = JSON.parse(responseText); } catch { throw new Error(`Response is not JSON`); }

    console.log('Orders response keys:', JSON.stringify(Object.keys(data || {})));
    console.log('Orders sample (first order keys):', JSON.stringify(Object.keys(data?.orders?.[0] || data?.data?.[0] || {})));
    console.log('Dashboard field:', JSON.stringify(data?.dashboard || 'NOT PRESENT'));

    // Filter by multiple clients if needed (API only supports single cod_ter)
    if (codterList.length > 1 && Array.isArray(data.orders)) {
      const codterSet = new Set(codterList.map(Number));
      data.orders = data.orders.filter((o: any) => codterSet.has(Number(o.CODTER)));
      data.total_records = data.orders.length;
    }

    // If the API doesn't return a dashboard summary, compute it from orders
    if (!data.dashboard && Array.isArray(data.orders)) {
      const sent = { total: 0, peso: 0 };
      const approved = { total: 0, peso: 0 };
      const invoiced = { total: 0, peso: 0 };
      const canceled = { total: 0, peso: 0 };

      for (const o of data.orders) {
        const status = String(o.orc_status || '');
        const val = Number(o.orc_val_tot) || 0;
        const peso = parseFloat(o.OIT_PESO) || 0;

        if (status === '20' || status === 'EN') { sent.total += val; sent.peso += peso; }
        else if (status === '30' || status === 'AP') { approved.total += val; approved.peso += peso; }
        else if (status === '40' || status === '50' || status === 'FA' || status === 'PC') { invoiced.total += val; invoiced.peso += peso; }
        else if (status === '90' || status === 'CA') { canceled.total += val; canceled.peso += peso; }
      }

      data.dashboard = {
        sent: sent.total,
        sent_peso: Math.round(sent.peso * 100) / 100,
        approved: approved.total,
        approved_peso: Math.round(approved.peso * 100) / 100,
        invoiced: invoiced.total,
        invoiced_peso: Math.round(invoiced.peso * 100) / 100,
        canceled: canceled.total,
        canceled_peso: Math.round(canceled.peso * 100) / 100,
      };
    }

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
