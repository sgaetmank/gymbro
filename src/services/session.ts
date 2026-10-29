// Guarda el token de la sesión en el almacenamiento seguro del teléfono

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'gymbro_token';

export async function loadToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento seguro: la sesión dura hasta cerrar la app.
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nada que borrar.
  }
}
