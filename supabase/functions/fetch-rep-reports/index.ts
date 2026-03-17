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

    const token = extractUserToken(req) || await getServiceToken();

    // The external API caps at 10 per page, so we fetch all pages and merge
    let allReports: any[] = [];
    let totalRecords = 0;
    let currentPage = 1;
    const apiLimit = 10; // API's actual max per page

    while (true) {
      const apiUrl = new URL('https://dev.hadronweb.com.br/app/pages/apiRepresentatives');
      apiUrl.searchParams.set('page', String(currentPage));
      apiUrl.searchParams.set('limit', String(apiLimit));
      if (search) apiUrl.searchParams.set('search', search);
      if (rep) apiUrl.searchParams.set('rep', rep);

      const res = await fetchWithRetry(apiUrl.toString(), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
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
      const reports = data.reports || [];
      allReports = allReports.concat(reports);

      // Stop if we got all records or no more pages
      if (allReports.length >= totalRecords || reports.length < apiLimit) break;
      currentPage++;
      // Safety: max 20 pages to avoid infinite loop
      if (currentPage > 20) break;
    }

    // Now apply our own pagination from query params
    const reqPage = parseInt(url.searchParams.get('page') || '1', 10);
    const reqLimit = parseInt(url.searchParams.get('limit') || '50', 10);
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
