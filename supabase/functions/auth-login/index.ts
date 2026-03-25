import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const _API_ENV = Deno.env.get('ENVIRONMENT') || 'development';
const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : 'https://dev.hadronweb.com.br');


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Email e senha são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If password is __refresh__, try refreshing with the existing token from header
    const authHeader = req.headers.get('authorization') || '';
    const existingToken = authHeader.replace(/^Bearer\s+/i, '');

    let loginBody: Record<string, string>;
    if (password === '__refresh__' && existingToken) {
      // Try token-based refresh via Hádron API
      loginBody = { aus_email: email, aus_token: existingToken };
    } else {
      loginBody = { aus_email: email, aus_senha: password };
    }

    const loginRes = await fetch(`${API_BASE_URL}/app/AuthUsuarios/apiLogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginBody),
      redirect: 'manual',
    });

    const responseText = await loginRes.text();
    let loginData;
    try {
      loginData = JSON.parse(responseText);
    } catch {
      console.error('Non-JSON response:', responseText);
      return new Response(JSON.stringify({ success: false, error: 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the full Hádron API response as-is
    return new Response(responseText, {
      status: loginRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
