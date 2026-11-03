import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from '../types';
import {
  Volume2,
  ShieldCheck,
  Activity,
  Columns2,
  Moon,
  Sun,
  VolumeX,
  Bell,
  Building2,
  Pencil,
  LogIn,
  LogOut,
  Lock,
  User,
} from 'lucide-react';
import { CompanyEmblem } from './common/CompanyEmblem';

export const Header: React.FC = () => {
  const {
    isCloudSynced,
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    currentTimeString,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    unreadNotificationsCount,
    stats,
    companySettings,
    setIsCompanyModalOpen,
  } = useApp();

  const { isLoggedIn, userProfile, logout, isPortaria, isDirecao, canAccessManagement } = useAuth();

  const handleTabClick = (tabId: ActiveTab) => {
    // Communication is completely open without login
    if (tabId === 'communication' || tabId === 'login') {
      setActiveTab(tabId);
      return;
    }

    // Require login for Guard and Management
    if (!isLoggedIn) {
      setActiveTab('login');
      return;
    }

    // Administration layout is restricted strictly to authorized administrator
    if (!canAccessManagement && (tabId === 'management' || tabId === 'split')) {
      setActiveTab('guard');
      return;
    }

    setActiveTab(tabId);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badgeCount?: number; requiresAuth?: boolean }[] = [
    {
      id: 'communication',
      label: '1. Comunicação & Voz',
      icon: <Volume2 className="w-4 h-4" />,
      requiresAuth: false,
    },
    {
      id: 'guard',
      label: '2. Portaria (Vigia)',
      icon: <ShieldCheck className="w-4 h-4" />,
      badgeCount: stats.absentCount,
      requiresAuth: true,
    },
    {
      id: 'management',
      label: '3. Monitoramento Direção',
      icon: <Activity className="w-4 h-4" />,
      badgeCount: stats.presentCount,
      requiresAuth: true,
    },
    {
      id: 'split',
      label: 'Visão Integrada',
      icon: <Columns2 className="w-4 h-4" />,
      requiresAuth: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-8 h-16">
          {/* Zone 1: Company Emblem, Name & Customization trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="flex items-center gap-2.5 text-left group p-1 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Clique para alterar o nome da empresa e o emblema"
            >
              <CompanyEmblem settings={companySettings} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[130px] sm:max-w-[180px] md:max-w-[220px]">
                    {companySettings.name}
                  </span>
                  <Pencil className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-emerald-600 transition-all shrink-0" />
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[130px] sm:max-w-[180px] md:max-w-[220px]">
                  {companySettings.subtitle}
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isLocked = item.requiresAuth && !isLoggedIn;
              const isRestrictedAdmin = !canAccessManagement && (item.id === 'management' || item.id === 'split');

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  title={
                    isLocked
                      ? 'Requer login de operador'
                      : isRestrictedAdmin
                      ? 'Exclusivo para denis.junior.dj16@gmail.vom'
                      : undefined
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : isLocked || isRestrictedAdmin
                      ? 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'communication' && !isLoggedIn && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      Público
                    </span>
                  )}
                  {(isLocked || isRestrictedAdmin) && <Lock className="w-3 h-3 text-slate-400" />}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: User Auth Badge & Tools */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Real-time Clock */}
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold tracking-wider">
                {currentTimeString}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Horário de Brasília
              </span>
            </div>

            {/* Real-time Cloud Sync Indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs"
              title={
                isCloudSynced
                  ? 'Sincronizado na Nuvem via Firebase Firestore (Multi-dispositivos em Tempo Real)'
                  : 'Conectando ao Firebase Firestore...'
              }
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Nuvem em Tempo Real</span>
            </div>

            {/* User Session Pill or Login Button */}
            {isLoggedIn && userProfile ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      userProfile.perfil === 'portaria' ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[190px]">
                      {userProfile.email || userProfile.nome}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {userProfile.perfil === 'direção' ? 'Direção & Monitoramento' : 'Portaria (Vigia)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setActiveTab('login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Sair do sistema (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                  activeTab === 'login'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {/* Quick Button to customize company and emblem */}
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
              title="Personalizar Nome da Empresa e Emblema"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Empresa</span>
            </button>

            {/* Late arrival alerts bell for Administration */}
            {canAccessManagement && (
              <button
                onClick={() => {
                  setActiveTab('management');
                }}
                className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={
                  unreadNotificationsCount > 0
                    ? `${unreadNotificationsCount} alerta(s) de atraso não lidos na Direção`
                    : 'Central de Alertas de Atraso da Direção'
                }
                aria-label="Alertas de Atraso"
              >
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Sound mute toggle */}
            <button
              onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
              title={soundEffectsEnabled ? 'Sons ativados (clique para silenciar)' : 'Sons desativados'}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Alternar som"
            >
              {soundEffectsEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Dark mode switch */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Alternar tema claro/escuro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
