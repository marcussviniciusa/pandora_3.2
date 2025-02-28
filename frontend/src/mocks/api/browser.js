/**
 * Setup for Mock Service Worker (MSW) in browser environment
 */
import { setupWorker } from 'msw';
import { handlers } from './handlers';

// Setup MSW worker with our request handlers
export const worker = setupWorker(...handlers);
