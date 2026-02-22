import type { VucaModule, VucaProgress, VucaStationState } from '../types/vuca';
import { isVucaComplete } from '../types/vuca';

export function completeModule(
  state: VucaStationState,
  moduleId: string
): VucaStationState {
  if (!state.curriculum) return state;

  const modules = state.curriculum.modules.map((m) =>
    m.id === moduleId ? { ...m, completed: true } : m
  );

  const progress = calculateProgress(modules);
  const complete = isVucaComplete(progress);

  return {
    ...state,
    curriculum: { ...state.curriculum, modules },
    progress,
    activeModuleId: null,
    activeCourse: null,
    view: complete ? 'complete' : 'dashboard',
  };
}

export function calculateProgress(modules: VucaModule[]): VucaProgress {
  const progress: VucaProgress = { V: 0, U: 0, C: 0, A: 0 };

  for (const cat of ['V', 'U', 'C', 'A'] as const) {
    const catModules = modules.filter((m) => m.category === cat);
    const completedCount = catModules.filter((m) => m.completed).length;
    const total = catModules.length || 1;
    progress[cat] = Math.round((completedCount / total) * 100);
  }

  return progress;
}

export function getModuleById(
  state: VucaStationState,
  moduleId: string
): VucaModule | undefined {
  return state.curriculum?.modules.find((m) => m.id === moduleId);
}
