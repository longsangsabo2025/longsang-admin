import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Extend Vitest's expect method with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
import.meta.env.VITE_SUPABASE_URL = 'http://localhost:54321';
import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-key';
import.meta.env.DEV = true;
