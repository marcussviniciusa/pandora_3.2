/**
 * Mock API exports
 */
export { handlers } from './handlers';
export { worker } from './browser';

/**
 * Initialize MSW for development environment
 */
export const initMocks = async () => {
  if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
    // Start the service worker
    const { worker } = await import('./browser');
    return worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
  }
  
  return Promise.resolve();
};
