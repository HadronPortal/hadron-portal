import { useState, useRef } from 'react';
import { MapPin, Mail, Briefcase, Shield, ArrowUpRight, ArrowDownRight, MoreHorizontal, Pencil, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  // Form state for Settings tab
  const nameParts = userName.split(' ');
  const [formFirstName, setFormFirstName] = useState(nameParts[0] || '');
  const [formLastName, setFormLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [formCompany, setFormCompany] = useState(userCompany);
  const [formPhone, setFormPhone] = useState(userPhone);
  const [formEmail, setFormEmail] = useState(userEmail);
  const [formSite, setFormSite] = useState('');
  const [commEmail, setCommEmail] = useState(true);
  const [commPhone, setCommPhone] = useState(true);

  const currentAvatar = avatarUrl || avatarImg;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use PNG, JPG ou JPEG.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo de 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(urlData.publicUrl);
      toast({ title: 'Foto atualizada!', description: 'Seu avatar foi alterado com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao enviar foto', description: err?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  const goToSettings = () => setActiveTab('Configurações');

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
                <img src={currentAvatar} alt={userName} className="h-full w-full object-cover" />
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
                  <Button variant="outline" size="sm" onClick={goToSettings}>Editar Perfil</Button>
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

      {/* ===== Tab: Visão Geral ===== */}
      {activeTab === 'Visão Geral' && (
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 sm:px-8 pb-0">
            <h2 className="text-lg font-semibold text-foreground">Detalhes do Perfil</h2>
            <Button variant="default" size="sm" onClick={goToSettings}>Editar Perfil</Button>
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

      {/* ===== Tab: Configurações (Edit Profile - Metronic style) ===== */}
      {activeTab === 'Configurações' && (
        <div className="space-y-6">
          {/* Profile Details Form */}
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-6 sm:px-8 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Detalhes do Perfil</h2>
            </div>

            <div className="p-6 sm:px-8 space-y-6">
              {/* Avatar row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <Label className="text-sm text-muted-foreground sm:w-[200px] flex-shrink-0">Avatar</Label>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div className="relative inline-block">
                    <div className="h-[100px] w-[100px] rounded-xl overflow-hidden border border-border">
                      <img src={currentAvatar} alt={userName} className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Pencil size={12} className="text-muted-foreground" />
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <X size={12} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {uploading ? 'Enviando...' : 'Tipos permitidos: png, jpg, jpeg. Máx 2MB.'}
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <Label className="text-sm text-muted-foreground sm:w-[200px] flex-shrink-0">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <Input
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    placeholder="Nome"
                    className="flex-1"
                  />
                  <Input
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    placeholder="Sobrenome"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <Label className="text-sm text-muted-foreground sm:w-[200px] flex-shrink-0">
                  Empresa <span className="text-destructive">*</span>
                </Label>
                <div className="flex-1">
                  <Input
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Empresa"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <Label className="text-sm text-muted-foreground sm:w-[200px] flex-shrink-0">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <div className="flex-1">
                  <Input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Telefone"
                  />
                </div>
              </div>

              {/* Site */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <Label className="text-sm text-muted-foreground sm:w-[200px] flex-shrink-0">Site da Empresa</Label>
                <div className="flex-1">
                  <Input
                    value={formSite}
                    onChange={(e) => setFormSite(e.target.value)}
                    placeholder="www.exemplo.com"
                  />
                </div>
              </div>

              {/* Communication */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0">
                <Label className="text-sm text-muted-foreground sm:w-[200px] flex-shrink-0 pt-1">Comunicação</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={commEmail} onCheckedChange={setCommEmail} />
                    <span className="text-sm text-foreground">E-mail</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={commPhone} onCheckedChange={setCommPhone} />
                    <span className="text-sm text-foreground">Telefone</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 sm:px-8 border-t border-border">
              <Button variant="outline" onClick={() => setActiveTab('Visão Geral')}>Descartar</Button>
              <Button>Salvar Alterações</Button>
            </div>
          </div>

          {/* Sign-in Method Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-6 sm:px-8 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Método de Login</h2>
            </div>

            <div className="p-6 sm:px-8 divide-y divide-border">
              {/* Email */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 first:pt-0 gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Endereço de E-mail</p>
                  <p className="text-sm text-muted-foreground">{userEmail || 'email@exemplo.com'}</p>
                </div>
                <Button variant="outline" size="sm">Alterar E-mail</Button>
              </div>

              {/* Password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 last:pb-0 gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Senha</p>
                  <p className="text-sm text-muted-foreground">************</p>
                </div>
                <Button variant="outline" size="sm">Alterar Senha</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Tab: Segurança ===== */}
      {activeTab === 'Segurança' && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Segurança</h2>
          <p className="text-sm text-muted-foreground">Em breve.</p>
        </div>
      )}

      {/* ===== Tab: Atividade ===== */}
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
