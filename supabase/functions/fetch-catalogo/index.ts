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

    // Step 1: Login to get access_token and session cookies
    const loginRes = await fetch('https://dev.hadronweb.com.br/app/authUsuarios/apiLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aus_email: email, aus_senha: password }),
      redirect: 'manual',
    });

    // Extract cookies from Set-Cookie headers
    const rawHeaders = loginRes.headers;
    const cookies: string[] = [];
    for (const [key, value] of rawHeaders.entries()) {
      if (key.toLowerCase() === 'set-cookie') {
        cookies.push(value.split(';')[0]);
      }
    }
    const cookieHeader = cookies.join('; ');

    const loginData = await loginRes.json();

    if (!loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.access_token;
    console.log('Login successful. Cookies:', cookieHeader);

    // Step 2: Fetch catalogo using both Bearer token and cookies
    const catalogoRes = await fetch('https://dev.hadronweb.com.br/app/Pages/apiCatalogs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await catalogoRes.text();
    console.log('Catalogo response status:', catalogoRes.status);
    console.log('Catalogo response preview:', responseText.substring(0, 500));

    if (!catalogoRes.ok) {
      throw new Error(`Catalogo fetch failed [${catalogoRes.status}]: ${responseText.substring(0, 500)}`);
    }

    // Try to parse as JSON
    let catalogoData;
    try {
      catalogoData = JSON.parse(responseText);
    } catch {
      throw new Error(`Response is not JSON: ${responseText.substring(0, 500)}`);
    }

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
