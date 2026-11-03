import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PunctualityStatus, Employee, DayOffRecord } from '../../types';
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserX,
  Download,
  Search,
  Bell,
  BellRing,
  Volume2,
  Check,
  Send,
  Radio,
  UserPlus,
  UserMinus,
  CalendarCheck,
  CalendarDays,
  Plus,
  Trash2,
  X,
  Building,
  Building2,
  Phone,
  RotateCcw,
  Briefcase,
  Layers,
  Camera,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  Image as ImageIcon,
  ArrowLeft,
  UserCheck,
  ChevronRight,
  Calendar,
  Sparkles,
  UserCog,
  Save,
  Edit3,
  Settings2,
} from 'lucide-react';
import { CompanyEmblem } from '../common/CompanyEmblem';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
];

const DAYS_OF_WEEK_OPTIONS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const SHIFT_SCHEDULE_OPTIONS = [
  { value: '6x1', label: 'Escala 6x1 (6 dias trabalhados por 1 de folga)' },
  { value: '5x2', label: 'Escala 5x2 (Segunda a Sexta, folga Sábado e Domingo)' },
  { value: '12x36', label: 'Escala 12x36 (Trabalha 12h, folga 36h consecutivas)' },
  { value: '4x2', label: 'Escala 4x2 (4 dias trabalhados por 2 de folga)' },
  { value: 'Personalizada', label: 'Escala Flexível / Personalizada' },
];

export const ManagementMonitor: React.FC = () => {
  const {
    employees,
    timeRecords,
    notifications,
    dayOffRecords,
    unreadNotificationsCount,
    activeLateAlertModal,
    dismissLateAlertModal,
    acknowledgeNotification,
    clearAllNotifications,
    directionVoiceAlertEnabled,
    setDirectionVoiceAlertEnabled,
    stats,
    lastRegisteredRecord,
    getEmployeeTodayStatus,
    speakText,
    addAnnouncement,
    addEmployee,
    removeEmployee,
    updateEmployee,
    updateEmployeePhoto,
    registerDayOff,
    cancelDayOff,
    adjustEmployeeDaysOff,
    companySettings,
    setIsCompanyModalOpen,
    clearAllRecords,
  } = useApp();

  const { userProfile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all_records' | 'attendance_matrix' | 'late_alerts' | 'days_off' | 'roles_breakdown'>('all_records');
  const [quickMemo, setQuickMemo] = useState('');

  // Modals state
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isRemoveEmployeeModalOpen, setIsRemoveEmployeeModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [removeEmployeeFilter, setRemoveEmployeeFilter] = useState('');
  const [isDayOffModalOpen, setIsDayOffModalOpen] = useState(false);
  const [selectedEmployeeForDayOff, setSelectedEmployeeForDayOff] = useState<Employee | null>(null);
  const [dayOffStep, setDayOffStep] = useState<'select' | 'form'>('select');
  const [dayOffSearch, setDayOffSearch] = useState('');
  const [dayOffDeptFilter, setDayOffDeptFilter] = useState('ALL');
  const [dayOffNotes, setDayOffNotes] = useState('');
  const [dayOffFeedbackMessage, setDayOffFeedbackMessage] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // New Employee Form state with full photo support (upload, url, presets, optional)
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDept, setEmpDept] = useState('Produção');
  const [empBadge, setEmpBadge] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empIncludePhoto, setEmpIncludePhoto] = useState(true);
  const [empPhoto, setEmpPhoto] = useState(AVATAR_OPTIONS[0]);
  const [empCustomUrl, setEmpCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customPhotoFileName, setCustomPhotoFileName] = useState<string | null>(null);
  const [empTotalDaysOff, setEmpTotalDaysOff] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit existing employee photo modal state
  const [isEditPhotoModalOpen, setIsEditPhotoModalOpen] = useState(false);
  const [selectedEmployeeForPhoto, setSelectedEmployeeForPhoto] = useState<Employee | null>(null);
  const [editPhotoCurrent, setEditPhotoCurrent] = useState('');
  const [editPhotoFileName, setEditPhotoFileName] = useState<string | null>(null);
  const [editShowUrlInput, setEditShowUrlInput] = useState(false);
  const [editCustomUrl, setEditCustomUrl] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Unified Modal: Edit Employee & Manage Days Off
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [selectedEditEmpId, setSelectedEditEmpId] = useState<string>('');
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDept, setEditDept] = useState('Educação / Docência');
  const [editBadge, setEditBadge] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editExpectedStart, setEditExpectedStart] = useState('06:00');
  const [editExpectedEnd, setEditExpectedEnd] = useState('12:00');
  const [editTolerance, setEditTolerance] = useState(10);
  const [editActive, setEditActive] = useState(true);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editShiftSchedule, setEditShiftSchedule] = useState('6x1');
  const [editDaysOffPattern, setEditDaysOffPattern] = useState<string[]>(['Domingo']);
  const [editTotalDaysOff, setEditTotalDaysOff] = useState(2);
  const [editUsedDaysOff, setEditUsedDaysOff] = useState(0);
  const [editRemainingDaysOff, setEditRemainingDaysOff] = useState(2);
  const [editIsOnDayOffToday, setEditIsOnDayOffToday] = useState(false);

  // Optional scheduling of specific day off in this modal
  const [shouldScheduleDayOff, setShouldScheduleDayOff] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduleReason, setScheduleReason] = useState('Folga de Escala Programada');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [editFeedbackMessage, setEditFeedbackMessage] = useState<string | null>(null);

  const populateEditForm = (emp: Employee) => {
    setSelectedEditEmpId(emp.id);
    setEditName(emp.name || '');
    setEditRole(emp.role || '');
    setEditDept(emp.department || 'Geral');
    setEditBadge(emp.badgeNumber || '');
    setEditPhone(emp.phone || '');
    setEditExpectedStart(emp.expectedStartTime || '06:00');
    setEditExpectedEnd(emp.expectedEndTime || '12:00');
    setEditTolerance(emp.toleranceMinutes ?? 10);
    setEditActive(emp.active ?? true);
    setEditPhotoUrl(emp.photoUrl || '');
    setEditShiftSchedule(emp.shiftSchedule || '6x1');
    setEditDaysOffPattern(emp.daysOffPattern && emp.daysOffPattern.length > 0 ? emp.daysOffPattern : ['Domingo']);
    const total = emp.totalDaysOff ?? 2;
    const used = emp.usedDaysOff ?? 0;
    const remaining = Math.max(0, total - used);
    setEditTotalDaysOff(total);
    setEditUsedDaysOff(used);
    setEditRemainingDaysOff(remaining);
    setEditIsOnDayOffToday(emp.isOnDayOffToday ?? false);
    setShouldScheduleDayOff(false);
    setScheduleNotes('');
    setEditFeedbackMessage(null);
  };

  const handleRemainingDaysOffChange = (newRemaining: number) => {
    const safeRemaining = Math.max(0, newRemaining);
    setEditRemainingDaysOff(safeRemaining);
    // Keep total days off in sync: total = used + remaining
    setEditTotalDaysOff(Number(editUsedDaysOff || 0) + safeRemaining);
  };

  const handleUsedDaysOffChange = (newUsed: number) => {
    const safeUsed = Math.max(0, newUsed);
    setEditUsedDaysOff(safeUsed);
    setEditTotalDaysOff(safeUsed + Number(editRemainingDaysOff || 0));
  };

  const filteredEmployeesForEdit = useMemo(() => {
    if (!editSearchQuery.trim()) return employees;
    const q = editSearchQuery.toLowerCase().trim();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.badgeNumber.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }, [employees, editSearchQuery]);

  const handleOpenEditEmployeeModal = (emp?: Employee) => {
    const target = emp || (selectedEditEmpId ? employees.find((e) => e.id === selectedEditEmpId) : null) || employees[0];
    if (target) {
      populateEditForm(target);
    }
    setEditSearchQuery('');
    setIsEditEmployeeModalOpen(true);
  };

  const handleSelectEmployeeToEdit = (empId: string) => {
    const found = employees.find((e) => e.id === empId);
    if (found) {
      populateEditForm(found);
    }
  };

  const handleToggleDayOffPattern = (day: string) => {
    setEditDaysOffPattern((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveEmployeeAndDaysOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditEmpId) {
      setEditFeedbackMessage('Selecione um funcionário cadastrado para editar.');
      return;
    }

    if (!editName.trim()) {
      setEditFeedbackMessage('O nome do funcionário não pode ficar vazio.');
      return;
    }

    const finalRemaining = Math.max(0, Number(editRemainingDaysOff));
    const finalTotal = Math.max(finalRemaining, Number(editUsedDaysOff || 0) + finalRemaining);

    const updates: Partial<Employee> = {
      name: editName.trim(),
      role: editRole.trim(),
      department: editDept,
      badgeNumber: editBadge.trim(),
      phone: editPhone.trim(),
      expectedStartTime: editExpectedStart,
      expectedEndTime: editExpectedEnd,
      toleranceMinutes: Number(editTolerance) || 10,
      active: editActive,
      photoUrl: editPhotoUrl,
      shiftSchedule: editShiftSchedule,
      daysOffPattern: editDaysOffPattern,
      totalDaysOff: finalTotal,
      usedDaysOff: Math.max(0, Number(editUsedDaysOff || 0)),
      isOnDayOffToday: editIsOnDayOffToday,
    };

    // Salva no banco de dados e sincroniza em tempo real
    await updateEmployee(selectedEditEmpId, updates);

    // If specific date day-off is scheduled, register it as well
    if (shouldScheduleDayOff && scheduleDate) {
      registerDayOff(selectedEditEmpId, scheduleDate, scheduleReason);
    }

    setEditFeedbackMessage('Alterações do funcionário, Cargo e Saldo de Folgas salvas com sucesso em tempo real no banco de dados!');
    setTimeout(() => {
      setEditFeedbackMessage(null);
      setIsEditEmployeeModalOpen(false);
    }, 1200);
  };

  // Day Off Form state
  const [dayOffDate, setDayOffDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dayOffReason, setDayOffReason] = useState('Folga de Escala Programada');

  // Department options
  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return ['ALL', ...Array.from(set)];
  }, [employees]);

  // Breakdown of employee roles (Do que trabalha) and counts
  const roleStats = useMemo(() => {
    const map = new Map<string, { role: string; count: number; department: string; employees: Employee[] }>();
    employees.forEach((emp) => {
      const existing = map.get(emp.role);
      if (existing) {
        existing.count += 1;
        existing.employees.push(emp);
      } else {
        map.set(emp.role, { role: emp.role, count: 1, department: emp.department, employees: [emp] });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));
  }, [employees]);

  // Filtered employees specifically for Day Off selection flow
  const dayOffFilteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (dayOffDeptFilter !== 'ALL' && emp.department !== dayOffDeptFilter) {
        return false;
      }
      if (dayOffSearch.trim()) {
        const q = dayOffSearch.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchBadge = emp.badgeNumber.toLowerCase().includes(q);
        const matchRole = emp.role.toLowerCase().includes(q);
        const matchDept = emp.department.toLowerCase().includes(q);
        return matchName || matchBadge || matchRole || matchDept;
      }
      return true;
    });
  }, [employees, dayOffSearch, dayOffDeptFilter]);

  // Comprehensive list of all employees for the 06:00 to 12:00 shift
  const employeeStatusList = useMemo(() => {
    return employees
      .map((emp) => {
        const { hasPunched, lastRecord, status, isOnDayOffToday } = getEmployeeTodayStatus(emp.id);

        const [expH, expM] = (emp.expectedStartTime || '06:00').split(':').map(Number);
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const expMinutes = expH * 60 + expM;
        const shiftStarted = nowMinutes > expMinutes + emp.toleranceMinutes;

        return {
          employee: emp,
          hasPunched,
          lastRecord,
          isOnDayOffToday,
          status: hasPunched
            ? status
            : shiftStarted && !isOnDayOffToday
            ? ('ABSENT' as PunctualityStatus)
            : ('ON_TIME' as PunctualityStatus),
          shiftStarted,
        };
      })
      .filter((item) => {
        if (selectedDept !== 'ALL' && item.employee.department !== selectedDept) {
          return false;
        }

        if (selectedRoleFilter && item.employee.role !== selectedRoleFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = item.employee.name.toLowerCase().includes(q);
          const badgeMatch = item.employee.badgeNumber.toLowerCase().includes(q);
          const roleMatch = item.employee.role.toLowerCase().includes(q);
          return nameMatch || badgeMatch || roleMatch;
        }

        return true;
      });
  }, [employees, getEmployeeTodayStatus, selectedDept, selectedRoleFilter, searchQuery]);

  // Reset Add Employee Form
  const resetAddEmployeeForm = () => {
    setEmpName('');
    setEmpRole('');
    setEmpDept('Produção');
    setEmpBadge('');
    setEmpPhone('');
    setEmpIncludePhoto(true);
    setEmpPhoto(AVATAR_OPTIONS[0]);
    setEmpCustomUrl('');
    setShowUrlInput(false);
    setCustomPhotoFileName(null);
    setEmpTotalDaysOff(2);
    setIsAddEmployeeModalOpen(false);
  };

  // Upload photo from device (computer or phone camera)
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setEmpPhoto(event.target.result);
        setCustomPhotoFileName(file.name);
        setEmpIncludePhoto(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply custom URL for employee photo
  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (empCustomUrl.trim()) {
      setEmpPhoto(empCustomUrl.trim());
      setCustomPhotoFileName(null);
      setEmpIncludePhoto(true);
      setShowUrlInput(false);
    }
  };

  // Edit existing employee photo modal handlers
  const handleOpenEditPhotoModal = (employee: Employee) => {
    setSelectedEmployeeForPhoto(employee);
    setEditPhotoCurrent(employee.photoUrl);
    setEditPhotoFileName(null);
    setEditCustomUrl('');
    setEditShowUrlInput(false);
    setIsEditPhotoModalOpen(true);
  };

  const handleEditPhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setEditPhotoCurrent(event.target.result);
        setEditPhotoFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedPhoto = () => {
    if (!selectedEmployeeForPhoto) return;
    const finalPhoto = editPhotoCurrent.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployeeForPhoto.name)}&background=059669&color=fff&size=150`;
    updateEmployeePhoto(selectedEmployeeForPhoto.id, finalPhoto);
    setIsEditPhotoModalOpen(false);
    setSelectedEmployeeForPhoto(null);
  };

  // Handle Add Employee Submit
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empRole.trim()) return;

    const badge = empBadge.trim() || `PR-${Math.floor(1000 + Math.random() * 9000)}`;

    // If employee preferred not to have photo or photo is empty, use initial avatar
    let finalPhoto = empPhoto;
    if (!empIncludePhoto || !finalPhoto.trim()) {
      finalPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(empName.trim())}&background=059669&color=fff&size=150`;
    }

    addEmployee({
      name: empName.trim(),
      role: empRole.trim(),
      department: empDept.trim() || 'Geral',
      badgeNumber: badge,
      photoUrl: finalPhoto,
      phone: empPhone.trim() || '(11) 98000-0000',
      expectedStartTime: '06:00',
      expectedEndTime: '12:00',
      toleranceMinutes: 10,
      active: true,
      totalDaysOff: empTotalDaysOff || 2,
      usedDaysOff: 0,
    });

    // Reset and close
    resetAddEmployeeForm();
  };

  // Handle Day Off Submit
  const handleDayOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForDayOff) return;

    const finalReason = dayOffNotes.trim() ? `${dayOffReason} · Obs: ${dayOffNotes.trim()}` : dayOffReason;
    registerDayOff(selectedEmployeeForDayOff.id, dayOffDate, finalReason);
    setDayOffFeedbackMessage(`Folga de ${selectedEmployeeForDayOff.name} registrada com sucesso na escala!`);
    setTimeout(() => {
      setDayOffFeedbackMessage(null);
    }, 4500);
    setIsDayOffModalOpen(false);
    setSelectedEmployeeForDayOff(null);
    setDayOffNotes('');
    setDayOffStep('select');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Matrícula',
      'Nome do Colaborador',
      'Departamento',
      'Cargo',
      'Turno',
      'Horário de Chegada',
      'Atraso (min)',
      'Status',
      'Total de Folgas',
      'Folgas Pegas',
      'Folgas Restantes',
      'Motivo do Atraso',
      'Registrado Por',
    ];

    const rows = timeRecords.map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      const remaining = emp ? Math.max(0, emp.totalDaysOff - emp.usedDaysOff) : 0;
      return [
        r.dateFormatted,
        r.badgeNumber,
        `"${r.employeeName}"`,
        `"${r.department}"`,
        `"${r.employeeRole}"`,
        '06:00 às 12:00',
        r.timeFormatted,
        r.diffMinutes > 0 ? r.diffMinutes : 0,
        r.punctuality,
        emp?.totalDaysOff ?? 2,
        emp?.usedDaysOff ?? 0,
        remaining,
        `"${r.delayReason || r.notes || ''}"`,
        `"${r.registeredBy}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_ponto_direcao_turno_06_12_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendGateMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMemo.trim()) return;

    addAnnouncement({
      title: 'Aviso da Direção para a Portaria',
      content: quickMemo.trim(),
      category: 'PORTARIA',
      priority: 'URGENTE',
      author: 'Diretoria Executiva',
    });

    speakText(`Atenção portaria, comunicado da direção: ${quickMemo.trim()}`, true);
    setQuickMemo('');
  };

  const getPunctualityBadge = (status: PunctualityStatus, diffMinutes: number, reason?: string, isOnDayOff?: boolean) => {
    if (isOnDayOff) {
      return (
        <span className="inline-flex items-center text-xs font-semibold text-sky-700 dark:text-sky-400">
          Em Folga Hoje
        </span>
      );
    }
    if (status === 'EARLY') {
      return (
        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Adiantado ({Math.abs(diffMinutes)}m antes)
        </span>
      );
    }
    if (status === 'ON_TIME') {
      return (
        <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          No Horário (06:00)
        </span>
      );
    }
    if (status === 'LATE_MILD') {
      return (
        <div>
          <span className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
            Atraso Leve (+{diffMinutes} min)
          </span>
          {reason && <span className="block text-[11px] text-slate-500">{reason}</span>}
        </div>
      );
    }
    if (status === 'LATE_CRITICAL') {
      return (
        <div>
          <span className="inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400">
            Atraso Crítico (+{diffMinutes} min)
          </span>
          {reason && <span className="block text-[11px] text-slate-500 font-medium">{reason}</span>}
        </div>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
        Não Chegou Ainda
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* INSTANT LATE ARRIVAL NOTIFICATION MODAL */}
      {activeLateAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border-2 border-rose-500 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <BellRing className="w-5 h-5 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">
                    Alerta de Atraso em Tempo Real
                  </h3>
                  <span className="text-xs text-rose-100">
                    O vigia acabou de bater a entrada deste colaborador
                  </span>
                </div>
              </div>
              <button
                onClick={dismissLateAlertModal}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <img
                  src={activeLateAlertModal.photoUrl}
                  alt={activeLateAlertModal.employeeName}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-rose-300 dark:border-rose-900"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeLateAlertModal.employeeName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeLateAlertModal.employeeRole} · {activeLateAlertModal.department}
                  </p>
                  <div className="mt-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    Chegada às {activeLateAlertModal.timeFormatted} (Atraso de {activeLateAlertModal.lateMinutes} minutos)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Turno Oficial: 06:00 às 12:00
                  </div>
                </div>
              </div>

              {activeLateAlertModal.isAfter18 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <strong className="block mb-0.5">⚠️ Chegada Noturna Após as 18:00</strong>
                  O vigia está questionando o funcionário sobre o motivo do atraso para registrar no sistema.
                </div>
              )}

              {activeLateAlertModal.delayReason && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">
                    Motivo declarado pelo colaborador à portaria:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {activeLateAlertModal.delayReason}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => acknowledgeNotification(activeLateAlertModal.id)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Marcar como Ciente na Direção</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direction Monitor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
              Painel de Gestão & Governança
            </span>
            <span className="text-xs text-slate-400">· Turno 06:00 às 12:00</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            3. Monitoramento em Tempo Real da Direção
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de ponto, notificações imediatas de atrasos, cadastro de funcionários e controle de folgas.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sessão Direção: <strong className="font-mono">{userProfile?.email || 'denis.junior.dj16@gmail.com'}</strong>
            </span>
          </div>
        </div>

        {/* Primary Action Buttons: Add Employee, Remove Employee & Register Day Off */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Adicionar Funcionário</span>
          </button>

          <button
            onClick={() => handleOpenEditEmployeeModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95"
            title="Alterar funcionário selecionado e gerenciar escala e dias de folga"
          >
            <UserCog className="w-4 h-4" />
            <span>Alterar Funcionário & Folgas</span>
          </button>

          <button
            onClick={() => {
              setRemoveEmployeeFilter('');
              setIsRemoveEmployeeModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <UserMinus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>- Remover Funcionário</span>
          </button>

          <button
            onClick={() => {
              setSelectedEmployeeForDayOff(null);
              setDayOffStep('select');
              setDayOffSearch('');
              setDayOffDeptFilter('ALL');
              setIsDayOffModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-800 rounded-lg shadow-xs transition-all whitespace-nowrap active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Selecionar colaborador para lançar folga"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Lançar Folga</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-2xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
            title="Alterar o nome da empresa e o emblema"
          >
            <CompanyEmblem settings={companySettings} size="xs" />
            <span>Empresa & Emblema</span>
          </button>

          <button
            onClick={() => setIsResetConfirmModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
            title="Zerar todas as entradas e registros de ponto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Zerar Registros ({timeRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Executive Corporate Identity Banner */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <CompanyEmblem settings={companySettings} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {companySettings.name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Empresa Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {companySettings.subtitle} · Turno Oficial Regulamentar: 06:00 às 12:00
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCompanyModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors whitespace-nowrap self-start sm:self-auto shadow-2xs"
        >
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Alterar Nome & Emblema</span>
        </button>
      </div>

      {/* KPI Cards Strip - Quantidade de Funcionários e Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Employees in the System */}
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold mb-1">
            <span>Efetivo no Sistema</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-950 dark:text-indigo-200 tabular-nums">
              {employees.length}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">colaboradores</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Do que trabalham:</span>
            <strong className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">
              {roleStats.length} funções
            </strong>
          </div>
          <button
            onClick={() => setViewMode('roles_breakdown')}
            className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Ver distribuição de cargos →</span>
          </button>
        </div>

        {/* Present */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Presentes (06:00 - 12:00)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {stats.presentCount}
            </span>
            <span className="text-xs text-slate-400">de {stats.totalExpected} esperados</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            Assiduidade: <strong className="font-mono text-slate-700 dark:text-slate-300">{stats.attendanceRate}%</strong>
          </span>
        </div>

        {/* On-Time */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Pontuais (Até 06:10)</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.onTimeCount}
            </span>
            <span className="text-xs text-slate-400">no horário</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
            Dentro da tolerância regulamentar
          </p>
        </div>

        {/* Days off today */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Em Folga Hoje</span>
            <CalendarDays className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
              {stats.onDayOffCount}
            </span>
            <span className="text-xs text-slate-400">em escala</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
            Saldo computado e atualizado
          </p>
        </div>

        {/* Late Notifications */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Atrasos Notificados</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {notifications.length}
            </span>
            <span className="text-xs text-slate-400">
              {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount} novos)` : 'alertas'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
            Média de atraso: <strong className="font-mono text-slate-700 dark:text-slate-300">{stats.averageLateMinutes} min</strong>
          </p>
        </div>
      </div>

      {/* Real-time Arrival Banner */}
      {lastRegisteredRecord && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    ÚLTIMO REGISTRO DE ENTRADA NA PORTARIA
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300 font-semibold">
                    {lastRegisteredRecord.timeFormatted}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {lastRegisteredRecord.employeeName} ({lastRegisteredRecord.department})
                </p>
                {lastRegisteredRecord.delayReason && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                    Motivo declarado: {lastRegisteredRecord.delayReason}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Turno: 06:00 às 12:00</span>
              {getPunctualityBadge(
                lastRegisteredRecord.punctuality,
                lastRegisteredRecord.diffMinutes,
                lastRegisteredRecord.delayReason
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fast Memo to Gate */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <form onSubmit={handleSendGateMemo} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Mensagem da Direção para a Portaria:</span>
          </div>
          <input
            type="text"
            value={quickMemo}
            onChange={(e) => setQuickMemo(e.target.value)}
            placeholder="Digite instrução para a portaria (ex: orientar colaboradores atrasados a passarem no RH)..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!quickMemo.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmitir à Portaria</span>
          </button>
        </form>
      </div>

      {/* Quadro de Funções & Efetivo (Do que trabalham no sistema) */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Quadro de Funções & Efetivo (Do que trabalham no sistema)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total de <strong className="font-mono text-slate-900 dark:text-white font-bold">{employees.length} funcionários</strong> distribuídos em <strong className="font-mono text-slate-900 dark:text-white font-bold">{roleStats.length} cargos e ocupações</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedRoleFilter && (
              <button
                onClick={() => setSelectedRoleFilter(null)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar filtro: <strong>{selectedRoleFilter}</strong></span>
              </button>
            )}

            <button
              onClick={() => setViewMode('roles_breakdown')}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tabela Detalhada de Cargos</span>
            </button>
          </div>
        </div>

        {/* Roles Quick Pill Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedRoleFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedRoleFilter === null
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Todos os Cargos</span>
            <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded-md ${
              selectedRoleFilter === null ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {employees.length}
            </span>
          </button>

          {roleStats.map((item) => {
            const isSelected = selectedRoleFilter === item.role;
            return (
              <button
                key={item.role}
                onClick={() => setSelectedRoleFilter(isSelected ? null : item.role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                title={`Filtrar colaboradores que trabalham como ${item.role} (${item.department})`}
              >
                <span>{item.role}</span>
                <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded-md font-bold ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setViewMode('all_records')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'all_records'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Entradas Registradas ({timeRecords.length})
          </button>

          <button
            onClick={() => setViewMode('roles_breakdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'roles_breakdown'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span>Do que Trabalham ({roleStats.length} cargos · {employees.length} funcionários)</span>
          </button>

          <button
            onClick={() => setViewMode('days_off')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'days_off'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Controle de Folgas & Saldo ({employees.length})</span>
          </button>

          <button
            onClick={() => setViewMode('late_alerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'late_alerts'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-rose-500" />
            <span>Alertas de Atraso</span>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 font-mono text-[11px] bg-rose-600 text-white rounded-md font-bold">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode('attendance_matrix')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'attendance_matrix'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quadro de Escala (06:00 - 12:00)
          </button>
        </div>

        {/* Secondary filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar colaborador..."
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* VIEW: DAYS OFF CONTROL (CONTROLE DE FOLGAS E SALDOS) */}
      {viewMode === 'days_off' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="font-bold">Controle e Atualização de Folgas:</strong> O sistema debita e conta cada folga tirada pelo colaborador, exibindo com precisão quantas folgas foram pegas e o saldo restante disponível.
            </div>
            <button
              onClick={() => {
                setSelectedEmployeeForDayOff(null);
                setDayOffStep('select');
                setDayOffSearch('');
                setDayOffDeptFilter('ALL');
                setIsDayOffModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-2xs whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>+ Lançar Nova Folga</span>
            </button>
          </div>

          {/* Table of employees with their folgas balances */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Saldo de Folgas por Funcionário
              </h3>
              <span className="text-xs text-slate-400">
                {employees.length} colaboradores cadastrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Setor</th>
                    <th className="py-3 px-4 text-center">Direito Total</th>
                    <th className="py-3 px-4 text-center">Folgas Já Pegas</th>
                    <th className="py-3 px-4 text-center">Folgas Restantes</th>
                    <th className="py-3 px-4">Situação Hoje</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {employees.map((emp) => {
                    const remaining = Math.max(0, emp.totalDaysOff - emp.usedDaysOff);
                    const isExhausted = remaining === 0;

                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPhotoModal(emp)}
                              className="relative group/avatar cursor-pointer shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                              title="Clique para alterar a foto do colaborador"
                            >
                              <img
                                src={emp.photoUrl}
                                alt={emp.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                {emp.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {emp.badgeNumber} · {emp.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {emp.department}
                        </td>

                        {/* Total de direito */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                            <span>{emp.totalDaysOff} folgas</span>
                            <button
                              onClick={() => adjustEmployeeDaysOff(emp.id, 1)}
                              title="Adicionar +1 dia ao direito de folga"
                              className="text-emerald-600 hover:text-emerald-700 font-bold ml-1"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Folgas já pegas */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40">
                            {emp.usedDaysOff} já pega{emp.usedDaysOff === 1 ? '' : 's'}
                          </span>
                        </td>

                        {/* Folgas restantes (Saldo) */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono font-bold ${
                              isExhausted
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {remaining} restante{remaining === 1 ? '' : 's'}
                          </span>
                        </td>

                        {/* Situação hoje */}
                        <td className="py-3 px-4">
                          {emp.isOnDayOffToday ? (
                            <span className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                              <CalendarCheck className="w-3.5 h-3.5" /> De Folga Hoje
                            </span>
                          ) : (
                            <span className="text-slate-400">Escalado normal</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditEmployeeModal(emp)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                              title="Alterar dados e folgas deste colaborador"
                            >
                              <UserCog className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPhotoModal(emp)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              title="Alterar ou anexar foto deste colaborador"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployeeForDayOff(emp);
                                setDayOffStep('form');
                                setIsDayOffModalOpen(true);
                              }}
                              disabled={isExhausted}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              + Lançar Folga
                            </button>
                            <button
                              onClick={() => setEmployeeToDelete(emp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Remover colaborador do sistema"
                              aria-label="Remover colaborador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Folgas Registration History Log */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Histórico de Folgas Lançadas e Utilizadas</span>
            </h4>

            {dayOffRecords.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Nenhuma folga registrada ainda.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {dayOffRecords.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.employeeName} ({item.department})
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        Data da Folga: <strong className="font-mono text-slate-700 dark:text-slate-300">{item.dateFormatted}</strong> · Motivo: {item.reason}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Saldo após esta folga: <strong>{item.remainingAfter} folgas restantes</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => cancelDayOff(item.id)}
                      title="Cancelar esta folga e devolver ao saldo do colaborador"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-900/40 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Estornar Folga</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: LATE ALERTS NOTIFICATIONS */}
      {viewMode === 'late_alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-900 dark:text-rose-200">
            <span>
              <strong>Notificações Diretas da Portaria:</strong> Cada registro com atraso no turno das 06:00 às 12:00 gera um alerta instantâneo nesta lista.
            </span>
            {unreadNotificationsCount > 0 && (
              <button
                onClick={clearAllNotifications}
                className="font-bold underline hover:no-underline whitespace-nowrap ml-2"
              >
                Marcar todos como lidos
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
              Nenhuma notificação de atraso registrada hoje.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !notif.read && !notif.acknowledged
                      ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={notif.photoUrl}
                        alt={notif.employeeName}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {notif.employeeName}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {notif.employeeRole} ({notif.department})
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 block">
                        +{notif.lateMinutes} min atrasado
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {notif.timeFormatted}
                      </span>
                    </div>
                  </div>

                  {notif.isAfter18 && (
                    <div className="mb-2 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 rounded text-[11px] font-semibold">
                      Chegada após as 18:00
                    </div>
                  )}

                  {notif.delayReason ? (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">
                        Motivo registrado pelo vigia:
                      </strong>
                      <span className="text-slate-900 dark:text-white">
                        {notif.delayReason}
                      </span>
                    </div>
                  ) : notif.isAfter18 ? (
                    <div className="mt-2 text-[11px] text-slate-400 italic">
                      Aguardando vigia registrar a justificativa informada pelo colaborador...
                    </div>
                  ) : null}

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Turno: 06:00 às 12:00
                    </span>

                    {!notif.acknowledged ? (
                      <button
                        onClick={() => acknowledgeNotification(notif.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-md shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ciente</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ciente pela Direção
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ALL RECORDS TABLE */}
      {viewMode === 'all_records' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Registro das Batidas de Ponto na Portaria (Turno 06:00 às 12:00)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {timeRecords.length} {timeRecords.length === 1 ? 'registro processado' : 'registros processados'}
              </span>
              {timeRecords.length > 0 && (
                <button
                  onClick={() => setIsResetConfirmModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/40 transition-colors font-medium ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Zerar Registros</span>
                </button>
              )}
            </div>
          </div>

          {timeRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum registro de ponto registrado hoje
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                As entradas de ponto estão zeradas. Assim que o vigia registrar a entrada de um colaborador no portão, o registro aparecerá aqui instantaneamente com o horário e status de pontualidade.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Hora de Entrada</th>
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Setor & Cargo</th>
                    <th className="py-3 px-4">Escala</th>
                    <th className="py-3 px-4">Pontualidade</th>
                    <th className="py-3 px-4">Motivo / Observações</th>
                    <th className="py-3 px-4">Registrado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {timeRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {record.timeFormatted}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {record.employeeName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {record.badgeNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {record.department}
                        </span>
                        <span className="text-slate-400 block text-[11px]">
                          {record.employeeRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                        06:00 às 12:00
                      </td>
                      <td className="py-3 px-4">
                        {getPunctualityBadge(record.punctuality, record.diffMinutes, record.delayReason)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                        {record.delayReason ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {record.delayReason}
                          </span>
                        ) : (
                          record.notes || '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        <div>{record.registeredBy}</div>
                        <div className="text-[11px] text-slate-400">{record.gate}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW: ATTENDANCE MATRIX */}
      {viewMode === 'attendance_matrix' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Quadro Geral de Presença e Escala das 06:00 às 12:00
            </h3>
            <span className="text-xs text-slate-400">
              {employeeStatusList.length} colaboradores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Setor</th>
                  <th className="py-3 px-4">Turno Oficial</th>
                  <th className="py-3 px-4">Status de Chegada</th>
                  <th className="py-3 px-4">Horário Batido</th>
                  <th className="py-3 px-4">Saldo de Folgas</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {employeeStatusList.map(({ employee, hasPunched, lastRecord, status, isOnDayOffToday }) => {
                  const remaining = Math.max(0, employee.totalDaysOff - employee.usedDaysOff);

                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPhotoModal(employee)}
                            className="relative group/avatar cursor-pointer shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                            title="Clique para alterar a foto do colaborador"
                          >
                            <img
                              src={employee.photoUrl}
                              alt={employee.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                              <Camera className="w-3 h-3 text-white" />
                            </div>
                          </button>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {employee.name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {employee.badgeNumber} · {employee.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {employee.department}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        06:00 às 12:00
                      </td>
                      <td className="py-3 px-4">
                        {isOnDayOffToday ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
                            <CalendarCheck className="w-3.5 h-3.5" /> De Folga Hoje
                          </span>
                        ) : hasPunched ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" /> Aguardando na Portaria
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {hasPunched && lastRecord ? lastRecord.timeFormatted : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {employee.usedDaysOff} pegas / {remaining} restantes
                          </span>
                          <button
                            onClick={() => {
                              setSelectedEmployeeForDayOff(employee);
                              setIsDayOffModalOpen(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold"
                            title="Lançar folga para este colaborador"
                          >
                            + Folga
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEmployeeModal(employee)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            title="Alterar colaborador e gerenciar folgas"
                          >
                            <UserCog className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPhotoModal(employee)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Alterar ou anexar foto deste colaborador"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEmployeeToDelete(employee)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Remover colaborador do sistema"
                            aria-label="Remover colaborador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: ROLES & OCCUPATIONS BREAKDOWN (QUANTIDADES E DO QUE TRABALHA) */}
      {viewMode === 'roles_breakdown' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Quadro Geral de Funções & Efetivo: Do que Trabalham no Sistema
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Total de <strong className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">{employees.length} colaboradores</strong> cadastrados, distribuídos em <strong className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">{roleStats.length} cargos ativos</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Novo Colaborador</span>
              </button>
            </div>
          </div>

          {/* Detailed Roles Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Distribuição Quantitativa por Função (Do que Trabalha)
                </h4>
                <p className="text-xs text-slate-400">
                  Visualização detalhada de quantos funcionários exercem cada cargo e quem são os profissionais.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {roleStats.length} funções cadastradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Função / Do que Trabalha</th>
                    <th className="py-3 px-4">Setor</th>
                    <th className="py-3 px-4 text-center">Quantidade no Sistema</th>
                    <th className="py-3 px-4">% do Efetivo</th>
                    <th className="py-3 px-4">Colaboradores Alocados</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {roleStats.map((item) => {
                    const percentage = ((item.count / Math.max(1, employees.length)) * 100).toFixed(1);

                    return (
                      <tr
                        key={item.role}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              <Briefcase className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {item.role}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.department}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {item.count} {item.count === 1 ? 'colaborador' : 'colaboradores'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                              {percentage}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap max-w-md">
                            {item.employees.map((emp) => {
                              const { hasPunched, isOnDayOffToday } = getEmployeeTodayStatus(emp.id);
                              return (
                                <div
                                  key={emp.id}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] ${
                                    isOnDayOffToday
                                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
                                      : hasPunched
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                  title={`${emp.name} (${emp.badgeNumber}) - ${
                                    isOnDayOffToday ? 'Em Folga Hoje' : hasPunched ? 'Presente Hoje' : 'Aguardando no Portão'
                                  }`}
                                >
                                  <img
                                    src={emp.photoUrl}
                                    alt={emp.name}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                  <span className="font-medium truncate max-w-[110px]">{emp.name}</span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {emp.badgeNumber}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedRoleFilter(item.role);
                              setViewMode('attendance_matrix');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-900 transition-colors whitespace-nowrap"
                            title={`Ver apenas colaboradores que trabalham como ${item.role} no quadro de escala`}
                          >
                            Filtrar no Quadro →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW EMPLOYEE */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cadastrar Novo Funcionário
                </h3>
                <p className="text-xs text-slate-500">
                  O colaborador ficará disponível imediatamente para o vigia bater ponto no portão.
                </p>
              </div>
              <button
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Ex: João Ferreira de Souza"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Função *
                  </label>
                  <input
                    type="text"
                    required
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    placeholder="Ex: Operador de Máquinas"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Setor / Departamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    placeholder="Ex: Produção, Logística..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* OPÇÃO DE FOTO DO FUNCIONÁRIO (Associação imediata ao nome e cargo) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Foto do Funcionário (Crachá & Portaria)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Caso o colaborador deseje que sua foto seja cadastrada no sistema
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-700 dark:text-emerald-300 select-none">
                    <input
                      type="checkbox"
                      checked={empIncludePhoto}
                      onChange={(e) => setEmpIncludePhoto(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300"
                    />
                    <span>Incluir foto</span>
                  </label>
                </div>

                {empIncludePhoto ? (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-start sm:items-center gap-3.5 flex-col sm:flex-row">
                      {/* Photo Preview Frame */}
                      <div className="relative group shrink-0">
                        <img
                          src={empPhoto}
                          alt="Prévia da foto do colaborador"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-sm bg-white dark:bg-slate-700"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(empName || 'Colaborador')}&background=059669&color=fff&size=150`;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-600 text-white rounded-full shadow-xs" title="Foto Ativa">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Photo Actions & Device Upload */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Native File Input for computer or mobile camera */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handlePhotoFileUpload}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Carregar Foto / Tirar Foto</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>Colar Link (URL)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEmpIncludePhoto(false)}
                            className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                          >
                            Não colocar foto
                          </button>
                        </div>

                        {customPhotoFileName ? (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Arquivo anexado: <strong>{customPhotoFileName}</strong></span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Pode anexar foto do celular/computador ou escolher um modelo abaixo
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Collapsible URL Input */}
                    {showUrlInput && (
                      <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                        <input
                          type="url"
                          value={empCustomUrl}
                          onChange={(e) => setEmpCustomUrl(e.target.value)}
                          placeholder="Cole a URL da foto (https://...)"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyUrl()}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 rounded-lg shadow-2xs"
                        >
                          Aplicar URL
                        </button>
                      </div>
                    )}

                    {/* Preset Avatars Strip */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        Ou escolha uma foto modelo pronta:
                      </label>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {AVATAR_OPTIONS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEmpPhoto(url);
                              setCustomPhotoFileName(null);
                            }}
                            className={`relative rounded-xl p-0.5 border-2 transition-all shrink-0 ${
                              empPhoto === url && !customPhotoFileName
                                ? 'border-emerald-600 scale-105 ring-2 ring-emerald-500/30'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                            title={`Foto modelo ${idx + 1}`}
                          >
                            <img src={url} alt={`Avatar ${idx + 1}`} className="w-9 h-9 rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>O colaborador optou por não ter foto. O sistema exibirá o crachá com suas iniciais.</span>
                    <button
                      type="button"
                      onClick={() => setEmpIncludePhoto(true)}
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline ml-2 whitespace-nowrap"
                    >
                      Mudar e colocar foto
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Matrícula / Crachá
                  </label>
                  <input
                    type="text"
                    value={empBadge}
                    onChange={(e) => setEmpBadge(e.target.value)}
                    placeholder="Ex: PR-1050 (deixe vazio para auto)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turno de Trabalho
                  </label>
                  <input
                    type="text"
                    disabled
                    value="06:00 às 12:00 (Oficial)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total de Folgas de Direito
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={empTotalDaysOff}
                    onChange={(e) => setEmpTotalDaysOff(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetAddEmployeeForm}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER DAY OFF - INTERACTIVE EMPLOYEE SELECTOR & FORM */}
      {isDayOffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {dayOffStep === 'select'
                      ? 'Lançar Folga: Selecione o Colaborador'
                      : `Configurar Folga: ${selectedEmployeeForDayOff?.name || 'Colaborador'}`}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {dayOffStep === 'select'
                      ? 'Clique no funcionário desejado para abrir os detalhes e lançar a folga'
                      : 'O saldo de folgas será debitado e atualizado instantaneamente'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {dayOffStep === 'form' && (
                  <button
                    type="button"
                    onClick={() => setDayOffStep('select')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Trocar Colaborador</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsDayOffModalOpen(false);
                    setSelectedEmployeeForDayOff(null);
                    setDayOffStep('select');
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  title="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* STEP 1: INTERACTIVE EMPLOYEE SELECTOR */}
            {dayOffStep === 'select' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Search & Department Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={dayOffSearch}
                      onChange={(e) => setDayOffSearch(e.target.value)}
                      placeholder="Buscar por nome, cargo, matrícula ou setor..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Department pill filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDayOffDeptFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                        dayOffDeptFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Todos ({employees.length})
                    </button>
                    {departments
                      .filter((d) => d !== 'ALL')
                      .map((dept) => {
                        const count = employees.filter((e) => e.department === dept).length;
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => setDayOffDeptFilter(dept)}
                            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                              dayOffDeptFilter === dept
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {dept} ({count})
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Employee Cards List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Clique em um funcionário para lançar folga:</span>
                    <span>{dayOffFilteredEmployees.length} encontrados</span>
                  </div>

                  {dayOffFilteredEmployees.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold">Nenhum funcionário encontrado</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDayOffSearch('');
                          setDayOffDeptFilter('ALL');
                        }}
                        className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Limpar busca e filtros
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {dayOffFilteredEmployees.map((emp) => {
                        const remaining = Math.max(0, emp.totalDaysOff - emp.usedDaysOff);
                        const isExhausted = remaining === 0;

                        return (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setSelectedEmployeeForDayOff(emp);
                              setDayOffStep('form');
                            }}
                            className={`p-3 rounded-xl border transition-all text-left cursor-pointer group flex flex-col justify-between gap-2.5 ${
                              isExhausted
                                ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 hover:border-slate-400'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={emp.photoUrl}
                                alt={emp.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    emp.name
                                  )}&background=059669&color=fff&size=150`;
                                }}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {emp.name}
                                  </h4>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {emp.role} · <span className="font-mono">{emp.badgeNumber}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  Setor: {emp.department}
                                </div>
                              </div>
                            </div>

                            {/* Folga Status & Select Trigger */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                              {emp.isOnDayOffToday ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                                  <CalendarCheck className="w-3.5 h-3.5" /> De Folga Hoje
                                </span>
                              ) : isExhausted ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                                  0 restantes ({emp.usedDaysOff}/{emp.totalDaysOff} pegas)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {remaining} restante{remaining > 1 ? 's' : ''} ({emp.usedDaysOff}/{emp.totalDaysOff})
                                </span>
                              )}

                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                Selecionar <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: FORM & CONFIRMATION FOR SELECTED EMPLOYEE */}
            {dayOffStep === 'form' && selectedEmployeeForDayOff && (
              <form onSubmit={handleDayOffSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Selected Employee Summary Card */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-slate-800/60 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedEmployeeForDayOff.photoUrl}
                      alt={selectedEmployeeForDayOff.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          selectedEmployeeForDayOff.name
                        )}&background=059669&color=fff&size=150`;
                      }}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedEmployeeForDayOff.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white">
                          Selecionado
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {selectedEmployeeForDayOff.role} · Setor {selectedEmployeeForDayOff.department}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Matrícula: {selectedEmployeeForDayOff.badgeNumber} · Turno 06:00 às 12:00
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDayOffStep('select')}
                    className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Escolher Outro</span>
                  </button>
                </div>

                {/* Day off quota breakdown gauge */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs space-y-2 border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Direito Total de Folgas:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {selectedEmployeeForDayOff.totalDaysOff} folgas contratuais
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Folgas Já Pegas:</span>
                    <strong className="font-mono text-amber-600 dark:text-amber-400">
                      {selectedEmployeeForDayOff.usedDaysOff} utilizadas até o momento
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Saldo Restante Disponível:
                    </span>
                    <strong
                      className={`font-mono text-sm font-bold ${
                        selectedEmployeeForDayOff.usedDaysOff >= selectedEmployeeForDayOff.totalDaysOff
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {Math.max(0, selectedEmployeeForDayOff.totalDaysOff - selectedEmployeeForDayOff.usedDaysOff)} folga(s) disponível(is)
                    </strong>
                  </div>

                  {/* Visual gauge bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selectedEmployeeForDayOff.usedDaysOff >= selectedEmployeeForDayOff.totalDaysOff
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (selectedEmployeeForDayOff.usedDaysOff / Math.max(1, selectedEmployeeForDayOff.totalDaysOff)) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  {selectedEmployeeForDayOff.usedDaysOff >= selectedEmployeeForDayOff.totalDaysOff && (
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        Este colaborador já atingiu o limite de folgas contratadas ({selectedEmployeeForDayOff.totalDaysOff}). O lançamento será registrado como folga administrativa extraordinária.
                      </span>
                    </div>
                  )}
                </div>

                {/* Date Selection with Quick Shortcuts */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Data da Folga
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setDayOffDate(new Date().toISOString().slice(0, 10))}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setDayOffDate(tomorrow.toISOString().slice(0, 10));
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        Amanhã
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
                          setDayOffDate(d.toISOString().slice(0, 10));
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        Próx. Segunda
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={dayOffDate}
                    onChange={(e) => setDayOffDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Reason / Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Motivo / Categoria da Folga
                  </label>
                  <select
                    value={dayOffReason}
                    onChange={(e) => setDayOffReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Folga de Escala Programada">Folga de Escala Programada (Turno Regular)</option>
                    <option value="Compensação de Horas Extras">Compensação de Horas Extras / Banco de Horas</option>
                    <option value="Folga Aniversário">Folga Aniversário</option>
                    <option value="Acordo Sindical / Coletivo">Acordo Sindical / Convenção Coletiva</option>
                    <option value="Dispensa Administrativa da Direção">Dispensa Administrativa da Direção</option>
                    <option value="Férias Regulamentares">Férias Regulamentares</option>
                    <option value="Licença / Atestado Médico">Licença / Atestado Médico Aprovado</option>
                  </select>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações / Justificativa Interna (Opcional)
                  </label>
                  <input
                    type="text"
                    value={dayOffNotes}
                    onChange={(e) => setDayOffNotes(e.target.value)}
                    placeholder="Ex: Aprovado pelo gerente de operações; escala invertida..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDayOffStep('select')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar à Seleção</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDayOffModalOpen(false);
                        setSelectedEmployeeForDayOff(null);
                        setDayOffStep('select');
                      }}
                      className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Debitar Folga</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FLOATING SUCCESS TOAST NOTIFICATION FOR DAY OFF */}
      {dayOffFeedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">{dayOffFeedbackMessage}</span>
          <button
            onClick={() => setDayOffFeedbackMessage(null)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL: DEDICATED REMOVE EMPLOYEE PANEL */}
      {isRemoveEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Remover Funcionários do Sistema
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione o colaborador que deseja remover do monitoramento e da portaria.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRemoveEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search inside removal modal */}
            <div className="my-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={removeEmployeeFilter}
                  onChange={(e) => setRemoveEmployeeFilter(e.target.value)}
                  placeholder="Pesquisar por nome, matrícula ou setor..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Scrollable list of employees with direct remove action */}
            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1 flex-1">
              {employees
                .filter((emp) => {
                  if (!removeEmployeeFilter.trim()) return true;
                  const term = removeEmployeeFilter.toLowerCase();
                  return (
                    emp.name.toLowerCase().includes(term) ||
                    emp.badgeNumber.toLowerCase().includes(term) ||
                    emp.department.toLowerCase().includes(term) ||
                    emp.role.toLowerCase().includes(term)
                  );
                })
                .map((emp) => (
                  <div
                    key={emp.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={emp.photoUrl}
                        alt={emp.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=059669&color=fff&size=150`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {emp.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {emp.role} · {emp.department} ({emp.badgeNumber})
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Turno Oficial: 06:00 às 12:00
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEmployeeToDelete(emp);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Remover</span>
                    </button>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 shrink-0">
              <span>{employees.length} colaboradores cadastrados</span>
              <button
                onClick={() => setIsRemoveEmployeeModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM EMPLOYEE REMOVAL */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remover Funcionário do Sistema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Esta ação excluirá o colaborador do monitoramento da direção e da tela de ponto do vigia na portaria.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3 mb-4">
              <img
                src={employeeToDelete.photoUrl}
                alt={employeeToDelete.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="text-xs min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block truncate">
                  {employeeToDelete.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block truncate">
                  {employeeToDelete.role} · {employeeToDelete.department} ({employeeToDelete.badgeNumber})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  removeEmployee(employeeToDelete.id);
                  setEmployeeToDelete(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar e Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET RECORDS CONFIRMATION MODAL */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Zerar Todas as Entradas de Registros?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Esta ação limpará todas as {timeRecords.length} entradas de ponto batidas na portaria.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1 mb-4">
              <p className="font-semibold">O que acontecerá ao zerar:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900 dark:text-amber-200">
                <li>Todos os colaboradores voltarão ao status <strong>&quot;Aguardando Chegada&quot;</strong>.</li>
                <li>O contador de presentes voltará para <strong>0</strong>.</li>
                <li>Os alertas e notificações de atraso serão limpos.</li>
                <li>O vigia poderá bater a entrada de cada colaborador novamente com 1 clique.</li>
              </ul>
            </div>

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
                <span>Sim, Zerar Todas as Entradas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EMPLOYEE PHOTO */}
      {isEditPhotoModalOpen && selectedEmployeeForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Alterar Foto do Colaborador
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedEmployeeForPhoto.name} ({selectedEmployeeForPhoto.badgeNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPhotoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <img
                  src={editPhotoCurrent}
                  alt={selectedEmployeeForPhoto.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-sm bg-white dark:bg-slate-700"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployeeForPhoto.name)}&background=059669&color=fff&size=150`;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedEmployeeForPhoto.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedEmployeeForPhoto.role} · {selectedEmployeeForPhoto.department}
                  </p>
                  {editPhotoFileName && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                      ✓ Novo arquivo: {editPhotoFileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Upload buttons */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*"
                  onChange={handleEditPhotoFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Nova Foto / Tirar Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditShowUrlInput(!editShowUrlInput)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Inserir URL da foto"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {editShowUrlInput && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                    <input
                      type="url"
                      value={editCustomUrl}
                      onChange={(e) => setEditCustomUrl(e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editCustomUrl.trim()) {
                          setEditPhotoCurrent(editCustomUrl.trim());
                          setEditPhotoFileName(null);
                          setEditShowUrlInput(false);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 rounded-lg"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {/* Preset options */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Ou escolher foto da galeria corporativa:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {AVATAR_OPTIONS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditPhotoCurrent(url);
                        setEditPhotoFileName(null);
                      }}
                      className={`relative rounded-xl p-0.5 border-2 transition-all shrink-0 ${
                        editPhotoCurrent === url && !editPhotoFileName
                          ? 'border-emerald-600 scale-105 ring-2 ring-emerald-500/30'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx}`} className="w-9 h-9 rounded-lg object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditPhotoCurrent(`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployeeForPhoto.name)}&background=059669&color=fff&size=150`);
                      setEditPhotoFileName(null);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white whitespace-nowrap"
                  >
                    Usar Iniciais
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditPhotoModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedPhoto}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  Salvar Nova Foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNIFIED EDIT EMPLOYEE & MANAGE DAYS OFF (ALTERAR FUNCIONÁRIO & FOLGAS) */}
      {isEditEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Alterar Funcionário & Gerenciar Folgas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selecione outro colaborador cadastrado para o monitoramento atual, edite dados e ajuste a escala e folgas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeAndDaysOff} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Feedback Alert Banner */}
              {editFeedbackMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{editFeedbackMessage}</span>
                </div>
              )}

              {/* Step 1: Campo de Busca com Lupa para Seleção de Funcionário */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Buscar e Selecionar Funcionário para Alterar:</span>
                  </label>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    {filteredEmployeesForEdit.length} de {employees.length} colaboradores encontrados
                  </span>
                </div>

                {/* Campo de Busca com Ícone de Lupa */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 dark:text-indigo-400 pointer-events-none" />
                  <input
                    type="text"
                    value={editSearchQuery}
                    onChange={(e) => setEditSearchQuery(e.target.value)}
                    placeholder="Digite o nome, cargo/função ou matrícula do funcionário..."
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                  />
                  {editSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setEditSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista de Resultados de Busca para Seleção com 1 Clique */}
                <div className="max-h-44 overflow-y-auto rounded-xl border border-indigo-100 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 divide-y divide-slate-100 dark:divide-slate-750 shadow-xs">
                  {filteredEmployeesForEdit.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      Nenhum funcionário encontrado para a busca &quot;{editSearchQuery}&quot;.
                    </div>
                  ) : (
                    filteredEmployeesForEdit.map((emp) => {
                      const isSelected = emp.id === selectedEditEmpId;
                      const rem = Math.max(0, (emp.totalDaysOff ?? 0) - (emp.usedDaysOff ?? 0));
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            populateEditForm(emp);
                          }}
                          className={`w-full p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-100 border-l-4 border-l-indigo-600'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={emp.photoUrl}
                              alt={emp.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {emp.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  {emp.badgeNumber}
                                </span>
                                <span>·</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{emp.role}</span>
                                <span>·</span>
                                <span>{emp.department}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                              {rem} folga{rem === 1 ? '' : 's'} restante{rem === 1 ? '' : 's'}
                            </span>
                            {isSelected ? (
                              <span className="p-1 rounded-full bg-indigo-600 text-white">
                                <Check className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                                Selecionar
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Card de Destaque do Funcionário Atualmente Carregado para Edição */}
                {selectedEditEmpId && (() => {
                  const currentEmp = employees.find((e) => e.id === selectedEditEmpId);
                  if (!currentEmp) return null;
                  const currentRem = Math.max(0, (currentEmp.totalDaysOff ?? 0) - (currentEmp.usedDaysOff ?? 0));
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-indigo-500/40 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={currentEmp.photoUrl}
                          alt={currentEmp.name}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-indigo-400 dark:border-indigo-600 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs sm:text-sm text-slate-900 dark:text-white font-extrabold truncate">
                              {currentEmp.name}
                            </strong>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold font-mono shrink-0">
                              {currentEmp.badgeNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentEmp.role}</span>
                            <span>·</span>
                            <span>{currentEmp.department}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                          Saldo Atual: {currentRem} folga{currentRem === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Main Content Grid: Left Column = Employee Details, Right Column = Days Off & Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* COLUMN 1: DADOS CADASTRAIS DO FUNCIONÁRIO */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      1. Dados Cadastrais & Horário
                    </h4>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Nome Completo do Colaborador:
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silva"
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Cargo e Setor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Cargo / Função:</span>
                        </label>
                        <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                          Alteração Direta
                        </span>
                      </div>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        placeholder="Ex: Professor(a), Agente de Portaria, Coordenador(a)"
                        required
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Setor / Departamento:
                      </label>
                      <select
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {departments
                          .filter((d) => d !== 'ALL')
                          .map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        {!departments.includes('Produção') && <option value="Produção">Produção</option>}
                        {!departments.includes('Logística') && <option value="Logística">Logística</option>}
                        {!departments.includes('Administrativo') && <option value="Administrativo">Administrativo</option>}
                        {!departments.includes('Manutenção') && <option value="Manutenção">Manutenção</option>}
                        {!departments.includes('Qualidade') && <option value="Qualidade">Qualidade</option>}
                      </select>
                    </div>
                  </div>

                  {/* Matrícula e Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Matrícula / Crachá:
                      </label>
                      <input
                        type="text"
                        value={editBadge}
                        onChange={(e) => setEditBadge(e.target.value)}
                        placeholder="Ex: MAT-015"
                        required
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Telefone / Contato:
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="(11) 98888-0000"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Horário de Turno Oficial */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Entrada Oficial:
                      </label>
                      <input
                        type="time"
                        value={editExpectedStart}
                        onChange={(e) => setEditExpectedStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Saída Oficial:
                      </label>
                      <input
                        type="time"
                        value={editExpectedEnd}
                        onChange={(e) => setEditExpectedEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Tolerância:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={editTolerance}
                          onChange={(e) => setEditTolerance(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">min</span>
                      </div>
                    </div>
                  </div>

                  {/* Active status */}
                  <div className="pt-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                      />
                      <span>Colaborador com vínculo ativo na empresa</span>
                    </label>
                  </div>
                </div>

                {/* COLUMN 2: GERENCIAMENTO DE FOLGAS E ESCALA */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      2. Gerenciar Escala & Folgas
                    </h4>
                  </div>

                  {/* Escala de Trabalho */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Modelo da Escala de Trabalho:
                    </label>
                    <select
                      value={editShiftSchedule}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditShiftSchedule(val);
                        // Auto-adjust default pattern if 5x2 or 6x1
                        if (val === '5x2') {
                          setEditDaysOffPattern(['Sábado', 'Domingo']);
                        } else if (val === '6x1') {
                          setEditDaysOffPattern(['Domingo']);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {SHIFT_SCHEDULE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dias da Semana de Folga Fixa */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Dias da Semana de Folga Fixa:
                      </label>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEditDaysOffPattern(['Domingo'])}
                          className="text-indigo-600 hover:underline"
                        >
                          6x1 (Dom)
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setEditDaysOffPattern(['Sábado', 'Domingo'])}
                          className="text-indigo-600 hover:underline"
                        >
                          5x2 (Sáb+Dom)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      {DAYS_OF_WEEK_OPTIONS.map((day) => {
                        const isSelected = editDaysOffPattern.includes(day);
                        const shortLabel = day.replace('-feira', '');
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleDayOffPattern(day)}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                            title={`Alternar folga na ${day}`}
                          >
                            {shortLabel}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Dias selecionados: {editDaysOffPattern.length > 0 ? editDaysOffPattern.join(', ') : 'Nenhum dia fixo'}
                    </span>
                  </div>

                  {/* Saldo de Folgas - Campo de Alteração Direta */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-xl border-2 border-emerald-300 dark:border-emerald-700 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <CalendarCheck className="w-4 h-4 text-emerald-600" />
                        <span>Saldo de Folgas Restantes:</span>
                      </label>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                        Alteração Direta
                      </span>
                    </div>

                    {/* Campo de alteração direta com botões de - e + */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemainingDaysOffChange(editRemainingDaysOff - 1)}
                        className="w-9 h-9 rounded-lg bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-emerald-950 dark:text-white font-extrabold text-base flex items-center justify-center transition-colors cursor-pointer"
                        title="Diminuir 1 dia de folga"
                      >
                        -
                      </button>

                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          value={editRemainingDaysOff}
                          onChange={(e) => handleRemainingDaysOffChange(Number(e.target.value))}
                          className="w-full text-center px-3 py-2 text-base font-extrabold font-mono rounded-lg border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">
                          dia{editRemainingDaysOff === 1 ? '' : 's'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemainingDaysOffChange(editRemainingDaysOff + 1)}
                        className="w-9 h-9 rounded-lg bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-emerald-950 dark:text-white font-extrabold text-base flex items-center justify-center transition-colors cursor-pointer"
                        title="Adicionar 1 dia de folga"
                      >
                        +
                      </button>
                    </div>

                    {/* Presets rápidos para o Saldo de Folgas */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">Preencher saldo:</span>
                      {[0, 1, 2, 3, 5, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleRemainingDaysOffChange(num)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                            editRemainingDaysOff === num
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {num} {num === 1 ? 'dia' : 'dias'}
                        </button>
                      ))}
                    </div>

                    {/* Detalhamento de Saldo em cards menores */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60 text-center">
                      <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300">
                        <span>Folgas já gozadas: </span>
                        <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">{editUsedDaysOff}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-800/60 text-[10px] text-slate-600 dark:text-slate-300">
                        <span>Direito total acumulado: </span>
                        <strong className="text-slate-900 dark:text-white font-mono font-bold">{editTotalDaysOff}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Situação Hoje: De Folga Hoje */}
                  <div className="p-2.5 rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 flex items-center justify-between">
                    <label className="text-xs font-semibold text-sky-950 dark:text-sky-200 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsOnDayOffToday}
                        onChange={(e) => setEditIsOnDayOffToday(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded-md border-sky-300 focus:ring-sky-500"
                      />
                      <span>Colaborador está de folga HOJE no sistema</span>
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      editIsOnDayOffToday ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {editIsOnDayOffToday ? 'FOLGA ATIVA' : 'ESCALADO'}
                    </span>
                  </div>

                  {/* Agendar Data Específica de Folga (Opcional) */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shouldScheduleDayOff}
                        onChange={(e) => setShouldScheduleDayOff(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                      />
                      <span>Agendar nova folga no calendário oficial</span>
                    </label>

                    {shouldScheduleDayOff && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 animate-in fade-in">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Data da Folga:
                          </label>
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Motivo da Folga:
                          </label>
                          <select
                            value={scheduleReason}
                            onChange={(e) => setScheduleReason(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="Folga de Escala Programada">Folga de Escala Programada</option>
                            <option value="Compensação de Banco de Horas">Compensação de Banco de Horas</option>
                            <option value="Folga por Merecimento">Folga por Merecimento</option>
                            <option value="Folga Médica / Atestado">Folga Médica / Atestado</option>
                            <option value="Folga DSR (Descanso Semanal)">Folga DSR (Descanso Semanal)</option>
                            <option value="Acordo com a Direção">Acordo com a Direção</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  As alterações são gravadas no banco de dados e sincronizadas com todas as abas.
                </span>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditEmployeeModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações do Funcionário & Folgas</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

