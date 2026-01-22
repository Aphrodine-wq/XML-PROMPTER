import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock window object properties
Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    api: {
      readTemplates: async () => [],
      saveTemplates: async () => true,
      readHistory: async () => [],
      saveHistory: async () => true,
      saveFileDialog: async () => true,
    }
  },
  writable: true
});
