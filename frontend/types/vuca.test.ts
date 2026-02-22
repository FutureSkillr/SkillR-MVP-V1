import { describe, it, expect } from 'vitest';
import { createInitialVucaState, isVucaComplete, VUCA_THRESHOLD } from './vuca';

describe('createInitialVucaState', () => {
  it('returns the correct initial state', () => {
    const state = createInitialVucaState();
    expect(state.view).toBe('onboarding');
    expect(state.goal).toBeNull();
    expect(state.curriculum).toBeNull();
    expect(state.progress).toEqual({ V: 0, U: 0, C: 0, A: 0 });
    expect(state.activeModuleId).toBeNull();
    expect(state.activeCourse).toBeNull();
  });
});

describe('isVucaComplete', () => {
  it('returns false when all scores are 0', () => {
    expect(isVucaComplete({ V: 0, U: 0, C: 0, A: 0 })).toBe(false);
  });

  it('returns false when some scores are below threshold', () => {
    expect(isVucaComplete({ V: 100, U: 100, C: 100, A: VUCA_THRESHOLD - 1 })).toBe(false);
  });

  it('returns true when all scores meet threshold', () => {
    expect(isVucaComplete({ V: VUCA_THRESHOLD, U: VUCA_THRESHOLD, C: VUCA_THRESHOLD, A: VUCA_THRESHOLD })).toBe(true);
  });

  it('returns true when all scores exceed threshold', () => {
    expect(isVucaComplete({ V: 100, U: 100, C: 100, A: 100 })).toBe(true);
  });

  it('returns false when only one dimension meets threshold', () => {
    expect(isVucaComplete({ V: VUCA_THRESHOLD, U: 0, C: 0, A: 0 })).toBe(false);
  });
});

describe('VUCA_THRESHOLD', () => {
  it('is 25', () => {
    expect(VUCA_THRESHOLD).toBe(25);
  });
});
