import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import iconHadron from '@/assets/icon_hadronweb.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { email, password },
      });

      if (error || !data?.success) {
        toast({
          title: 'Erro ao entrar',
          description: data?.error || error?.message || 'Credenciais inválidas',
          variant: 'destructive',
        });
        return;
      }

      // Store token and user info
      localStorage.setItem('hadron_token', data.access_token);
      if (data.user) {
        localStorage.setItem('hadron_user', JSON.stringify(data.user));
      }

      toast({
        title: 'Login realizado com sucesso!',
      });

      navigate('/');
    } catch (err) {
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Left side - Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
        <div className="flex items-center gap-4">
          <img src={iconHadron} alt="Hádron" className="w-20 h-20 object-contain" />
          <span className="text-3xl font-light tracking-wide" style={{ color: 'hsl(0, 0%, 100%)' }}>
            Hádron<span className="font-semibold">Portal</span>
          </span>
        </div>
        <div
          className="absolute right-0 top-1/4 bottom-1/4 w-px"
          style={{ backgroundColor: 'hsl(220, 9%, 46%, 0.3)' }}
        />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <img src={iconHadron} alt="Hádron" className="w-14 h-14 object-contain" />
            <span className="text-2xl font-light tracking-wide" style={{ color: 'hsl(0, 0%, 100%)' }}>
              Hádron<span className="font-semibold">Portal</span>
            </span>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-light tracking-wide" style={{ color: 'hsl(0, 0%, 100%)' }}>
              Bem-vindo
            </h1>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'hsl(220, 70%, 50%)' }}>
              Faça login no painel administrativo.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-0 border-b rounded-none bg-transparent text-sm placeholder:uppercase placeholder:tracking-wider placeholder:text-xs focus-visible:ring-0 focus-visible:border-b-2"
                style={{
                  color: 'hsl(0, 0%, 100%)',
                  borderColor: 'hsl(220, 9%, 46%, 0.4)',
                }}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-0 border-b rounded-none bg-transparent text-sm placeholder:uppercase placeholder:tracking-wider placeholder:text-xs focus-visible:ring-0 focus-visible:border-b-2"
                style={{
                  color: 'hsl(0, 0%, 100%)',
                  borderColor: 'hsl(220, 9%, 46%, 0.4)',
                }}
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-md text-sm font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'hsl(25, 90%, 55%)',
                  color: 'hsl(0, 0%, 100%)',
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-xs uppercase tracking-[0.15em] hover:underline"
              style={{ color: 'hsl(220, 70%, 50%)' }}
            >
              Esqueceu sua senha?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
