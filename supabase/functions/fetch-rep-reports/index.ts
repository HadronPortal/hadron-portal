import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const _API_ENV = Deno.env.get('ENVIRONMENT') || 'development';
const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : `${API_BASE_URL}`);


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

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || i === retries - 1) return res;
      if (res.status >= 500) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const rep = url.searchParams.get('rep') || '';
    const dateIni = url.searchParams.get('date_ini') || '';
    const dateEnd = url.searchParams.get('date_end') || '';
    const reqPage = parseInt(url.searchParams.get('page') || '1', 10);
    const reqLimit = parseInt(url.searchParams.get('limit') || '10', 10);

    const token = extractUserToken(req) || await getServiceToken();

    let allReports: any[] = [];
    let totalRecords = 0;
    let currentPage = 1;
    const apiLimit = 10;

    while (true) {
      const requestBody = {
        search,
        filter: {
          cod_rep: rep,
          date_ini: dateIni,
          date_end: dateEnd,
        },
        pagination: {
          page: currentPage,
          limit: apiLimit,
        },
      };

      const res = await fetchWithRetry(`${API_BASE_URL}/app/pages/apiRepresentatives`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`API error [${res.status}]: ${text.substring(0, 500)}`);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Non-JSON response from API');
      }

      totalRecords = data.total_records || 0;
      const reports = Array.isArray(data.reports) ? data.reports : [];
      allReports = allReports.concat(reports);

      if (allReports.length >= totalRecords || reports.length < apiLimit) break;
      currentPage++;
      if (currentPage > 20) break;
    }

    const start = (reqPage - 1) * reqLimit;
    const paged = allReports.slice(start, start + reqLimit);

    return new Response(JSON.stringify({
      success: true,
      total_records: totalRecords,
      reports: paged,
      page: reqPage,
      limit: reqLimit,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
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
