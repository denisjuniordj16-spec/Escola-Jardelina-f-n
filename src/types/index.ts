export type PunctualityStatus = 'ON_TIME' | 'EARLY' | 'LATE_MILD' | 'LATE_CRITICAL' | 'ABSENT';

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  badgeNumber: string;
  photoUrl: string;
  expectedStartTime: string; // "06:00"
  expectedEndTime: string;   // "12:00"
  toleranceMinutes: number;  // Default 10 min
  active: boolean;
  phone?: string;
  totalDaysOff: number;      // Total de folgas que o funcionário tem direito
  usedDaysOff: number;       // Quantidade de folgas que já foram pegas
  isOnDayOffToday?: boolean; // Se o colaborador está de folga hoje
  daysOffPattern?: string[]; // Dias da semana de folga fixa: ["Domingo", "Segunda-feira", etc.]
  shiftSchedule?: string;    // Escala de trabalho: "6x1", "5x2", "12x36", "Personalizada"
}

export interface DayOffRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  badgeNumber: string;
  date: string;              // "2026-10-30"
  dateFormatted: string;     // "30/10/2026"
  reason: string;            // e.g. "Folga de Escala", "Compensação de Horas"
  registeredAt: string;      // ISO string
  registeredBy: string;      // "Diretoria Geral"
  remainingAfter: number;    // Folgas restantes após esta folga
}

export type RecordType = 'ENTRADA' | 'SAIDA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM';

export interface TimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  badgeNumber: string;
  type: RecordType;
  timestamp: string;      // ISO string
  dateFormatted: string;  // "30/10/2026"
  timeFormatted: string;  // "07:54:12"
  expectedTime: string;   // "06:00"
  expectedEndTime: string; // "12:00"
  punctuality: PunctualityStatus;
  diffMinutes: number;    // e.g. -6 (early), 0 (exact), +18 (late)
  registeredBy: string;   // e.g. "Vigia Portão 01"
  gate: string;           // e.g. "Portão Principal"
  notes?: string;
  delayReason?: string;
  delayReasonRegisteredAt?: string;
  needsDelayReason?: boolean;
}

export type AnnouncementCategory = 'GERAL' | 'URGENTE' | 'PORTARIA' | 'DIRECAO' | 'RH';
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANTE' | 'URGENTE';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  createdAt: string;       // ISO string
  timeFormatted: string;   // "08:15"
  dateFormatted: string;   // "30/10/2026"
  author: string;          // e.g. "Diretoria Executiva"
  readCount: number;
  isUrgent?: boolean;
}

export interface LateAlertNotification {
  id: string;
  recordId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  badgeNumber: string;
  photoUrl: string;
  timestamp: string;
  timeFormatted: string;
  dateFormatted: string;
  expectedStartTime: string; // "06:00"
  expectedEndTime: string;   // "12:00"
  lateMinutes: number;
  isAfter18: boolean;
  delayReason?: string;
  read: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export type ActiveTab = 'communication' | 'guard' | 'management' | 'split' | 'login';

export type UserRole = 'portaria' | 'direção';

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  perfil: UserRole;
  ativo: boolean;
  createdAt?: string;
}

export interface CompanySettings {
  name: string;
  subtitle: string;
  emblemType: 'preset' | 'custom';
  emblemPresetId: 'shield' | 'factory' | 'gear' | 'hexagon' | 'globe' | 'building' | 'leaf' | 'award';
  emblemUrl: string; // custom image url or data URL
  primaryColor: string; // hex or tailwind class
}
