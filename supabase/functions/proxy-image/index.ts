import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const debug = url.searchParams.get('debug') === '1';

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Missing file param' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { token, cookies } = await getAuth();

    // Try multiple possible URL patterns
    const basePaths = [
      `https://dev.hadronweb.com.br/app/user_data/DEV/products/${filename}`,
      `https://dev.hadronweb.com.br/app/user_data/DEV/products/pro/${filename}`,
      `https://dev.hadronweb.com.br/app/user_data/products/${filename}`,
      `https://dev.hadronweb.com.br/app/uploads/products/${filename}`,
      `https://dev.hadronweb.com.br/app/assets/products/${filename}`,
      `https://dev.hadronweb.com.br/user_data/DEV/products/${filename}`,
    ];

    const results: { url: string; status: number; contentType: string }[] = [];

    for (const imgUrl of basePaths) {
      const imgRes = await fetch(imgUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': cookies,
        },
      });

      const ct = imgRes.headers.get('content-type') || '';
      results.push({ url: imgUrl, status: imgRes.status, contentType: ct });

      if (imgRes.ok && ct.startsWith('image')) {
        console.log('SUCCESS:', imgUrl, imgRes.status, ct);
        const imgData = await imgRes.arrayBuffer();
        return new Response(imgData, {
          headers: {
            ...corsHeaders,
            'Content-Type': ct,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } else {
        await imgRes.text(); // consume body
      }
    }

    console.log('All paths failed for:', filename, JSON.stringify(results));

    if (debug) {
      return new Response(JSON.stringify({ filename, results }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
