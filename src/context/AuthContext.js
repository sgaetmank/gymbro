import { createContext, useContext, useState } from 'react';

import { addUser, users } from '../data/users';

// Guarda al usuario logueado y ofrece login/register/logout a toda la app
/**
 * @type {import('react').Context<{
 *   user: any,
 *   login: (email: string, password: string) => { ok: boolean, error?: string },
 *   register: (data: object) => { ok: boolean, error?: string },
 *   logout: () => void,
 * }>}
 */

// Crea un contexto para la autenticación, que contiene el usuario actual y funciones de login/register/logout.
const AuthContext = createContext({
  user: null,
  login: () => ({ ok: false, error: '' }),
  register: () => ({ ok: false, error: '' }),
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

  // Crea un alumno nuevo en users.js y lo deja logueado.
  // Valida que el email y el DNI no estén ya registrados.
  // Con un backend real, solo habría que cambiar el cuerpo de esta función.
  const register = (data) => {
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
