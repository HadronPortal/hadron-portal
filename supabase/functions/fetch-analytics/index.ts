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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '50';
    const search = url.searchParams.get('search') || '';
    const repParam = url.searchParams.get('rep') || '';
    const dateIni = url.searchParams.get('date_ini') || '';
    const dateEnd = url.searchParams.get('date_end') || '';
    const sortField = url.searchParams.get('sort_field') || '';
    const sortDir = url.searchParams.get('sort_dir') || 'DESC';

    // Build JSON body matching Hadron API contract
    const userToken = extractUserToken(req);

    const filter: Record<string, string | number> = {};
    if (dateIni) filter.date_ini = dateIni;
    if (dateEnd) filter.date_end = dateEnd;
    if (repParam) filter.cod_rep = Number(repParam);

    const payload: Record<string, unknown> = {
      search: search || '',
      filter,
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    };

    if (sortField) {
      payload.sort = { field: sortField, direction: sortDir };
    }

    // Auth: prefer user token, fallback to service credentials
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
      payload.aus_token = userToken;
    } else {
      const email = Deno.env.get('HADRON_API_EMAIL');
      const password = Deno.env.get('HADRON_API_PASSWORD');
      if (!email || !password) throw new Error('Missing API credentials');
      payload.aus_email = email;
      payload.aus_senha = password;
    }

    console.log('Sending payload:', JSON.stringify(payload));
    const res = await fetch('https://dev.hadronweb.com.br/DEV/app/pages/apiAnalytics', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log('Response status:', res.status, 'Body preview:', responseText.substring(0, 300));
    if (!res.ok) throw new Error(`Analytics fetch failed [${res.status}]: ${responseText.substring(0, 500)}`);

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
