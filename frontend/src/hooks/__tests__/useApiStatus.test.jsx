import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { useApiStatus } from '../useApiStatus';
import { AllProvidersWrapper } from '../../tests/mockContexts';

describe('useApiStatus Hook', () => {
  let mock;

  beforeEach(() => {
    // Cria um mock do axios
    mock = new MockAdapter(axios);
    // Configurar o mock
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Limpa o mock após cada teste
    mock.reset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('deve retornar o estado inicial corretamente', async () => {
    let hookResult;
    
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ checkOnLoad: false }), {
        wrapper: AllProvidersWrapper
      });
    });

    const { result } = hookResult;
    expect(result.current.status).toBe('checking');
    expect(result.current.latency).toBeNull();
    expect(result.current.lastChecked).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.checkApiStatus).toBe('function');
  });

  it('deve atualizar o status para online após verificação bem-sucedida', async () => {
    // Mock da simulação de tempo - resposta rápida
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1050);
    
    // Mock da resposta da API
    mock.onGet('http://localhost:3000/api/dashboard/status').reply(200, { status: 'ok' });

    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ checkOnLoad: false }), {
        wrapper: AllProvidersWrapper
      });
    });

    await act(async () => {
      await hookResult.result.current.checkApiStatus();
    });

    expect(hookResult.result.current.status).toBe('online');
    expect(hookResult.result.current.latency).toBeGreaterThanOrEqual(0);
    expect(hookResult.result.current.lastChecked).toBeInstanceOf(Date);
    expect(hookResult.result.current.error).toBeNull();
  });

  it('deve atualizar o status para degraded quando a latência é alta', async () => {
    // Mock da simulação de tempo - latência alta
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1350);
    
    // Mock da resposta da API
    mock.onGet('http://localhost:3000/api/dashboard/status').reply(200, { status: 'ok' });

    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ checkOnLoad: false }), {
        wrapper: AllProvidersWrapper
      });
    });

    await act(async () => {
      await hookResult.result.current.checkApiStatus();
    });

    expect(hookResult.result.current.status).toBe('degraded');
    expect(hookResult.result.current.latency).toBeGreaterThanOrEqual(300);
    expect(hookResult.result.current.lastChecked).toBeInstanceOf(Date);
    expect(hookResult.result.current.error).toBeNull();
  });

  it('deve atualizar o status para offline quando a verificação falha', async () => {
    // Mock da resposta da API - erro de servidor
    mock.onGet('http://localhost:3000/api/dashboard/status').reply(500);

    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ checkOnLoad: false }), {
        wrapper: AllProvidersWrapper
      });
    });

    await act(async () => {
      try {
        await hookResult.result.current.checkApiStatus();
      } catch (e) {
        // Ignoramos o erro aqui, pois o hook deve tratar isso
      }
    });

    expect(hookResult.result.current.status).toBe('offline');
    expect(hookResult.result.current.latency).toBeNull();
    expect(hookResult.result.current.lastChecked).toBeInstanceOf(Date);
    expect(hookResult.result.current.error).toBeInstanceOf(Error);
  });

  it('deve atualizar o status para offline quando a verificação falha com timeout', async () => {
    // Mock da resposta da API - timeout
    mock.onGet('http://localhost:3000/api/dashboard/status').timeout();

    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ checkOnLoad: false }), {
        wrapper: AllProvidersWrapper
      });
    });

    await act(async () => {
      try {
        await hookResult.result.current.checkApiStatus();
      } catch (e) {
        // Ignoramos o erro aqui, pois o hook deve tratar isso
      }
    });

    expect(hookResult.result.current.status).toBe('offline');
    expect(hookResult.result.current.latency).toBeNull();
    expect(hookResult.result.current.lastChecked).toBeInstanceOf(Date);
    expect(hookResult.result.current.error).toBeInstanceOf(Error);
  });

  it('deve atualizar o status para offline quando a verificação falha com erro de rede', async () => {
    // Mock da resposta da API - erro de rede
    mock.onGet('http://localhost:3000/api/dashboard/status').networkError();

    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ checkOnLoad: false }), {
        wrapper: AllProvidersWrapper
      });
    });

    await act(async () => {
      try {
        await hookResult.result.current.checkApiStatus();
      } catch (e) {
        // Ignoramos o erro aqui, pois o hook deve tratar isso
      }
    });

    expect(hookResult.result.current.status).toBe('offline');
    expect(hookResult.result.current.latency).toBeNull();
    expect(hookResult.result.current.lastChecked).toBeInstanceOf(Date);
    expect(hookResult.result.current.error).toBeInstanceOf(Error);
  });

  it('deve verificar o status da API no carregamento do hook', async () => {
    // Mock da simulação de tempo - resposta rápida
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1050);
    
    // Mock da resposta da API
    mock.onGet('http://localhost:3000/api/dashboard/status').reply(200, { status: 'ok' });
    
    // Renderiza o hook com checkOnLoad = true (padrão)
    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus(), {
        wrapper: AllProvidersWrapper
      });
      
      // Esperar que todos os efeitos sejam executados
      await vi.runAllTimersAsync();
    });
    
    expect(hookResult.result.current.status).toBe('online');
    expect(hookResult.result.current.latency).toBeGreaterThanOrEqual(0);
    expect(hookResult.result.current.lastChecked).toBeInstanceOf(Date);
    expect(hookResult.result.current.error).toBeNull();
  });

  it('não deve verificar o status da API no carregamento quando checkOnLoad é false', async () => {
    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ checkOnLoad: false }), {
        wrapper: AllProvidersWrapper
      });
    });

    expect(hookResult.result.current.status).toBe('checking');
    expect(hookResult.result.current.latency).toBeNull();
    expect(hookResult.result.current.lastChecked).toBeNull();
    expect(hookResult.result.current.error).toBeNull();
  });

  it('deve verificar o status da API periodicamente quando intervalo é definido', async () => {
    // Mock da resposta da API
    mock.onGet('http://localhost:3000/api/dashboard/status').reply(200, { status: 'ok' });
    
    let hookResult;
    await act(async () => {
      hookResult = renderHook(() => useApiStatus({ 
        checkOnLoad: false,
        checkInterval: 1000 
      }), {
        wrapper: AllProvidersWrapper
      });
    });
    
    // Verificar o estado inicial
    expect(hookResult.result.current.status).toBe('checking');
    
    // Limpar o histórico de chamadas
    mock.resetHistory();
    
    // Avançar o tempo para acionar o intervalo
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    
    // Verificar se houve uma chamada de API
    expect(mock.history.get.length).toBeGreaterThan(0);
  });
});
