import { describe, it, expect } from 'vitest';
import {
  completeModule,
  calculateProgress,
  getModuleById,
  getGegensatzSuggestion,
  getOppositeDimension,
} from './vuca';
import type { VucaModule, VucaStationState } from '../types/vuca';
import { createInitialVucaState } from '../types/vuca';

function makeModules(): VucaModule[] {
  return [
    { id: 'v1', title: 'V-Modul 1', description: '', category: 'V', order: 1, completed: false },
    { id: 'v2', title: 'V-Modul 2', description: '', category: 'V', order: 2, completed: false },
    { id: 'u1', title: 'U-Modul 1', description: '', category: 'U', order: 3, completed: false },
    { id: 'u2', title: 'U-Modul 2', description: '', category: 'U', order: 4, completed: false },
    { id: 'c1', title: 'C-Modul 1', description: '', category: 'C', order: 5, completed: false },
    { id: 'c2', title: 'C-Modul 2', description: '', category: 'C', order: 6, completed: false },
    { id: 'a1', title: 'A-Modul 1', description: '', category: 'A', order: 7, completed: false },
    { id: 'a2', title: 'A-Modul 2', description: '', category: 'A', order: 8, completed: false },
  ];
}

function makeState(overrides?: Partial<VucaStationState>): VucaStationState {
  return {
    ...createInitialVucaState(),
    curriculum: { goal: 'Testberuf', modules: makeModules() },
    ...overrides,
  };
}

describe('calculateProgress', () => {
  it('returns 0 for all dimensions when nothing is completed', () => {
    const progress = calculateProgress(makeModules());
    expect(progress).toEqual({ V: 0, U: 0, C: 0, A: 0 });
  });

  it('returns 50 when half of a category is done', () => {
    const modules = makeModules();
    modules[0].completed = true; // v1
    const progress = calculateProgress(modules);
    expect(progress.V).toBe(50);
    expect(progress.U).toBe(0);
  });

  it('returns 100 when all modules in a category are done', () => {
    const modules = makeModules();
    modules[0].completed = true; // v1
    modules[1].completed = true; // v2
    const progress = calculateProgress(modules);
    expect(progress.V).toBe(100);
  });
});

describe('completeModule', () => {
  it('marks a module as completed', () => {
    const state = makeState();
    const newState = completeModule(state, 'v1');
    const mod = newState.curriculum!.modules.find((m) => m.id === 'v1');
    expect(mod?.completed).toBe(true);
  });

  it('clears activeModuleId and activeCourse', () => {
    const state = makeState({ activeModuleId: 'v1', activeCourse: { moduleId: 'v1', title: 'test', sections: [], quiz: [] } });
    const newState = completeModule(state, 'v1');
    expect(newState.activeModuleId).toBeNull();
    expect(newState.activeCourse).toBeNull();
  });

  it('returns to dashboard if not all dimensions complete', () => {
    const state = makeState();
    const newState = completeModule(state, 'v1');
    expect(newState.view).toBe('dashboard');
  });

  it('returns unchanged state when curriculum is null', () => {
    const state = { ...createInitialVucaState(), curriculum: null };
    const newState = completeModule(state, 'v1');
    expect(newState).toBe(state);
  });
});

describe('getModuleById', () => {
  it('finds a module by id', () => {
    const state = makeState();
    const mod = getModuleById(state, 'u1');
    expect(mod?.title).toBe('U-Modul 1');
  });

  it('returns undefined for unknown id', () => {
    const state = makeState();
    expect(getModuleById(state, 'unknown')).toBeUndefined();
  });

  it('returns undefined when curriculum is null', () => {
    const state = { ...createInitialVucaState(), curriculum: null };
    expect(getModuleById(state, 'v1')).toBeUndefined();
  });
});

describe('getGegensatzSuggestion', () => {
  it('suggests opposite dimension module after V completion', () => {
    const modules = makeModules();
    modules[0].completed = true; // v1 done
    const suggestion = getGegensatzSuggestion(modules, 'v1');
    expect(suggestion).not.toBeNull();
    expect(suggestion!.category).toBe('A'); // opposite of V
  });

  it('suggests opposite dimension module after U completion', () => {
    const modules = makeModules();
    modules[2].completed = true; // u1 done
    const suggestion = getGegensatzSuggestion(modules, 'u1');
    expect(suggestion).not.toBeNull();
    expect(suggestion!.category).toBe('C'); // opposite of U
  });

  it('suggests opposite dimension module after C completion', () => {
    const modules = makeModules();
    modules[4].completed = true; // c1 done
    const suggestion = getGegensatzSuggestion(modules, 'c1');
    expect(suggestion).not.toBeNull();
    expect(suggestion!.category).toBe('U'); // opposite of C
  });

  it('suggests opposite dimension module after A completion', () => {
    const modules = makeModules();
    modules[6].completed = true; // a1 done
    const suggestion = getGegensatzSuggestion(modules, 'a1');
    expect(suggestion).not.toBeNull();
    expect(suggestion!.category).toBe('V'); // opposite of A
  });

  it('returns null when no opposite modules are available', () => {
    const modules = makeModules();
    modules[0].completed = true; // v1 done
    modules[6].completed = true; // a1 done (opposite of V)
    modules[7].completed = true; // a2 done (all A done)
    const suggestion = getGegensatzSuggestion(modules, 'v1');
    expect(suggestion).toBeNull();
  });

  it('returns null when lastCompletedModuleId is null', () => {
    expect(getGegensatzSuggestion(makeModules(), null)).toBeNull();
  });

  it('returns null for unknown module id', () => {
    expect(getGegensatzSuggestion(makeModules(), 'unknown')).toBeNull();
  });
});

describe('getOppositeDimension', () => {
  it('maps V to A', () => expect(getOppositeDimension('V')).toBe('A'));
  it('maps A to V', () => expect(getOppositeDimension('A')).toBe('V'));
  it('maps U to C', () => expect(getOppositeDimension('U')).toBe('C'));
  it('maps C to U', () => expect(getOppositeDimension('C')).toBe('U'));
  it('returns null for unknown', () => expect(getOppositeDimension('X')).toBeNull());
});
