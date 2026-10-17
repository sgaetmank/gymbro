import type { RoutineDay, RoutineItem } from '../data/routines';

// Un paso del entrenamiento guiado: un ejercicio o un descanso, más el bloque
// al que pertenece (el nombre "Bloque N" no se guarda: se calcula por posición).
export type WorkoutStep = {
  item: RoutineItem;
  blockIndex: number;
};

// Aplana bloques → items en el orden en que se hacen.
export function buildSteps(day: RoutineDay): WorkoutStep[] {
  return day.blocks.flatMap((block, blockIndex) =>
    block.items.map((item) => ({ item, blockIndex }))
  );
}


/*
Día { bloques: [ {items:[ej, descanso]}, {items:[ej]} ] }

   →  [ {item: ej,       blockIndex: 0},
        {item: descanso, blockIndex: 0},
        {item: ej,       blockIndex: 1} ]

*/
