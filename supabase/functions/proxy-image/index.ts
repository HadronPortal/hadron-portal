import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const _API_ENV = Deno.env.get('ENVIRONMENT') || 'development';
const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : 'https://dev.hadronweb.com.br');


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractUserToken(req: Request): string | null {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

async function getServiceAuth(): Promise<{ token: string; cookies: string }> {
  const email = Deno.env.get('HADRON_API_EMAIL');
  const password = Deno.env.get('HADRON_API_PASSWORD');
  if (!email || !password) throw new Error('Missing API credentials');

  const loginRes = await fetch(`${API_BASE_URL}/app/authUsuarios/apiLogin`, {
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

  return { token: loginData.access_token, cookies: cookies.join('; ') };
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
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userToken = extractUserToken(req);
    let token: string;
    let cookies = '';

    if (userToken) {
      token = userToken;
    } else {
      const auth = await getServiceAuth();
      token = auth.token;
      cookies = auth.cookies;
    }

    const CONTEXT = _API_ENV === 'production' ? 'APP' : 'DEV';
    const imgUrl = `${API_BASE_URL}/user_data/${CONTEXT}/products/${encodeURIComponent(filename)}`;

    const imgHeaders: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    if (cookies) imgHeaders['Cookie'] = cookies;

    const imgRes = await fetch(imgUrl, { headers: imgHeaders });

    if (!imgRes.ok || !imgRes.headers.get('content-type')?.startsWith('image')) {
      await imgRes.text();
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
