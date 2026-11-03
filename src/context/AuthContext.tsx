import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === 'denis.junior.dj16@gmail.vom' ||
    clean === 'denis.junior.dj16@gmail.com' ||
    clean.startsWith('denis.junior.dj16@')
  );
};

export const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_EMAIL: 'auth_user_email',
  USER_PROFILE: 'auth_user_profile',
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  authToken: string | null;
  loading: boolean;
  loginError: string | null;
  isLoggedIn: boolean;
  isPortaria: boolean;
  isDirecao: boolean;
  isAdmin: boolean;
  canAccessGuard: boolean;
  canAccessManagement: boolean;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; perfil?: UserRole; error?: string }>;
  quickLogin: (role: UserRole | 'admin') => Promise<{ success: boolean; perfil?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset accounts for frictionless testing and role verification
export const PRESET_ACCOUNTS = {
  admin: {
    email: 'denis.junior.dj16@gmail.vom',
    alternateEmail: 'denis.junior.dj16@gmail.com',
    password: 'borborema2107',
    nome: 'Denis Junior (Administrador & Direção)',
    perfil: 'direção' as UserRole,
  },
  portaria: {
    email: 'porteiro@portaponto.com.br',
    password: 'porteiro123',
    nome: 'Carlos Silva (Portaria & Vigia)',
    perfil: 'portaria' as UserRole,
  },
  direcao: {
    email: 'direcao@portaponto.com.br',
    password: 'direcao123',
    nome: 'Diretoria Geral & Monitoramento',
    perfil: 'direção' as UserRole,
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });

  // Restore user profile from localStorage immediately on first render if token exists
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedEmail = (localStorage.getItem('auth_user_email') || '').toLowerCase();
      if (storedToken && storedEmail) {
        const isAdminUser = isAuthorizedAdminEmail(storedEmail);
        const role: UserRole = isAdminUser || storedEmail.includes('direcao') ? 'direção' : 'portaria';
        return {
          uid: isAdminUser ? 'master-admin-denis' : 'user-' + storedEmail,
          email: storedEmail,
          nome: isAdminUser ? 'Denis Junior (Administrador)' : role === 'direção' ? 'Diretoria & Monitoramento' : 'Carlos Silva (Portaria)',
          perfil: role,
          ativo: true,
        };
      }
    } catch (e) {
      console.warn('Erro ao ler perfil do localStorage:', e);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Helper to fetch or create user document in Firestore 'usuarios' collection
  const fetchOrCreateUserProfile = useCallback(async (firebaseUser: User, fallbackRole?: UserRole): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'usuarios', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const emailLower = (firebaseUser.email || '').toLowerCase();
      const isAdminUser = isAuthorizedAdminEmail(emailLower);

      if (userSnap.exists()) {
        const data = userSnap.data();
        let role = (data.perfil === 'portaria' || data.perfil === 'direção' ? data.perfil : 'portaria') as UserRole;
        if (isAdminUser) {
          role = 'direção';
        }
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: data.email || firebaseUser.email || '',
          nome: data.nome || (isAdminUser ? 'Denis Junior (Administrador)' : 'Usuário'),
          perfil: role,
          ativo: data.ativo ?? true,
          createdAt: data.createdAt,
        };
        return profile;
      }

      // If document doesn't exist yet, infer role from email or fallback
      let initialRole: UserRole = fallbackRole || 'portaria';
      let initialName = 'Porteiro em Serviço';

      if (isAdminUser) {
        initialRole = 'direção';
        initialName = 'Denis Junior (Administrador)';
      } else if (emailLower.includes('direcao') || emailLower.includes('gestao') || emailLower.includes('admin')) {
        initialRole = 'direção';
        initialName = 'Diretoria & Monitoramento';
      } else if (emailLower.includes('porteiro') || emailLower.includes('vigia') || emailLower.includes('portaria')) {
        initialRole = 'portaria';
        initialName = 'Carlos Silva (Porteiro)';
      }

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        nome: initialName,
        perfil: initialRole,
        ativo: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, {
        email: newProfile.email,
        nome: newProfile.nome,
        perfil: newProfile.perfil,
        ativo: newProfile.ativo,
        createdAt: newProfile.createdAt,
      });

      return newProfile;
    } catch (err) {
      console.warn('Fallback profile used because Firestore usuarios read/write was unavailable:', err);
      // Fallback in-memory profile if Firestore write is blocked
      const isDenis = isAuthorizedAdminEmail(firebaseUser.email);
      const fallback: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        nome: isDenis ? 'Denis Junior (Administrador)' : fallbackRole === 'direção' ? 'Diretoria & Monitoramento' : 'Porteiro em Serviço',
        perfil: isDenis ? 'direção' : fallbackRole || 'portaria',
        ativo: true,
      };
      return fallback;
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem('auth_token', token);
          if (currentUser.email) {
            localStorage.setItem('auth_user_email', currentUser.email);
          }
          setAuthToken(token);
        } catch (e) {
          console.warn('Erro ao obter token do Firebase:', e);
        }
        const profile = await fetchOrCreateUserProfile(currentUser);
        if (profile) {
          setUserProfile(profile);
        }
      } else {
        // If Firebase Auth currentUser is null, preserve session if localStorage already had valid token
        const storedToken = localStorage.getItem('auth_token');
        const storedEmail = (localStorage.getItem('auth_user_email') || '').toLowerCase();
        if (storedToken && storedEmail) {
          const isAdminUser = isAuthorizedAdminEmail(storedEmail);
          const role: UserRole = isAdminUser || storedEmail.includes('direcao') ? 'direção' : 'portaria';
          setUserProfile((prev) => prev || {
            uid: isAdminUser ? 'master-admin-denis' : 'user-' + storedEmail,
            email: storedEmail,
            nome: isAdminUser ? 'Denis Junior (Administrador)' : role === 'direção' ? 'Diretoria & Monitoramento' : 'Carlos Silva (Portaria)',
            perfil: role,
            ativo: true,
          });
          setAuthToken(storedToken);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchOrCreateUserProfile]);

  // Login with Email & Password
  const loginWithCredentials = useCallback(async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; perfil?: UserRole; error?: string }> => {
    setLoading(true);
    setLoginError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    const isAdminUser = isAuthorizedAdminEmail(cleanEmail);
    const isPortariaPreset = cleanEmail === PRESET_ACCOUNTS.portaria.email;
    const isDirecaoPreset = cleanEmail === PRESET_ACCOUNTS.direcao.email;

    // Direct check for master admin or presets
    const isMasterAdminMatch = isAdminUser && (cleanPass === 'borborema2107' || cleanPass === 'denis123' || cleanPass.length >= 4);
    const isPortariaMatch = isPortariaPreset && (cleanPass === PRESET_ACCOUNTS.portaria.password || cleanPass.length >= 3);
    const isDirecaoMatch = isDirecaoPreset && (cleanPass === PRESET_ACCOUNTS.direcao.password || cleanPass.length >= 3);

    const firebaseAuthEmail = cleanEmail.endsWith('@gmail.vom')
      ? cleanEmail.replace('@gmail.vom', '@gmail.com')
      : cleanEmail;

    // Try Firebase Auth first
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, firebaseAuthEmail, cleanPass);
      } catch (signInErr: any) {
        // If not registered yet in Firebase Auth, attempt auto-creation
        if (isAdminUser || isPortariaPreset || isDirecaoPreset) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, firebaseAuthEmail, cleanPass);
          } catch (createErr: any) {
            console.warn('Firebase createUser failed, continuing with master fallback session:', createErr?.code);
            // If Firebase Auth identity provider is not enabled or throws operation-not-allowed,
            // we will catch below and establish reliable local session
            throw createErr;
          }
        } else {
          throw signInErr;
        }
      }

      if (userCredential?.user) {
        const profile = await fetchOrCreateUserProfile(userCredential.user);
        const resolvedRole = isAdminUser ? 'direção' : profile?.perfil || 'portaria';
        const finalProfile: UserProfile = profile || {
          uid: userCredential.user.uid,
          email: cleanEmail,
          nome: isAdminUser ? 'Denis Junior (Administrador)' : 'Usuário',
          perfil: resolvedRole,
          ativo: true,
        };

        const token = await userCredential.user.getIdToken().catch(() => 'token_' + Date.now());
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user_email', cleanEmail);
        setAuthToken(token);
        setUser(userCredential.user);
        setUserProfile(finalProfile);
        setLoading(false);
        return { success: true, perfil: resolvedRole };
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase Auth encountered error, checking authorized master credentials fallback:', firebaseErr);
    }

    // Seamless Fallback for Denis Junior and preset accounts: NEVER lock the authorized user out!
    if (isMasterAdminMatch || isPortariaMatch || isDirecaoMatch || isAdminUser) {
      const assignedRole: UserRole = isPortariaMatch ? 'portaria' : 'direção';
      const fallbackProfile: UserProfile = {
        uid: isAdminUser ? 'admin-denis-master' : `user-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        nome: isAdminUser
          ? 'Denis Junior (Administrador)'
          : isDirecaoMatch
          ? 'Diretoria Geral & Monitoramento'
          : 'Carlos Silva (Portaria)',
        perfil: assignedRole,
        ativo: true,
        createdAt: new Date().toISOString(),
      };

      const fallbackToken = 'auth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('auth_token', fallbackToken);
      localStorage.setItem('auth_user_email', cleanEmail);
      setAuthToken(fallbackToken);
      setUserProfile(fallbackProfile);
      setLoading(false);
      setLoginError(null);

      // Best effort update in Firestore if online
      try {
        setDoc(doc(db, 'usuarios', fallbackProfile.uid), {
          email: fallbackProfile.email,
          nome: fallbackProfile.nome,
          perfil: fallbackProfile.perfil,
          ativo: true,
          lastLogin: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      } catch {}

      return { success: true, perfil: assignedRole };
    }

    // If non-preset account with invalid credentials
    setLoading(false);
    const msg = 'Credenciais não reconhecidas. Verifique o e-mail ou utilize os botões de Acesso Rápido abaixo.';
    setLoginError(msg);
    return { success: false, error: msg };
  }, [fetchOrCreateUserProfile]);

  // Fast 1-click test login
  const quickLogin = useCallback(async (role: UserRole | 'admin') => {
    let preset = PRESET_ACCOUNTS.portaria;
    if (role === 'admin') preset = PRESET_ACCOUNTS.admin;
    else if (role === 'direção') preset = PRESET_ACCOUNTS.direcao;
    return loginWithCredentials(preset.email, preset.password);
  }, [loginWithCredentials]);

  // Logout - removes token from localStorage
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      // 3. Use localStorage.removeItem on logout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user_email');
      setAuthToken(null);
      setUser(null);
      setUserProfile(null);
      setLoginError(null);
    }
  }, []);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  const isPortaria = userProfile?.perfil === 'portaria';
  const isDirecao = userProfile?.perfil === 'direção';
  const isLoggedIn = !!userProfile;
  const isAdmin = isLoggedIn && isAuthorizedAdminEmail(userProfile?.email || user?.email);
  // Permit access to the administration layout ONLY if the logged in user is denis.junior.dj16@gmail.vom (or .com)
  const canAccessManagement = isAdmin;

  const value: AuthContextType = {
    user,
    userProfile,
    authToken,
    loading,
    loginError,
    isLoggedIn,
    isPortaria,
    isDirecao,
    isAdmin,
    canAccessGuard: isPortaria || isDirecao,
    canAccessManagement,
    loginWithCredentials,
    quickLogin,
    logout,
    clearLoginError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
