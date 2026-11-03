import React from 'react';
import { GuardCheckIn } from './guard/GuardCheckIn';
import { ManagementMonitor } from './management/ManagementMonitor';
import { ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export const SplitView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Informative banner explaining real-time sync */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Visão Integrada em Tempo Real:
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Clique no botão <strong>"Bater Entrada (1 Clique)"</strong> no painel do Vigia (esquerda) e veja o registro atualizar instantaneamente no painel da Direção (direita)!
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
          <ShieldCheck className="w-4 h-4" />
          <span>Vigia Portaria</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <Activity className="w-4 h-4" />
          <span>Direção Geral</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Column: Vigia Gate */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 shadow-xs">
          <GuardCheckIn />
        </div>

        {/* Right Column: Direction Monitor */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 shadow-xs">
          <ManagementMonitor />
        </div>
      </div>
    </div>
  );
};
