import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth, isAuthorizedAdminEmail } from './context/AuthContext';
import { Header } from './components/Header';
import { CommunicationHub } from './components/communication/CommunicationHub';
import { GuardCheckIn } from './components/guard/GuardCheckIn';
import { ManagementMonitor } from './components/management/ManagementMonitor';
import { SplitView } from './components/SplitView';
import { CompanyBrandingModal } from './components/common/CompanyBrandingModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { isLoggedIn, isPortaria, isDirecao, canAccessManagement, userProfile, loading } = useAuth();

  // 2. Check token with localStorage.getItem upon loading the system and redirect to panel if it exists
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      if (activeTab === 'login') {
        const storedEmail = (localStorage.getItem('auth_user_email') || userProfile?.email || '').toLowerCase();
        const isAdmin = isAuthorizedAdminEmail(storedEmail);
        setActiveTab(isAdmin ? 'management' : 'guard');
      }
    }
  }, [activeTab, setActiveTab, userProfile]);

  const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

  // Loading state while restoring authenticated session
  if (loading && hasStoredToken && activeTab !== 'communication') {
    return (
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-9 h-9 mx-auto rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Restaurando Sessão Autenticada...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verificando credenciais no Local Storage e redirecionando para o painel.
          </p>
        </div>
      </main>
    );
  }

  // If on login tab or unauthenticated (except for the open public communication area)
  if (activeTab === 'login') {
    return <LoginScreen />;
  }

  // Communication & Voice area is publicly accessible without login
  if (activeTab === 'communication') {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CommunicationHub />
        <CompanyBrandingModal />
      </main>
    );
  }

  // Other areas (Portaria, Direção, Visão Integrada) require authentication
  if (!isLoggedIn && !loading) {
    return <LoginScreen />;
  }

  // Administration Layout access restriction: Allowed strictly for denis.junior.dj16@gmail.vom
  if (!canAccessManagement && (activeTab === 'management' || activeTab === 'split')) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Acesso Restrito à Administração
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              O layout de monitoramento da administração é restrito exclusivamente ao usuário autorizado: <strong>denis.junior.dj16@gmail.vom</strong>.
            </p>
            {userProfile?.email && (
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg inline-block">
                E-mail conectado atualmente: {userProfile.email}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('guard')}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ir para Painel da Portaria</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full py-2 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Trocar de Usuário / Entrar como Denis Junior
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeTab === 'guard' && <GuardCheckIn />}
      {activeTab === 'management' && <ManagementMonitor />}
      {activeTab === 'split' && <SplitView />}
      <CompanyBrandingModal />
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-200">
          <Header />
          <div className="flex-1">
            <MainContent />
          </div>
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 py-4 mt-12 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">PortaPonto 360</span>
                <span className="mx-2">·</span>
                <span>Portaria, Comunicação TTS e Gestão de Direção com Firebase Auth & Firestore</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Firebase Online
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>Versão Corporativa 2.5</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </AppProvider>
  );
}
