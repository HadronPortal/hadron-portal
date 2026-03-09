import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const email = Deno.env.get('HADRON_API_EMAIL');
    const password = Deno.env.get('HADRON_API_PASSWORD');

    if (!email || !password) {
      throw new Error('Missing API credentials');
    }

    // Step 1: Login to get access_token
    const loginRes = await fetch('https://dev.hadronweb.com.br/app/authUsuarios/apiLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aus_email: email, aus_senha: password }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.access_token;
    console.log('Login successful, token obtained');

    // Step 2: Fetch catalogo using Bearer token
    const catalogoRes = await fetch('https://dev.hadronweb.com.br/app/Pages/apiCatalogs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!catalogoRes.ok) {
      const text = await catalogoRes.text();
      throw new Error(`Catalogo fetch failed [${catalogoRes.status}]: ${text.substring(0, 500)}`);
    }

    const catalogoData = await catalogoRes.json();

    return new Response(JSON.stringify(catalogoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
