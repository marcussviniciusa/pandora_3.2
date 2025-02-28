import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccounts } from '../useAccounts';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { mockWhatsAppAccounts, mockInstagramAccounts } from '../../mocks/mockData';
import { server } from '../../tests/setup';
import { rest } from 'msw';
import React from 'react';

// Mock para o SocketContext
vi.mock('../../context/SocketContext', () => {
  return {
    useSocket: () => ({
      socket: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
      isConnected: true
    })
  };
});

// Mock axios
const mock = new MockAdapter(axios);

describe('useAccounts Hook', () => {
  beforeEach(() => {
    // Reset do mock
    mock.reset();
    
    // Stub do ambiente
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');
  });
  
  it('deve carregar contas com paginação', async () => {
    // Dados de teste
    const mockResponse = {
      data: [...mockWhatsAppAccounts, ...mockInstagramAccounts].slice(0, 2),
      pagination: {
        total: 4,
        page: 1,
        limit: 2,
        pages: 2,
      }
    };
    
    // Mock da resposta da API - usando RegExp para capturar qualquer parâmetro de consulta
    mock.onGet(new RegExp('http://localhost:3000/api/accounts.*')).reply(200, mockResponse);
    
    // Renderiza o hook
    const { result } = renderHook(() => useAccounts({ limit: 2 }));
    
    // Aguarda carregamento
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verifica resultado
    expect(result.current.accounts).toHaveLength(2);
    expect(result.current.pagination.total).toBe(4);
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.pagination.pages).toBe(2);
  });
  
  it('deve filtrar contas por plataforma', async () => {
    // Mock para contas do WhatsApp
    const mockWhatsAppResponse = {
      data: mockWhatsAppAccounts,
      pagination: {
        total: mockWhatsAppAccounts.length,
        page: 1,
        limit: 10,
        pages: 1,
      }
    };
    
    // Mock para contas do Instagram
    const mockInstagramResponse = {
      data: mockInstagramAccounts,
      pagination: {
        total: mockInstagramAccounts.length,
        page: 1,
        limit: 10,
        pages: 1,
      }
    };
    
    // Mock das respostas da API usando função que verifica os parâmetros
    mock.onGet(new RegExp('http://localhost:3000/api/accounts.*')).reply(config => {
      const url = config.url;
      
      if (url.includes('platform=whatsapp')) {
        return [200, mockWhatsAppResponse];
      } else if (url.includes('platform=instagram')) {
        return [200, mockInstagramResponse];
      }
      
      // Default response for other cases
      return [404, { error: 'Not found' }];
    });
    
    // Renderiza o hook para WhatsApp
    const { result: whatsappResult } = renderHook(() => useAccounts({ platform: 'whatsapp' }));
    
    // Aguarda carregamento do WhatsApp
    await waitFor(() => {
      expect(whatsappResult.current.loading).toBe(false);
    });
    
    // Verifica resultado do WhatsApp
    expect(whatsappResult.current.accounts.every(account => account.platform === 'whatsapp')).toBe(true);
    
    // Renderiza o hook para Instagram
    const { result: instagramResult } = renderHook(() => useAccounts({ platform: 'instagram' }));
    
    // Aguarda carregamento do Instagram
    await waitFor(() => {
      expect(instagramResult.current.loading).toBe(false);
    });
    
    // Verifica resultado do Instagram
    expect(instagramResult.current.accounts.every(account => account.platform === 'instagram')).toBe(true);
  });
  
  it('deve atualizar status da conta', async () => {
    // Mock inicial para a lista de contas
    const initialAccounts = {
      data: [
        { ...mockWhatsAppAccounts[0], status: 'connected' }
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      }
    };
    
    // Mock para a resposta da API de atualização
    const updatedAccount = { 
      ...mockWhatsAppAccounts[0], 
      status: 'disconnected' 
    };
    
    // Configure mocks
    mock.onGet(new RegExp('http://localhost:3000/api/accounts.*')).reply(200, initialAccounts);
    mock.onPatch('http://localhost:3000/api/accounts/wa1/status').reply(200, { 
      data: updatedAccount 
    });
    
    // Renderiza o hook
    const { result } = renderHook(() => useAccounts());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Executa a atualização
    act(() => {
      result.current.updateAccountStatus('wa1', 'disconnected');
    });
    
    // Verifica se a atualização foi realizada
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
