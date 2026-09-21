import { createContext, useContext, useState } from 'react';

import { users } from '../data/users';

// Guarda al usuario logueado y ofrece login/logout a toda la app
/**
 * @type {import('react').Context<{
 *   user: any,
 *   login: (email: string, password: string) => { ok: boolean, error?: string },
 *   logout: () => void,
 * }>}
 */

// Crea un contexto para la autenticación, que contiene el usuario actual y funciones de login/logout.
const AuthContext = createContext({
  user: null,
  login: () => ({ ok: false, error: '' }),
  logout: () => {},
});

// Proveedor de autenticación que envuelve la aplicación y proporciona el contexto de autenticación a sus hijos.

export function AuthProvider({ children }) {
  // Usuario de la sesión actual (null = nadie logueado)
  const [user, setUser] = useState(null);

  // Valida email + contraseña contra users.js.
  // Con un backend real, solo habría que cambiar el cuerpo de esta función.
  const login = (email, password) => {
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (!found) return { ok: false, error: 'Email o contraseña incorrectos' };

    setUser(found);
    return { ok: true };
  };

  // Cierra la sesión; el navegador vuelve solo al login
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Acceso rápido: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
