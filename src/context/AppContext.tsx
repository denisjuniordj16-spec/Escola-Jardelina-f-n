import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Employee,
  TimeRecord,
  Announcement,
  ActiveTab,
  PunctualityStatus,
  RecordType,
  LateAlertNotification,
  DayOffRecord,
  CompanySettings,
} from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TIME_RECORDS,
  INITIAL_DAY_OFF_RECORDS,
} from '../data/mockData';
import {
  speechController,
  SpeechState,
  playSuccessBeep,
  playAlertBeep,
  playDirectionAlertSound,
} from '../utils/audio';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'Escola Jardelina Freire do Nascimento',
  subtitle: 'Controle de Ponto e Portaria Escolar · Turno 06:00 às 12:00',
  emblemType: 'custom',
  emblemPresetId: 'shield',
  emblemUrl: '/escola_emblem.jpeg',
  primaryColor: '#1d4ed8',
};

const STORAGE_KEYS = {
  EMPLOYEES: 'portaponto_employees_v3',
  RECORDS: 'portaponto_records_v4',
  ANNOUNCEMENTS: 'portaponto_announcements_v3',
  NOTIFICATIONS: 'portaponto_notifications_v4',
  DAYS_OFF: 'portaponto_daysoff_v3',
  VOICE_CONFIRM: 'portaponto_voice_confirm_v3',
  DARK_MODE: 'portaponto_dark_mode_v3',
  COMPANY_SETTINGS: 'portaponto_company_settings_v3',
};

const BROADCAST_CHANNEL_NAME = 'portaponto_live_sync_channel_v3';

interface AppContextType {
  isCloudSynced: boolean;
  employees: Employee[];
  timeRecords: TimeRecord[];
  clearAllRecords: () => void;
  announcements: Announcement[];
  notifications: LateAlertNotification[];
  dayOffRecords: DayOffRecord[];
  unreadNotificationsCount: number;
  activeLateAlertModal: LateAlertNotification | null;
  dismissLateAlertModal: () => void;
  acknowledgeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  speechState: SpeechState;
  speakText: (text: string, withChime?: boolean) => void;
  stopSpeech: () => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  setSpeechRate: (rate: number) => void;
  voiceConfirmationEnabled: boolean;
  setVoiceConfirmationEnabled: (val: boolean) => void;
  soundEffectsEnabled: boolean;
  setSoundEffectsEnabled: (val: boolean) => void;
  directionVoiceAlertEnabled: boolean;
  setDirectionVoiceAlertEnabled: (val: boolean) => void;
  lastRegisteredRecord: TimeRecord | null;
  pendingReasonRecord: TimeRecord | null;
  setPendingReasonRecord: (rec: TimeRecord | null) => void;
  registerDelayReason: (recordId: string, reason: string) => void;
  registerPunch: (
    employeeId: string,
    type?: RecordType,
    customTime?: { hours: number; minutes: number; seconds?: number },
    customNotes?: string
  ) => Promise<TimeRecord | null>;
  undoPunch: (recordId: string) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'timeFormatted' | 'dateFormatted' | 'readCount'>) => void;
  deleteAnnouncement: (id: string) => void;
  addEmployee: (employeeData: Omit<Employee, 'id'>) => Employee;
  removeEmployee: (employeeId: string) => void;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  updateEmployeePhoto: (employeeId: string, photoUrl: string) => void;
  registerDayOff: (employeeId: string, date: string, reason: string) => void;
  cancelDayOff: (dayOffId: string) => void;
  adjustEmployeeDaysOff: (employeeId: string, deltaTotal: number) => void;
  currentTimeString: string;
  currentDateString: string;
  simulatedTime: { hours: number; minutes: number } | null;
  setSimulatedTime: (val: { hours: number; minutes: number } | null) => void;
  stats: {
    totalExpected: number;
    presentCount: number;
    absentCount: number;
    onDayOffCount: number;
    onTimeCount: number;
    lateCount: number;
    attendanceRate: number;
    averageLateMinutes: number;
  };
  getEmployeeTodayStatus: (employeeId: string) => {
    hasPunched: boolean;
    lastRecord?: TimeRecord;
    status: PunctualityStatus;
    isOnDayOffToday: boolean;
  };
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  resetCompanySettings: () => void;
  isCompanyModalOpen: boolean;
  setIsCompanyModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation - Check token with localStorage.getItem upon loading the system and redirect to the panel if it exists
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const storedEmail = (localStorage.getItem('auth_user_email') || '').toLowerCase();
        const isAdmin =
          storedEmail === 'denis.junior.dj16@gmail.vom' ||
          storedEmail === 'denis.junior.dj16@gmail.com' ||
          storedEmail.includes('denis');
        return isAdmin ? 'management' : 'guard';
      }
    } catch {
      // fallback
    }
    return 'login';
  });

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Settings
  const [voiceConfirmationEnabled, setVoiceConfirmationEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOICE_CONFIRM);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setVoiceConfirmationEnabled = (val: boolean) => {
    setVoiceConfirmationEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.VOICE_CONFIRM, JSON.stringify(val));
  };

  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(true);
  const [directionVoiceAlertEnabled, setDirectionVoiceAlertEnabled] = useState<boolean>(true);

  // Company Branding & Custom Emblem state
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.name || parsed.name.includes('Industrial') || !parsed.emblemUrl) {
          localStorage.setItem(STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
          return DEFAULT_COMPANY_SETTINGS;
        }
        return { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
      }
      return DEFAULT_COMPANY_SETTINGS;
    } catch {
      return DEFAULT_COMPANY_SETTINGS;
    }
  });

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);

  // Data
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_TIME_RECORDS;
    } catch {
      return INITIAL_TIME_RECORDS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [notifications, setNotifications] = useState<LateAlertNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dayOffRecords, setDayOffRecords] = useState<DayOffRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAYS_OFF);
      return saved ? JSON.parse(saved) : INITIAL_DAY_OFF_RECORDS;
    } catch {
      return INITIAL_DAY_OFF_RECORDS;
    }
  });

  const [lastRegisteredRecord, setLastRegisteredRecord] = useState<TimeRecord | null>(null);
  const [pendingReasonRecord, setPendingReasonRecord] = useState<TimeRecord | null>(null);
  const [activeLateAlertModal, setActiveLateAlertModal] = useState<LateAlertNotification | null>(null);

  // Time simulation
  const [simulatedTime, setSimulatedTime] = useState<{ hours: number; minutes: number } | null>(null);

  // Speech State
  const [speechState, setSpeechState] = useState<SpeechState>(speechController.getState());

  useEffect(() => {
    const unsubscribe = speechController.subscribe((state) => {
      setSpeechState(state);
    });
    return unsubscribe;
  }, []);

  // Broadcast channel for multi-tab live sync
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'NEW_RECORD') {
          setTimeRecords((prev) => [payload, ...prev.filter((r) => r.id !== payload.id)]);
          setLastRegisteredRecord(payload);
        } else if (type === 'LATE_ALERT') {
          setNotifications((prev) => [payload, ...prev.filter((n) => n.id !== payload.id)]);
          setActiveLateAlertModal(payload);
          playDirectionAlertSound();
        } else if (type === 'DELAY_REASON_UPDATED') {
          const { recordId, reason, registeredAt } = payload;
          setTimeRecords((prev) =>
            prev.map((r) =>
              r.id === recordId
                ? {
                    ...r,
                    delayReason: reason,
                    delayReasonRegisteredAt: registeredAt,
                    notes: `Motivo informado: ${reason}`,
                    needsDelayReason: false,
                  }
                : r
            )
          );
          setNotifications((prev) =>
            prev.map((n) => (n.recordId === recordId ? { ...n, delayReason: reason } : n))
          );
        } else if (type === 'NEW_EMPLOYEE') {
          setEmployees((prev) => [payload, ...prev.filter((e) => e.id !== payload.id)]);
        } else if (type === 'REMOVE_EMPLOYEE') {
          setEmployees((prev) => prev.filter((e) => e.id !== payload));
        } else if (type === 'UPDATE_EMPLOYEE') {
          const { employeeId, updates } = payload;
          setEmployees((prev) =>
            prev.map((e) => (e.id === employeeId ? { ...e, ...updates } : e))
          );
        } else if (type === 'UPDATE_EMPLOYEE_PHOTO') {
          const { employeeId, photoUrl } = payload;
          setEmployees((prev) =>
            prev.map((e) => (e.id === employeeId ? { ...e, photoUrl } : e))
          );
        } else if (type === 'NEW_DAY_OFF') {
          const { employeeId, dayOffRecord, newUsed, isOnToday } = payload;
          setDayOffRecords((prev) => [dayOffRecord, ...prev]);
          setEmployees((prev) =>
            prev.map((e) =>
              e.id === employeeId
                ? {
                    ...e,
                    usedDaysOff: newUsed,
                    isOnDayOffToday: isOnToday ? true : e.isOnDayOffToday,
                  }
                : e
            )
          );
        } else if (type === 'CANCEL_DAY_OFF') {
          const { dayOffId, employeeId, newUsed } = payload;
          setDayOffRecords((prev) => prev.filter((d) => d.id !== dayOffId));
          setEmployees((prev) =>
            prev.map((e) =>
              e.id === employeeId
                ? {
                    ...e,
                    usedDaysOff: newUsed,
                    isOnDayOffToday: false,
                  }
                : e
            )
          );
        } else if (type === 'UPDATE_COMPANY_SETTINGS') {
          setCompanySettings(payload);
        } else if (type === 'CLEAR_RECORDS') {
          setTimeRecords([]);
          setLastRegisteredRecord(null);
          setPendingReasonRecord(null);
          setNotifications([]);
          setActiveLateAlertModal(null);
        }
      };
      setChannel(bc);
    }
    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Real-time Cloud Synchronization via Firebase Firestore
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  useEffect(() => {
    // 1. Synchronize Employees in real-time
    const unsubEmployees = onSnapshot(
      collection(db, 'employees'),
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed Firestore with initial employees if cloud collection is fresh
          try {
            const batch = writeBatch(db);
            const source = employees.length > 0 ? employees : INITIAL_EMPLOYEES;
            source.forEach((emp) => {
              batch.set(doc(db, 'employees', emp.id), emp);
            });
            await batch.commit();
          } catch (seedErr) {
            console.warn('Initial Firestore employee seed:', seedErr);
          }
        } else {
          const cloudEmployees: Employee[] = [];
          snapshot.forEach((docSnap) => {
            cloudEmployees.push(docSnap.data() as Employee);
          });
          cloudEmployees.sort((a, b) => a.badgeNumber.localeCompare(b.badgeNumber));
          setEmployees(cloudEmployees);
          setIsCloudSynced(true);
        }
      },
      (error) => {
        console.warn('Employees cloud listener error:', error);
      }
    );

    // 2. Synchronize Time Attendance Records in real-time
    const unsubRecords = onSnapshot(
      collection(db, 'time_records'),
      (snapshot) => {
        const cloudRecords: TimeRecord[] = [];
        snapshot.forEach((docSnap) => {
          cloudRecords.push(docSnap.data() as TimeRecord);
        });
        cloudRecords.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setTimeRecords(cloudRecords);
        if (cloudRecords.length > 0) {
          setLastRegisteredRecord(cloudRecords[0]);
        }
      },
      (error) => {
        console.warn('Time records cloud listener error:', error);
      }
    );

    // 3. Synchronize Day Off Records in real-time
    const unsubDaysOff = onSnapshot(
      collection(db, 'day_off_records'),
      (snapshot) => {
        const cloudDaysOff: DayOffRecord[] = [];
        snapshot.forEach((docSnap) => {
          cloudDaysOff.push(docSnap.data() as DayOffRecord);
        });
        cloudDaysOff.sort(
          (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
        );
        setDayOffRecords(cloudDaysOff);
      },
      (error) => {
        console.warn('Day off records cloud listener error:', error);
      }
    );

    // 4. Synchronize Announcements in real-time
    const unsubAnnouncements = onSnapshot(
      collection(db, 'announcements'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudAnnouncements: Announcement[] = [];
          snapshot.forEach((docSnap) => {
            cloudAnnouncements.push(docSnap.data() as Announcement);
          });
          cloudAnnouncements.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAnnouncements(cloudAnnouncements);
        }
      },
      (error) => {
        console.warn('Announcements cloud listener error:', error);
      }
    );

    // 5. Synchronize Company / School Settings in real-time
    const unsubSettings = onSnapshot(
      doc(db, 'company_settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteSettings = docSnap.data() as CompanySettings;
          if (remoteSettings.name && !remoteSettings.name.includes('Industrial')) {
            setCompanySettings((prev) => ({ ...prev, ...remoteSettings }));
          } else {
            setDoc(doc(db, 'company_settings', 'global'), DEFAULT_COMPANY_SETTINGS, { merge: true }).catch(() => {});
            setCompanySettings(DEFAULT_COMPANY_SETTINGS);
          }
        } else {
          setDoc(doc(db, 'company_settings', 'global'), DEFAULT_COMPANY_SETTINGS, { merge: true }).catch(() => {});
        }
      },
      (error) => {
        console.warn('Company settings cloud listener error:', error);
      }
    );

    return () => {
      unsubEmployees();
      unsubRecords();
      unsubDaysOff();
      unsubAnnouncements();
      unsubSettings();
    };
  }, []);

  const updateCompanySettings = useCallback(async (newSettings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(merged));
      } catch (err) {
        console.error('Failed to save company settings', err);
      }
      return merged;
    });

    try {
      await setDoc(doc(db, 'company_settings', 'global'), newSettings, { merge: true });
    } catch (cloudErr) {
      console.warn('Failed to update company settings in cloud:', cloudErr);
    }
  }, []);

  const resetCompanySettings = useCallback(async () => {
    setCompanySettings(DEFAULT_COMPANY_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
    } catch (err) {
      console.error('Failed to reset company settings', err);
    }

    try {
      await setDoc(doc(db, 'company_settings', 'global'), DEFAULT_COMPANY_SETTINGS);
    } catch (cloudErr) {
      console.warn('Failed to reset company settings in cloud:', cloudErr);
    }
  }, []);

  // Clock
  const [realTime, setRealTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setRealTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTimeString = useMemo(() => {
    if (simulatedTime) {
      const h = String(simulatedTime.hours).padStart(2, '0');
      const m = String(simulatedTime.minutes).padStart(2, '0');
      const s = String(realTime.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    return realTime.toLocaleTimeString('pt-BR', { hour12: false });
  }, [realTime, simulatedTime]);

  const currentDateString = useMemo(() => {
    return realTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [realTime]);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.error('Failed to save employees', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(timeRecords));
    } catch (e) {
      console.error('Failed to save records', e);
    }
  }, [timeRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DAYS_OFF, JSON.stringify(dayOffRecords));
    } catch (e) {
      console.error('Failed to save days off', e);
    }
  }, [dayOffRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  // Add Employee from Management Monitor
  const addEmployee = useCallback(
    (data: Omit<Employee, 'id'>): Employee => {
      const newEmp: Employee = {
        ...data,
        id: `emp-${Date.now()}`,
        expectedStartTime: data.expectedStartTime || '06:00',
        expectedEndTime: data.expectedEndTime || '12:00',
        toleranceMinutes: data.toleranceMinutes ?? 10,
        totalDaysOff: data.totalDaysOff ?? 2,
        usedDaysOff: data.usedDaysOff ?? 0,
        isOnDayOffToday: false,
        active: true,
      };

      setEmployees((prev) => [newEmp, ...prev]);

      setDoc(doc(db, 'employees', newEmp.id), newEmp).catch((cloudErr) => {
        console.warn('Failed to save employee to cloud:', cloudErr);
      });

      if (channel) {
        channel.postMessage({ type: 'NEW_EMPLOYEE', payload: newEmp });
      }

      return newEmp;
    },
    [channel]
  );

  const removeEmployee = useCallback(
    async (employeeId: string) => {
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));

      try {
        await deleteDoc(doc(db, 'employees', employeeId));
      } catch (cloudErr) {
        console.warn('Failed to remove employee from cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({ type: 'REMOVE_EMPLOYEE', payload: employeeId });
      }
    },
    [channel]
  );

  const updateEmployeePhoto = useCallback(
    async (employeeId: string, photoUrl: string) => {
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, photoUrl } : e))
      );

      try {
        await setDoc(doc(db, 'employees', employeeId), { photoUrl }, { merge: true });
      } catch (cloudErr) {
        console.warn('Failed to update employee photo in cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({
          type: 'UPDATE_EMPLOYEE_PHOTO',
          payload: { employeeId, photoUrl },
        });
      }
    },
    [channel]
  );

  const updateEmployee = useCallback(
    async (employeeId: string, updates: Partial<Employee>) => {
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id !== employeeId) return e;
          return {
            ...e,
            ...updates,
          };
        })
      );

      // If name, role, department or badge changed, update recent time records for consistency
      if (updates.name || updates.department || updates.role || updates.badgeNumber) {
        setTimeRecords((prev) =>
          prev.map((r) => {
            if (r.employeeId !== employeeId) return r;
            return {
              ...r,
              employeeName: updates.name ?? r.employeeName,
              department: updates.department ?? r.department,
              employeeRole: updates.role ?? r.employeeRole,
              badgeNumber: updates.badgeNumber ?? r.badgeNumber,
            };
          })
        );
      }

      try {
        await setDoc(doc(db, 'employees', employeeId), updates, { merge: true });
      } catch (cloudErr) {
        console.warn('Failed to update employee in cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({
          type: 'UPDATE_EMPLOYEE',
          payload: { employeeId, updates },
        });
      }
    },
    [channel]
  );

  // Register Day Off for Employee (Calculates used and remaining days off!)
  const registerDayOff = useCallback(
    async (employeeId: string, date: string, reason: string) => {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return;

      const newUsed = employee.usedDaysOff + 1;
      const remainingAfter = Math.max(0, employee.totalDaysOff - newUsed);

      // Check if date is today (format: YYYY-MM-DD)
      const todayISO = new Date().toISOString().slice(0, 10);
      const isToday = date === todayISO;

      const dateParts = date.split('-');
      const dateFormatted =
        dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : date;

      const dayOffRecord: DayOffRecord = {
        id: `off-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        badgeNumber: employee.badgeNumber,
        date,
        dateFormatted,
        reason,
        registeredAt: new Date().toISOString(),
        registeredBy: 'Diretoria Geral',
        remainingAfter,
      };

      setDayOffRecords((prev) => [dayOffRecord, ...prev]);

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId
            ? {
                ...e,
                usedDaysOff: newUsed,
                isOnDayOffToday: isToday ? true : e.isOnDayOffToday,
              }
            : e
        )
      );

      try {
        await setDoc(doc(db, 'day_off_records', dayOffRecord.id), dayOffRecord);
        await setDoc(
          doc(db, 'employees', employeeId),
          {
            usedDaysOff: newUsed,
            isOnDayOffToday: isToday ? true : (employee.isOnDayOffToday ?? false),
          },
          { merge: true }
        );
      } catch (cloudErr) {
        console.warn('Failed to save day off in cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({
          type: 'NEW_DAY_OFF',
          payload: { employeeId, dayOffRecord, newUsed, isOnToday: isToday },
        });
      }
    },
    [employees, channel]
  );

  // Cancel Day Off (Refunds the used day off)
  const cancelDayOff = useCallback(
    async (dayOffId: string) => {
      const record = dayOffRecords.find((d) => d.id === dayOffId);
      if (!record) return;

      const employee = employees.find((e) => e.id === record.employeeId);
      const newUsed = employee ? Math.max(0, employee.usedDaysOff - 1) : 0;

      setDayOffRecords((prev) => prev.filter((d) => d.id !== dayOffId));

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === record.employeeId
            ? {
                ...e,
                usedDaysOff: newUsed,
                isOnDayOffToday: false,
              }
            : e
        )
      );

      try {
        await deleteDoc(doc(db, 'day_off_records', dayOffId));
        await setDoc(
          doc(db, 'employees', record.employeeId),
          {
            usedDaysOff: newUsed,
            isOnDayOffToday: false,
          },
          { merge: true }
        );
      } catch (cloudErr) {
        console.warn('Failed to cancel day off in cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({
          type: 'CANCEL_DAY_OFF',
          payload: { dayOffId, employeeId: record.employeeId, newUsed },
        });
      }
    },
    [dayOffRecords, employees, channel]
  );

  // Adjust total days off allowance for employee
  const adjustEmployeeDaysOff = useCallback(
    async (employeeId: string, deltaTotal: number) => {
      let updatedTotal = 2;
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === employeeId) {
            updatedTotal = Math.max(0, e.totalDaysOff + deltaTotal);
            return { ...e, totalDaysOff: updatedTotal };
          }
          return e;
        })
      );

      try {
        await setDoc(
          doc(db, 'employees', employeeId),
          { totalDaysOff: updatedTotal },
          { merge: true }
        );
      } catch (cloudErr) {
        console.warn('Failed to adjust days off in cloud:', cloudErr);
      }
    },
    []
  );

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !n.acknowledged).length;
  }, [notifications]);

  const dismissLateAlertModal = useCallback(() => {
    setActiveLateAlertModal(null);
  }, []);

  const acknowledgeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, read: true, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : n
      )
    );
    setActiveLateAlertModal((current) => (current?.id === id ? null : current));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, acknowledged: true })));
  }, []);

  const registerDelayReason = useCallback(
    async (recordId: string, reason: string) => {
      const registeredAt = new Date().toISOString();

      setTimeRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? {
                ...r,
                delayReason: reason,
                delayReasonRegisteredAt: registeredAt,
                notes: `Motivo informado pelo colaborador: ${reason}`,
                needsDelayReason: false,
              }
            : r
        )
      );

      setNotifications((prev) =>
        prev.map((n) => (n.recordId === recordId ? { ...n, delayReason: reason } : n))
      );

      try {
        await setDoc(
          doc(db, 'time_records', recordId),
          {
            delayReason: reason,
            delayReasonRegisteredAt: registeredAt,
            notes: `Motivo informado pelo colaborador: ${reason}`,
            needsDelayReason: false,
          },
          { merge: true }
        );
      } catch (cloudErr) {
        console.warn('Failed to update delay reason in cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({
          type: 'DELAY_REASON_UPDATED',
          payload: { recordId, reason, registeredAt },
        });
      }

      setPendingReasonRecord(null);
    },
    [channel]
  );

  const getEmployeeTodayStatus = useCallback(
    (employeeId: string) => {
      const employee = employees.find((e) => e.id === employeeId);
      const records = timeRecords.filter((r) => r.employeeId === employeeId);
      const lastRecord = records[0];
      const isOnDayOffToday = !!employee?.isOnDayOffToday;

      if (!lastRecord) {
        return {
          hasPunched: false,
          status: 'ABSENT' as PunctualityStatus,
          isOnDayOffToday,
        };
      }
      return {
        hasPunched: true,
        lastRecord,
        status: lastRecord.punctuality,
        isOnDayOffToday,
      };
    },
    [timeRecords, employees]
  );

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.active);
    const onDayOffCount = activeEmployees.filter((e) => e.isOnDayOffToday).length;
    const totalExpected = Math.max(0, activeEmployees.length - onDayOffCount);

    const presentEmpIds = new Set<string>();
    let onTimeCount = 0;
    let lateCount = 0;
    let totalLateMinutes = 0;

    employees.forEach((emp) => {
      const empRecords = timeRecords.filter((r) => r.employeeId === emp.id && r.type === 'ENTRADA');
      if (empRecords.length > 0) {
        presentEmpIds.add(emp.id);
        const firstRecord = empRecords[empRecords.length - 1];
        if (firstRecord.punctuality === 'LATE_MILD' || firstRecord.punctuality === 'LATE_CRITICAL') {
          lateCount++;
          totalLateMinutes += Math.max(0, firstRecord.diffMinutes);
        } else {
          onTimeCount++;
        }
      }
    });

    const presentCount = presentEmpIds.size;
    const absentCount = Math.max(0, totalExpected - presentCount);
    const attendanceRate = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0;
    const averageLateMinutes = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0;

    return {
      totalExpected,
      presentCount,
      absentCount,
      onDayOffCount,
      onTimeCount,
      lateCount,
      attendanceRate,
      averageLateMinutes,
    };
  }, [employees, timeRecords]);

  const registerPunch = useCallback(
    async (
      employeeId: string,
      type: RecordType = 'ENTRADA',
      customTime?: { hours: number; minutes: number; seconds?: number },
      customNotes?: string
    ): Promise<TimeRecord | null> => {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return null;

      const now = new Date();
      let nowHours = customTime ? customTime.hours : simulatedTime ? simulatedTime.hours : now.getHours();
      let nowMinutes = customTime ? customTime.minutes : simulatedTime ? simulatedTime.minutes : now.getMinutes();
      let nowSeconds = customTime?.seconds ?? now.getSeconds();

      const nowTotalMinutes = nowHours * 60 + nowMinutes;

      const expStartTime = employee.expectedStartTime || '06:00';
      const expEndTime = employee.expectedEndTime || '12:00';
      const [expH, expM] = expStartTime.split(':').map(Number);
      const expTotalMinutes = expH * 60 + expM;

      const diffMinutes = nowTotalMinutes - expTotalMinutes;
      const tolerance = employee.toleranceMinutes ?? 10;
      const isAfter18 = nowHours >= 18;

      let punctuality: PunctualityStatus = 'ON_TIME';
      if (diffMinutes <= -5) {
        punctuality = 'EARLY';
      } else if (diffMinutes <= tolerance && !isAfter18) {
        punctuality = 'ON_TIME';
      } else if (diffMinutes <= 30 && !isAfter18) {
        punctuality = 'LATE_MILD';
      } else {
        punctuality = 'LATE_CRITICAL';
      }

      const isLate = punctuality === 'LATE_MILD' || punctuality === 'LATE_CRITICAL' || isAfter18;

      const timeFormatted = `${String(nowHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')}:${String(nowSeconds).padStart(2, '0')}`;
      const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      let defaultNote = customNotes;
      if (!defaultNote) {
        if (employee.isOnDayOffToday) {
          defaultNote = 'Colaborador estava em escala de folga hoje mas compareceu';
        } else if (isAfter18) {
          defaultNote = `Chegada após as 18:00 (${diffMinutes} min após início do turno das 06:00)`;
        } else if (punctuality === 'EARLY') {
          defaultNote = `Chegou ${Math.abs(diffMinutes)} min antes do horário das 06:00`;
        } else if (punctuality === 'ON_TIME') {
          defaultNote = 'Entrada dentro do horário normal (Turno 06:00 às 12:00)';
        } else {
          defaultNote = `Atraso de ${diffMinutes} minutos (Turno 06:00 às 12:00)`;
        }
      }

      const newRecordId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const newRecord: TimeRecord = {
        id: newRecordId,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeRole: employee.role,
        department: employee.department,
        badgeNumber: employee.badgeNumber,
        type,
        timestamp: now.toISOString(),
        dateFormatted,
        timeFormatted,
        expectedTime: expStartTime,
        expectedEndTime: expEndTime,
        punctuality,
        diffMinutes,
        registeredBy: 'Vigia Portão 01',
        gate: 'Portão Principal',
        notes: defaultNote,
        needsDelayReason: isLate && type === 'ENTRADA',
      };

      if (soundEffectsEnabled) {
        if (isLate) {
          playAlertBeep();
        } else {
          playSuccessBeep();
        }
      }

      if (voiceConfirmationEnabled) {
        const shortStatus = isLate ? `com atraso de ${diffMinutes} minutos.` : 'no horário.';
        speechController.speak(
          `Entrada: ${employee.name}, às ${String(nowHours).padStart(2, '0')} e ${String(nowMinutes).padStart(2, '0')}, ${shortStatus}`
        );
      }

      let lateNotification: LateAlertNotification | null = null;
      if (isLate && type === 'ENTRADA') {
        lateNotification = {
          id: `notif-${Date.now()}`,
          recordId: newRecord.id,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeRole: employee.role,
          department: employee.department,
          badgeNumber: employee.badgeNumber,
          photoUrl: employee.photoUrl,
          timestamp: now.toISOString(),
          timeFormatted,
          dateFormatted,
          expectedStartTime: expStartTime,
          expectedEndTime: expEndTime,
          lateMinutes: Math.max(1, diffMinutes),
          isAfter18,
          read: false,
          acknowledged: false,
        };

        if (soundEffectsEnabled) {
          playDirectionAlertSound();
        }

        if (directionVoiceAlertEnabled) {
          const reasonNotice = isAfter18 ? 'após as 18 horas.' : `com atraso de ${diffMinutes} minutos.`;
          setTimeout(() => {
            speechController.speak(
              `Atenção Direção: Entrada registrada na portaria para ${employee.name}, ${reasonNotice}`
            );
          }, 800);
        }

        setNotifications((prev) => [lateNotification!, ...prev]);
        setActiveLateAlertModal(lateNotification);

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('🚨 Alerta de Atraso - PortaPonto 360', {
              body: `${employee.name} (${employee.department}) acabou de registrar entrada às ${timeFormatted} com ${diffMinutes} min de atraso!`,
              icon: employee.photoUrl,
            });
          }
        }
      }

      setTimeRecords((prev) => [newRecord, ...prev]);
      setLastRegisteredRecord(newRecord);

      try {
        await setDoc(doc(db, 'time_records', newRecord.id), newRecord);
      } catch (cloudErr) {
        console.warn('Failed to save punch record to cloud:', cloudErr);
      }

      // Prompt delay reason modal in the portaria immediately as soon as employee arrives late
      if (isLate && type === 'ENTRADA') {
        setPendingReasonRecord(newRecord);
      }

      if (channel) {
        channel.postMessage({ type: 'NEW_RECORD', payload: newRecord });
        if (lateNotification) {
          channel.postMessage({ type: 'LATE_ALERT', payload: lateNotification });
        }
      }

      return newRecord;
    },
    [
      employees,
      simulatedTime,
      soundEffectsEnabled,
      voiceConfirmationEnabled,
      directionVoiceAlertEnabled,
      channel,
    ]
  );

  const undoPunch = useCallback(
    async (recordId: string) => {
      setTimeRecords((prev) => prev.filter((r) => r.id !== recordId));
      setNotifications((prev) => prev.filter((n) => n.recordId !== recordId));

      try {
        await deleteDoc(doc(db, 'time_records', recordId));
      } catch (cloudErr) {
        console.warn('Failed to delete punch record from cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({ type: 'DELETE_RECORD', payload: recordId });
      }
    },
    [channel]
  );

  const clearAllRecords = useCallback(async () => {
    setTimeRecords([]);
    setLastRegisteredRecord(null);
    setPendingReasonRecord(null);
    setNotifications([]);
    setActiveLateAlertModal(null);
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.removeItem('portaponto_records_v3');
      localStorage.removeItem('portaponto_notifications_v3');
    } catch (e) {
      console.error('Failed to clear records from localStorage', e);
    }

    try {
      const snap = await getDocs(collection(db, 'time_records'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (cloudErr) {
      console.warn('Failed to clear records in cloud:', cloudErr);
    }

    if (channel) {
      channel.postMessage({ type: 'CLEAR_RECORDS' });
    }
  }, [channel]);

  const addAnnouncement = useCallback(
    async (data: Omit<Announcement, 'id' | 'createdAt' | 'timeFormatted' | 'dateFormatted' | 'readCount'>) => {
      const now = new Date();
      const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      const newAnn: Announcement = {
        ...data,
        id: `ann-${Date.now()}`,
        createdAt: now.toISOString(),
        timeFormatted,
        dateFormatted,
        readCount: 1,
      };

      setAnnouncements((prev) => [newAnn, ...prev]);

      try {
        await setDoc(doc(db, 'announcements', newAnn.id), newAnn);
      } catch (cloudErr) {
        console.warn('Failed to save announcement in cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({ type: 'NEW_ANNOUNCEMENT', payload: newAnn });
      }
    },
    [channel]
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));

      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (cloudErr) {
        console.warn('Failed to delete announcement in cloud:', cloudErr);
      }

      if (channel) {
        channel.postMessage({ type: 'DELETE_ANNOUNCEMENT', payload: id });
      }
    },
    [channel]
  );

  const speakText = useCallback((text: string, withChime: boolean = false) => {
    speechController.speak(text, withChime);
  }, []);

  const stopSpeech = useCallback(() => {
    speechController.stop();
  }, []);

  const pauseSpeech = useCallback(() => {
    speechController.pause();
  }, []);

  const resumeSpeech = useCallback(() => {
    speechController.resume();
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    speechController.setRate(rate);
  }, []);

  const value = {
    isCloudSynced,
    employees,
    timeRecords,
    announcements,
    notifications,
    dayOffRecords,
    unreadNotificationsCount,
    activeLateAlertModal,
    dismissLateAlertModal,
    acknowledgeNotification,
    clearAllNotifications,
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    speechState,
    speakText,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    setSpeechRate,
    voiceConfirmationEnabled,
    setVoiceConfirmationEnabled,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    directionVoiceAlertEnabled,
    setDirectionVoiceAlertEnabled,
    lastRegisteredRecord,
    pendingReasonRecord,
    setPendingReasonRecord,
    registerDelayReason,
    registerPunch,
    undoPunch,
    clearAllRecords,
    addAnnouncement,
    deleteAnnouncement,
    addEmployee,
    removeEmployee,
    updateEmployee,
    updateEmployeePhoto,
    registerDayOff,
    cancelDayOff,
    adjustEmployeeDaysOff,
    currentTimeString,
    currentDateString,
    simulatedTime,
    setSimulatedTime,
    stats,
    getEmployeeTodayStatus,
    companySettings,
    updateCompanySettings,
    resetCompanySettings,
    isCompanyModalOpen,
    setIsCompanyModalOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
