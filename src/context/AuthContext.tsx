import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { addUser, users, type RegistrationData, type User } from '../data/users';

// Guarda al usuario logueado y ofrece login/register/logout a toda la app
type AuthResult = { ok: boolean; error?: string };
type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => AuthResult;
  register: (data: RegistrationData) => AuthResult;
  logout: () => void;
};

// Crea un contexto para la autenticación, que contiene el usuario actual y funciones de login/register/logout.
const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => ({ ok: false, error: '' }),
  register: () => ({ ok: false, error: '' }),
  logout: () => {},
});

// Proveedor de autenticación que envuelve la aplicación y proporciona el contexto de autenticación a sus hijos.

export function AuthProvider({ children }: PropsWithChildren) {
  // Usuario de la sesión actual (null = nadie logueado)
  const [user, setUser] = useState<User | null>(null);

  // Valida email + contraseña contra users.ts.
  // Con un backend real, solo habría que cambiar el cuerpo de esta función.
  const login = (email: string, password: string): AuthResult => {
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (!found) return { ok: false, error: 'Email o contraseña incorrectos' };

    setUser(found);
    return { ok: true };
  };

  // Crea un alumno nuevo en users.ts y lo deja logueado.
  // Valida que el email y el DNI no estén ya registrados.
  // Con un backend real, solo habría que cambiar el cuerpo de esta función.
  const register = (data: RegistrationData): AuthResult => {
    const email = data.email.trim().toLowerCase();
    const dni = data.dni.trim();

    if (users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Ya existe una cuenta con ese email' };
    }
    if (users.some((u) => u.dni === dni)) {
      return { ok: false, error: 'Ya existe una cuenta con ese DNI' };
    }

    setUser(addUser(data));
    return { ok: true };
  };

  // Cierra la sesión; el navegador vuelve solo al login
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Acceso rápido: const { user, login, register, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
