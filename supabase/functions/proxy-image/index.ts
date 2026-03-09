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
  if (!loginData.success) throw new Error('Login failed');

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
    const url = new URL(req.url);
    const filename = url.searchParams.get('file');

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Missing file param' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { token, cookies } = await getAuth();

    const imgUrl = `https://dev.hadronweb.com.br/app/user_data/DEV/products/${encodeURIComponent(filename)}`;
    console.log('Fetching image:', imgUrl);

    const imgRes = await fetch(imgUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies,
      },
    });

    console.log('Image response status:', imgRes.status, 'content-type:', imgRes.headers.get('content-type'));

    if (!imgRes.ok) {
      return new Response(null, { status: 404, headers: corsHeaders });
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const imgData = await imgRes.arrayBuffer();

    return new Response(imgData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(null, { status: 500, headers: corsHeaders });
  }
});
