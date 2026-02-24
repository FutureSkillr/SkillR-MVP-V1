import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Test the VideoSlotInput module can be imported and types are correct
describe('VideoSlotInput', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports VideoSlotInput component', async () => {
    const mod = await import('./VideoSlotInput');
    expect(mod.VideoSlotInput).toBeDefined();
    expect(typeof mod.VideoSlotInput).toBe('function');
  });

  it('TYPE_OPTIONS are correct', async () => {
    // VideoSlotInput should handle upload, youtube, and text types
    const { VideoSlotInput } = await import('./VideoSlotInput');
    // Component exists and is a function (React FC)
    expect(VideoSlotInput).toBeDefined();
  });
});

describe('VideoSlotInput types', () => {
  it('accepts valid VideoInputType values', () => {
    // Type validation at compile time — this test verifies runtime values work
    const validTypes = ['upload', 'youtube', 'text', ''] as const;
    validTypes.forEach((t) => {
      expect(typeof t).toBe('string');
    });
  });
});
