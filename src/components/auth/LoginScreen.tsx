import React, { useState } from 'react';
import { useAuth, isAuthorizedAdminEmail } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CompanyEmblem } from '../common/CompanyEmblem';
import {
  Lock,
  Mail,
  Volume2,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Activity,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials, loginError, clearLoginError, loading } = useAuth();
  const { companySettings, setActiveTab } = useApp();

  // Campos de e-mail e senha ocultos por padrão (vazios e seção recolhida)
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [destinationPanel, setDestinationPanel] = useState<'management' | 'guard'>('management');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  // Check token with localStorage.getItem upon loading and redirect to panel if it exists
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const storedEmail = (localStorage.getItem('auth_user_email') || '').toLowerCase();
      const isAdmin = isAuthorizedAdminEmail(storedEmail);
      setActiveTab(isAdmin ? 'management' : 'guard');
    }
  }, [setActiveTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    setRedirectNotice(null);

    const result = await loginWithCredentials(email, password);
    setIsSubmitting(false);

    if (result.success && result.perfil) {
      const cleanEmail = email.trim().toLowerCase();
      const isAdmin = isAuthorizedAdminEmail(cleanEmail);
      const welcomeName = isAdmin ? 'Denis Junior' : result.perfil === 'direção' ? 'Direção' : 'Portaria';

      if (destinationPanel === 'management') {
        if (!isAdmin) {
          setRedirectNotice(`Bem-vindo, ${welcomeName}! Acesso autorizado. Redirecionando para a Portaria...`);
          setTimeout(() => setActiveTab('guard'), 600);
        } else {
          setRedirectNotice(`Bem-vindo, ${welcomeName}! Acesso de Administrador confirmado. Redirecionando para o Monitoramento da Direção...`);
          setTimeout(() => setActiveTab('management'), 400);
        }
      } else {
        setRedirectNotice(`Bem-vindo, ${welcomeName}! Acesso autorizado. Redirecionando para o Painel da Portaria...`);
        setTimeout(() => setActiveTab('guard'), 400);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Top Banner / Corporate Identity */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-3">
          <CompanyEmblem settings={companySettings} size="lg" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {companySettings.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Sistema Seguro de Controle de Acesso e Ponto com Sincronização em Nuvem em Tempo Real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dedicated Login Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Autenticação de Usuário
                </h2>
                <p className="text-xs text-slate-400">
                  Identifique-se para acessar a Direção ou a Portaria
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsFormExpanded(!isFormExpanded);
                if (loginError) clearLoginError();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span>{isFormExpanded ? 'Ocultar campos' : 'Exibir campos de login'}</span>
              {isFormExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{loginError}</div>
              <button
                type="button"
                onClick={clearLoginError}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Success / Redirection Notice */}
          {redirectNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 animate-spin" />
              <div className="flex-1 font-bold">{redirectNotice}</div>
            </div>
          )}

          {/* Se os campos estiverem ocultos por padrão, exibe botão discreto para revelar */}
          {!isFormExpanded ? (
            <div className="text-center py-6 px-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Campos de Login Ocultos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Clique no botão abaixo para informar seu e-mail e senha e acessar o sistema escolar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormExpanded(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Acessar com E-mail e Senha</span>
              </button>
            </div>
          ) : (
            /* Formulário com campos de E-mail e Senha */
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
              {/* Escolha do Painel de Destino */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Painel de Destino:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDestinationPanel('management')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      destinationPanel === 'management'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Monitoramento Direção</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestinationPanel('guard')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      destinationPanel === 'guard'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Portaria (Vigia)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginError) clearLoginError();
                    }}
                    placeholder="exemplo@empresa.com"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mostrar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) clearLoginError();
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full mt-2 py-3 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting || loading ? (
                  <span>Autenticando e abrindo sistema...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      Entrar no {destinationPanel === 'management' ? 'Monitoramento da Direção' : 'Painel da Portaria'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Public Access Area & Role Explanations */}
        <div className="lg:col-span-5 space-y-4">
          {/* Public Access Card (Sem Login) */}
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                Acesso Livre · Sem Senha
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/20 rounded-2xl">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Comunicação & Voz</h3>
            </div>

            <p className="text-xs text-sky-100 leading-relaxed mb-5">
              Área aberta para ouvir comunicados em áudio via síntese de voz (TTS), verificar comunicados urgentes da portaria e avisos corporativos sem necessidade de senha.
            </p>

            <button
              type="button"
              onClick={() => setActiveTab('communication')}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-sky-50 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Acessar Comunicação & Voz Agora</span>
              <ArrowRight className="w-4 h-4 text-sky-600" />
            </button>
          </div>

          {/* Role Specification & Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Controle de Acesso Escolar</span>
            </h4>

            <div className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                <strong className="text-indigo-950 dark:text-indigo-200 block font-semibold mb-0.5">
                  Monitoramento em Tempo Real da Direção
                </strong>
                Acesso executivo para a equipe gestora: controle de pontualidade, alertas de atraso, gestão de folgas e configuração dos colaboradores.
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">
                  Painel de Batida de Ponto da Portaria
                </strong>
                Interface dedicada aos vigias para registro rápido de entrada e saída dos funcionários, com preenchimento obrigatório de justificativa em caso de atraso.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
