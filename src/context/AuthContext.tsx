import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  ApiError,
  getMe,
  login as apiLogin,
  register as apiRegister,
  setAuthToken,
  setUnauthorizedHandler,
} from '../services/api';
import { clearToken, loadToken, saveToken } from '../services/session';
import type { RegistrationData, User } from '../types';

// Guarda al usuario logueado y ofrece login/register/logout a toda la app
type AuthResult = { ok: boolean; error?: string };
type AuthContextValue = {
  user: User | null;
  loading: boolean; // true mientras se recupera la sesión guardada al abrir la app
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegistrationData) => Promise<AuthResult>;
  logout: () => void;
};

// Crea un contexto para la autenticación, que contiene el usuario actual y funciones de login/register/logout.
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ ok: false, error: '' }),
  register: async () => ({ ok: false, error: '' }),
  logout: () => {},
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

// Proveedor de autenticación que envuelve la aplicación y proporciona el contexto de autenticación a sus hijos.

export function AuthProvider({ children }: PropsWithChildren) {
  // Usuario de la sesión actual (null = nadie logueado)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cierra la sesión: olvida el token y vuelve al login (AppNavigator cambia solo).
  const logout = useCallback(() => {
    setAuthToken(null);
    clearToken();
    setUser(null);
  }, []);

  // Si el servidor responde 401 con una sesión abierta (token vencido), se cierra sola.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Al abrir la app: si quedó un token guardado, se pide el perfil para restaurar la sesión.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const token = await loadToken();
        if (!token) return;
        setAuthToken(token);
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch (error) {
        setAuthToken(null);
        // Token vencido o inválido: se descarta. Si solo falló la red, se conserva para el próximo intento.
        if (error instanceof ApiError && error.status === 401) await clearToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pide al servidor validar email + contraseña. Guarda el token y deja la sesión abierta.
  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await apiLogin(email.trim(), password);
      setAuthToken(result.token);
      await saveToken(result.token);
      setUser(result.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error, 'No se pudo iniciar sesión') };
    }
  };

  // Crea un alumno nuevo en el servidor (que valida email y DNI repetidos) y lo deja logueado.
  const register = async (data: RegistrationData): Promise<AuthResult> => {
    try {
      const result = await apiRegister(data);
      setAuthToken(result.token);
      await saveToken(result.token);
      setUser(result.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error, 'No se pudo crear la cuenta') };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Acceso rápido: const { user, loading, login, register, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
