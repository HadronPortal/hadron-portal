import { useState } from 'react';
import { MapPin, Mail, Briefcase, Phone, Globe, Shield, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import avatarImg from '@/assets/avatar-user.png';

const tabs = ['Visão Geral', 'Configurações', 'Segurança', 'Atividade'];

const profileFields = [
  { label: 'Nome Completo', value: null, key: 'nome' },
  { label: 'Empresa', value: null, key: 'empresa' },
  { label: 'Telefone', value: null, key: 'telefone', verified: true },
  { label: 'E-mail', value: null, key: 'email' },
  { label: 'Cargo', value: null, key: 'cargo' },
  { label: 'Comunicação', value: 'E-mail, Telefone' },
  { label: 'Permitir Alterações', value: 'Sim' },
];

const Perfil = () => {
  const [activeTab, setActiveTab] = useState('Visão Geral');

  const userData = (() => {
    try {
      const raw = localStorage.getItem('hadron_user');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  })();

  const userName = userData?.nome || userData?.aus_nome || userData?.name || 'Usuário';
  const userEmail = userData?.email || userData?.aus_email || '';
  const userPhone = userData?.telefone || userData?.aus_telefone || '(11) 99999-9999';
  const userCompany = userData?.empresa || 'Procion Tecnologia';
  const userRole = userData?.cargo || 'Representante';

  const resolveValue = (field: typeof profileFields[0]) => {
    if (field.value) return field.value;
    switch (field.key) {
      case 'nome': return userName;
      case 'empresa': return userCompany;
      case 'telefone': return userPhone;
      case 'email': return userEmail;
      case 'cargo': return userRole;
      default: return '-';
    }
  };

  return (
    <div className="flex-1 px-4 sm:px-8 lg:px-12 xl:px-16 py-6 max-w-[1600px] mx-auto w-full space-y-6">
      {/* Profile Header Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-[100px] w-[100px] sm:h-[120px] sm:w-[120px] rounded-xl overflow-hidden">
                <img src={avatarImg} alt={userName} className="h-full w-full object-cover" />
              </div>
              <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-[hsl(var(--erp-green))] ring-2 ring-card" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">{userName}</h1>
                    <Shield size={18} className="text-primary" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={14} />
                      {userRole}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      São Paulo, SP
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} />
                      {userEmail || 'email@exemplo.com'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Editar Perfil</Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9">
                    <MoreHorizontal size={18} />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-5">
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-[hsl(var(--erp-green))]" />
                  <div>
                    <p className="text-lg font-bold text-foreground">152</p>
                    <p className="text-xs text-muted-foreground">Pedidos</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <ArrowDownRight size={16} className="text-destructive" />
                  <div>
                    <p className="text-lg font-bold text-foreground">80</p>
                    <p className="text-xs text-muted-foreground">Clientes</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-[hsl(var(--erp-green))]" />
                  <div>
                    <p className="text-lg font-bold text-foreground">%78</p>
                    <p className="text-xs text-muted-foreground">Positivação</p>
                  </div>
                </div>

                {/* Profile completion */}
                <div className="ml-auto hidden md:flex items-center gap-3 min-w-[200px]">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Perfil Completo</span>
                  <Progress value={65} className="h-2 flex-1" />
                  <span className="text-sm font-semibold text-foreground">65%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border px-6 sm:px-8">
          <nav className="flex gap-6 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Visão Geral' && (
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 sm:px-8 pb-0">
            <h2 className="text-lg font-semibold text-foreground">Detalhes do Perfil</h2>
            <Button variant="default" size="sm">Editar Perfil</Button>
          </div>

          <div className="p-6 sm:px-8">
            <div className="divide-y divide-border">
              {profileFields.map((field) => (
                <div key={field.label} className="flex flex-col sm:flex-row sm:items-center py-4 first:pt-0 last:pb-0 gap-1 sm:gap-0">
                  <span className="text-sm text-muted-foreground sm:w-[220px] flex-shrink-0">{field.label}</span>
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    {resolveValue(field)}
                    {field.verified && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5 bg-[hsl(var(--erp-green))] hover:bg-[hsl(var(--erp-green))] text-primary-foreground">
                        Verificado
                      </Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Configurações' && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Configurações</h2>
          <p className="text-sm text-muted-foreground">Em breve.</p>
        </div>
      )}

      {activeTab === 'Segurança' && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Segurança</h2>
          <p className="text-sm text-muted-foreground">Em breve.</p>
        </div>
      )}

      {activeTab === 'Atividade' && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Atividade</h2>
          <p className="text-sm text-muted-foreground">Em breve.</p>
        </div>
      )}
    </div>
  );
};

export default Perfil;
