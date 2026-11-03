import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, RecordType } from '../../types';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  LogOut,
  Volume2,
  Building,
  RotateCcw,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  Sparkles,
  Briefcase,
  Users,
  Building2,
  Pencil,
  X,
  MessageSquare,
} from 'lucide-react';
import { CompanyEmblem } from '../common/CompanyEmblem';

const COMMON_DELAY_REASONS = [
  { label: 'Trânsito Intenso / Engarrafamento', icon: '🚗' },
  { label: 'Problemas no Transporte Público / Ônibus Quebrado', icon: '🚌' },
  { label: 'Consulta Médica / Atestado / Exames', icon: '🏥' },
  { label: 'Emergência Familiar / Pessoal', icon: '👨‍👩‍👧' },
  { label: 'Chuva Torrencial / Alagamento', icon: '🌧️' },
  { label: 'Problema Mecânico com Veículo Próprio', icon: '🔧' },
  { label: 'Convocação Extraordinária da Empresa', icon: '🏢' },
  { label: 'Outro Motivo (descrever abaixo)', icon: '📝' },
];

export const GuardCheckIn: React.FC = () => {
  const {
    employees,
    registerPunch,
    undoPunch,
    lastRegisteredRecord,
    currentTimeString,
    currentDateString,
    voiceConfirmationEnabled,
    setVoiceConfirmationEnabled,
    getEmployeeTodayStatus,
    pendingReasonRecord,
    setPendingReasonRecord,
    registerDelayReason,
    simulatedTime,
    setSimulatedTime,
    stats,
    timeRecords,
    clearAllRecords,
    companySettings,
    setIsCompanyModalOpen,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'pending' | 'arrived' | 'all'>('pending');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [recentlyPunchedId, setRecentlyPunchedId] = useState<string | null>(null);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);

  // Delay Reason Modal state
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return ['ALL', ...Array.from(set)];
  }, [employees]);

  // Roles list & counts (Do que trabalham)
  const rolesList = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e) => {
      map.set(e.role, (map.get(e.role) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        if (!emp.active) return false;

        // Department filter
        if (selectedDepartment !== 'ALL' && emp.department !== selectedDepartment) {
          return false;
        }

        // Role filter (Do que trabalha)
        if (selectedRole !== 'ALL' && emp.role !== selectedRole) {
          return false;
        }

        // Status filter
        const { hasPunched } = getEmployeeTodayStatus(emp.id);
        if (filterMode === 'pending' && hasPunched) return false;
        if (filterMode === 'arrived' && !hasPunched) return false;

        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = emp.name.toLowerCase().includes(term);
          const matchBadge = emp.badgeNumber.toLowerCase().includes(term);
          const matchRole = emp.role.toLowerCase().includes(term);
          return matchName || matchBadge || matchRole;
        }

        return true;
      })
      .sort((a, b) => a.expectedStartTime.localeCompare(b.expectedStartTime));
  }, [employees, filterMode, selectedDepartment, selectedRole, searchTerm, getEmployeeTodayStatus]);

  // 1-Click Fast Punch Handler
  const handleFastPunch = async (employee: Employee, type: RecordType = 'ENTRADA') => {
    setRecentlyPunchedId(employee.id);

    // Punch is registered FIRST with 1 single click!
    const record = await registerPunch(employee.id, type);

    if (searchTerm.trim()) {
      setSearchTerm('');
    }

    setTimeout(() => {
      setRecentlyPunchedId(null);
    }, 2500);

    // As soon as the employee arrives late, open the delay reason registration flow immediately
    if (record?.needsDelayReason) {
      setSelectedPresetReason('');
      setCustomReasonText('');
      setPendingReasonRecord(record);
    }
  };

  // Fast keyboard barcode or badge enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredEmployees.length === 1) {
      e.preventDefault();
      const target = filteredEmployees[0];
      const { hasPunched } = getEmployeeTodayStatus(target.id);
      handleFastPunch(target, hasPunched ? 'SAIDA' : 'ENTRADA');
    }
  };

  // Submit delay reason answered by the employee to the guard
  const handleSubmitReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingReasonRecord) return;

    const finalReason = selectedPresetReason
      ? customReasonText
        ? `${selectedPresetReason} - ${customReasonText}`
        : selectedPresetReason
      : customReasonText || 'Não informado pelo colaborador';

    registerDelayReason(pendingReasonRecord.id, finalReason);
    setSelectedPresetReason('');
    setCustomReasonText('');
  };

  // Dismiss without recording reason
  const handleDismissReason = () => {
    setPendingReasonRecord(null);
    setSelectedPresetReason('');
    setCustomReasonText('');
  };

  return (
    <div className="space-y-6">
      {/* Vigia Control Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <CompanyEmblem settings={companySettings} size="lg" className="border border-white/20 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 truncate max-w-xs">
                  {companySettings.name}
                </span>
                <span className="text-xs text-slate-400">· Turno 06:00 às 12:00</span>
                <button
                  onClick={() => setIsCompanyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                  title="Alterar Nome da Empresa e Emblema"
                >
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  <span>Personalizar Empresa</span>
                </button>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                Portaria
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                {companySettings.subtitle} — Toque no botão do colaborador assim que ele passar pelo portão.
              </p>
            </div>
          </div>

          {/* Quick Metrics in the Guard Console */}
          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 self-stretch md:self-auto justify-around flex-wrap">
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block font-medium">Aguardando</span>
              <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {stats.absentCount}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block font-medium">Já Entraram</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {stats.presentCount}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block font-medium">Hora Atual</span>
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                {currentTimeString}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <button
              onClick={() => setIsResetConfirmModalOpen(true)}
              disabled={timeRecords.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                timeRecords.length > 0
                  ? 'text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 cursor-pointer shadow-xs'
                  : 'text-slate-500 bg-slate-800/40 border border-slate-700/50 cursor-not-allowed opacity-60'
              }`}
              title={timeRecords.length > 0 ? "Zerar todas as entradas de hoje" : "As entradas já estão zeradas (0 registros)"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{timeRecords.length > 0 ? `Zerar Entradas (${timeRecords.length})` : 'Entradas Zeradas'}</span>
            </button>
          </div>
        </div>

        {/* Time Simulator & Mode Bar for testing 06:00 - 12:00 and >18:00 */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">Simulador de Horário de Chegada:</span>
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setSimulatedTime(null)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  simulatedTime === null
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Relógio Real ({currentTimeString})
              </button>

              <button
                onClick={() => setSimulatedTime({ hours: 5, minutes: 55 })}
                className={`px-2.5 py-1 rounded transition-colors ${
                  simulatedTime?.hours === 5 && simulatedTime?.minutes === 55
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                05:55 (No Horário)
              </button>

              <button
                onClick={() => setSimulatedTime({ hours: 6, minutes: 35 })}
                className={`px-2.5 py-1 rounded transition-colors ${
                  simulatedTime?.hours === 6 && simulatedTime?.minutes === 35
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-amber-400 hover:text-white'
                }`}
              >
                06:35 (Atrasado - Alerta Direção)
              </button>

              <button
                onClick={() => setSimulatedTime({ hours: 18, minutes: 15 })}
                className={`px-2.5 py-1 rounded transition-colors ${
                  simulatedTime?.hours === 18 && simulatedTime?.minutes === 15
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-rose-400 hover:text-white'
                }`}
              >
                18:15 (Após 18h - Exige Motivo)
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={voiceConfirmationEnabled}
              onChange={(e) => setVoiceConfirmationEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-700 border-slate-600"
            />
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Voz de confirmação na portaria</span>
          </label>
        </div>
      </div>



      {/* Real-time Last Punch Flash Banner */}
      {lastRegisteredRecord && !pendingReasonRecord && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                  Último Ponto Batido pelo Vigia
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                  {lastRegisteredRecord.timeFormatted}
                </span>
                {lastRegisteredRecord.punctuality === 'LATE_MILD' || lastRegisteredRecord.punctuality === 'LATE_CRITICAL' ? (
                  <span className="text-amber-700 dark:text-amber-300 font-bold">
                    (Atrasado - Direção Notificada!)
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {lastRegisteredRecord.employeeName} · {lastRegisteredRecord.employeeRole} ({lastRegisteredRecord.department})
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Turno: {lastRegisteredRecord.expectedTime} às {lastRegisteredRecord.expectedEndTime} · {lastRegisteredRecord.notes}
              </p>
            </div>
          </div>

          <button
            onClick={() => undoPunch(lastRegisteredRecord.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Desfazer este registro se tiver clicado por engano"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Desfazer</span>
          </button>
        </div>
      )}

      {/* Vigia Filter Bar & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar colaborador por nome, crachá ou cargo (Enter para 1-clique)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterMode('pending')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'pending'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Aguardando Chegada (06:00)</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md">
              {stats.absentCount}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('arrived')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'arrived'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Já Entraram Hoje</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md">
              {stats.presentCount}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({employees.length})
          </button>
        </div>

        {/* Department selector */}
        <div className="shrink-0">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Todos os Setores</option>
            {departments
              .filter((d) => d !== 'ALL')
              .map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
          </select>
        </div>

        {/* Role selector (Do que trabalha) */}
        <div className="shrink-0">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Todas as Funções ({rolesList.length})</option>
            {rolesList.map(({ role, count }) => (
              <option key={role} value={role}>
                {role} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Headcount & Roles summary banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Efetivo no Sistema:</span>
          </span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
            {employees.length} colaboradores
          </span>
          <span className="text-slate-400">·</span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span>Do que trabalham: <strong className="font-mono text-slate-700 dark:text-slate-200">{rolesList.length} funções distintas</strong></span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
          <span>{filteredEmployees.length} colaboradores exibidos</span>
          {selectedRole !== 'ALL' && (
            <button
              onClick={() => setSelectedRole('ALL')}
              className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
            >
              Limpar filtro de função
            </button>
          )}
        </div>
      </div>

      {/* 1-Click Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Nenhum colaborador nesta lista
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {filterMode === 'pending'
              ? 'Todos os colaboradores esperados para o turno das 06:00 às 12:00 já chegaram no portão!'
              : 'Nenhum registro encontrado.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const { hasPunched, lastRecord } = getEmployeeTodayStatus(emp.id);
            const isJustPunched = recentlyPunchedId === emp.id;

            return (
              <div
                key={emp.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isJustPunched
                    ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 scale-[1.01]'
                    : hasPunched
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top card metadata: Shift 06:00 - 12:00 */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Turno: <strong className="font-mono text-slate-700 dark:text-slate-300">06:00</strong> às <strong className="font-mono text-slate-700 dark:text-slate-300">12:00</strong></span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {emp.badgeNumber}
                    </span>
                  </div>

                  {/* Profile info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <img
                      src={emp.photoUrl}
                      alt={emp.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=059669&color=fff&size=150`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {emp.name}
                      </h3>
                      <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
                        <Briefcase className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{emp.role}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        <Building className="w-3 h-3" />
                        <span>{emp.department}</span>
                        <span>·</span>
                        <span title="Saldo de folgas do colaborador">
                          {Math.max(0, emp.totalDaysOff - emp.usedDaysOff)} folga(s) restante(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Day off today indicator */}
                  {emp.isOnDayOffToday && (
                    <div className="mb-3 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-center justify-between font-semibold">
                      <span>Colaborador em Folga Hoje</span>
                      <span className="font-mono text-[11px]">{emp.usedDaysOff} de {emp.totalDaysOff} pegas</span>
                    </div>
                  )}

                  {/* Already punched badge/status if present */}
                  {hasPunched && lastRecord && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 dark:text-slate-400">
                          {lastRecord.type === 'ENTRADA' ? 'Entrou às:' : 'Saiu às:'}
                        </span>
                        <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {lastRecord.timeFormatted}
                        </span>
                      </div>

                      {/* Late Arrival Badge & Reason Options */}
                      {(lastRecord.punctuality === 'LATE_MILD' || lastRecord.punctuality === 'LATE_CRITICAL' || lastRecord.diffMinutes > 0) && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Atraso (+{Math.max(1, lastRecord.diffMinutes)} min)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingReasonRecord(lastRecord);
                                setSelectedPresetReason('');
                                setCustomReasonText(lastRecord.delayReason || '');
                              }}
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 hover:underline"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              <span>{lastRecord.delayReason ? 'Editar Motivo' : '+ Adicionar Motivo'}</span>
                            </button>
                          </div>
                          {lastRecord.delayReason ? (
                            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-1.5 break-words">
                              <span className="font-bold text-amber-800 dark:text-amber-300">Motivo: </span>
                              {lastRecord.delayReason}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingReasonRecord(lastRecord);
                                setSelectedPresetReason('');
                                setCustomReasonText('');
                              }}
                              className="w-full py-1 px-2 text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 rounded-lg border border-amber-300 dark:border-amber-800 flex items-center justify-center gap-1 transition-colors"
                            >
                              <FileQuestion className="w-3.5 h-3.5" />
                              <span>Adicionar Motivo do Atraso</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 1-CLICK ACTION BUTTON FOR THE GUARD */}
                <div className="pt-2">
                  {!hasPunched ? (
                    <button
                      onClick={() => handleFastPunch(emp, 'ENTRADA')}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl transition-all shadow-md hover:shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>BATER ENTRADA (1 CLIQUE)</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFastPunch(emp, 'SAIDA')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-slate-500" />
                        <span>Registrar Saída (12:00)</span>
                      </button>
                      <button
                        onClick={() => handleFastPunch(emp, 'ENTRADA')}
                        className="px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 rounded-xl transition-colors"
                        title="Registrar nova entrada se necessário"
                      >
                        + Entrada
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RESET ENTRIES CONFIRMATION MODAL */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Zerar Registros de Entrada na Portaria?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Isso limpará todas as entradas batidas pelo vigia até o momento ({timeRecords.length} registros).
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              Todos os funcionários voltarão ao estado inicial de <strong>&quot;Aguardando Chegada&quot;</strong>, prontos para baterem o ponto de entrada no portão em 1-clique.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllRecords();
                  setIsResetConfirmModalOpen(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sim, Zerar Entradas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELAY REASON MODAL (POPS UP IMMEDIATELY AS SOON AS EMPLOYEE ARRIVES LATE) */}
      {pendingReasonRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Atraso na Entrada do Colaborador</span>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      +{Math.max(1, pendingReasonRecord.diffMinutes)} min
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Selecione ou digite a justificativa relatada pelo funcionário na portaria:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissReason}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fechar sem salvar justificativa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {pendingReasonRecord.employeeName}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {pendingReasonRecord.department} · {pendingReasonRecord.employeeRole} (Crachá: {pendingReasonRecord.badgeNumber})
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[11px] text-slate-400 block">Horário Entrada:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {pendingReasonRecord.timeFormatted}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (Turno das {pendingReasonRecord.expectedTime || '06:00'})
                </span>
              </div>
            </div>

            {/* Reason Form */}
            <form onSubmit={handleSubmitReason} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Motivo Informado pelo Colaborador (Clique para Selecionar):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {COMMON_DELAY_REASONS.map((item) => {
                    const isSelected = selectedPresetReason === item.label;
                    return (
                      <button
                        type="button"
                        key={item.label}
                        onClick={() => setSelectedPresetReason(isSelected ? '' : item.label)}
                        className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="text-base shrink-0">{item.icon}</span>
                        <span className="truncate flex-1">{item.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom or details input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detalhes / Justificativa Complementar:
                </label>
                <textarea
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="Ex: Veículo quebrou na rodovia, linha de ônibus atrasou 30 minutos, etc..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDismissReason}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Pular / Registrar sem Motivo Agora
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Motivo do Atraso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
