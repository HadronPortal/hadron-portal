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

    // Build form-data body — the Hadron API expects form-data auth
    const formData = new FormData();

    // Auth: prefer user token, fallback to service credentials
    const userToken = extractUserToken(req);
    if (userToken) {
      formData.append('aus_token', userToken);
    } else {
      const email = Deno.env.get('HADRON_API_EMAIL');
      const password = Deno.env.get('HADRON_API_PASSWORD');
      if (!email || !password) throw new Error('Missing API credentials');
      formData.append('aus_email', email);
      formData.append('aus_senha', password);
    }

    // Filters
    if (search) formData.append('search', search);
    // Note: cod_rep is NOT sent to the API — analytics shows all products for all reps
    if (dateIni) formData.append('date_ini', dateIni);
    if (dateEnd) formData.append('date_end', dateEnd);
    if (page) formData.append('page', page);
    if (limit) formData.append('limit', limit);
    if (sortField) {
      formData.append('sort_field', sortField);
      formData.append('sort_dir', sortDir);
    }

    const res = await fetch('https://dev.hadronweb.com.br/DEV/app/pages/apiAnalytics', {
      method: 'POST',
      headers: {
        ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {}),
      },
      body: formData,
    });

    const responseText = await res.text();
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
