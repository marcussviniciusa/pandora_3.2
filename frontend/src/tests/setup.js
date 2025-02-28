import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { handlers } from '../mocks/api/handlers';

// Estende os matchers do Jest com os do RTL
expect.extend(matchers);

// Configuração do MSW para os testes
export const server = setupServer(...handlers);

// Inicia o servidor antes dos testes
beforeAll(() => server.listen());

// Reseta quaisquer handlers que possam ter sido adicionados durante os testes
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Fecha o servidor após os testes
afterAll(() => server.close());

// Mock global para fetch
global.fetch = vi.fn();

// Mock para IntersectionObserver que não está disponível no ambiente de teste
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
    this.entries = [];
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    this.unobserve = vi.fn();
  }

  simulate(entries) {
    this.callback(entries, this);
  }
}

global.IntersectionObserver = IntersectionObserverMock;

// Mock para window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock para console.error para evitar poluição nos logs de teste
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filtra mensagens específicas que podem ser ignoradas durante os testes
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Warning: ReactDOM.render') || 
     args[0].includes('Warning: React.createFactory') ||
     args[0].includes('Warning: ReactDOM.createPortal'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
