import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let cachedToken: string | null = null;
let cachedCookies = '';
let tokenExpiry = 0;

async function getAuth(): Promise<{ token: string; cookies: string }> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return { token: cachedToken, cookies: cachedCookies };
  }

  const email = Deno.env.get('HADRON_API_EMAIL');
  const password = Deno.env.get('HADRON_API_PASSWORD');
  if (!email || !password) throw new Error('Missing API credentials');

  const loginRes = await fetch('https://dev.hadronweb.com.br/app/authUsuarios/apiLogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aus_email: email, aus_senha: password }),
    redirect: 'manual',
  });

  const cookies: string[] = [];
  for (const [key, value] of loginRes.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      cookies.push(value.split(';')[0]);
    }
  }

  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);

  cachedToken = loginData.access_token;
  cachedCookies = cookies.join('; ');
  tokenExpiry = Date.now() + 25 * 60 * 1000;

  return { token: cachedToken!, cookies: cachedCookies };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, cookies } = await getAuth();

    const res = await fetch('https://dev.hadronweb.com.br/app/pages/apiListaRepsDropdown', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies,
      },
    });

    const responseText = await res.text();

    if (!res.ok) {
      cachedToken = null;
      throw new Error(`Reps fetch failed [${res.status}]: ${responseText.substring(0, 500)}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Response is not JSON: ${responseText.substring(0, 500)}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
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
