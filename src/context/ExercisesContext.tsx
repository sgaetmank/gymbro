import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { fetchExercises, type Exercise } from '../services/exercisesApi';

// Guarda los ejercicios traídos de la API y los comparte con toda la app
type ExercisesContextValue = {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  getExerciseById: (id: string) => Exercise | undefined;
  retry: () => void;
};

const ExercisesContext = createContext<ExercisesContextValue>({
  exercises: [],
  loading: true,
  error: null,
  getExerciseById: () => undefined,
  retry: () => {},
});

export function ExercisesProvider({ children }: PropsWithChildren) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Cambiar este número vuelve a disparar la carga (botón "Reintentar")
  const [attempt, setAttempt] = useState(0);

  // Pide los ejercicios a la API al montar (y en cada reintento)
  useEffect(() => {
    let cancelled = false; // evita actualizar el estado si el componente se desmontó

    fetchExercises()
      .then((data) => {
        if (!cancelled) setExercises(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Índice id -> ejercicio para buscar al instante (son ~1300, find() en cada render sería lento)
  const exercisesById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises]
  );

  const getExerciseById = (exerciseId: string) => exercisesById.get(exerciseId);

  // Vuelve a mostrar "cargando" y dispara otra vez el useEffect de arriba
  const retry = () => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  };

  return (
    <ExercisesContext.Provider value={{ exercises, loading, error, getExerciseById, retry }}>
      {children}
    </ExercisesContext.Provider>
  );
}

// Acceso rápido: const { exercises, loading, error, getExerciseById, retry } = useExercises();
export function useExercises() {
  return useContext(ExercisesContext);
}
