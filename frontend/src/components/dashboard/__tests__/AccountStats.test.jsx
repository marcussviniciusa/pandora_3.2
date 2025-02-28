import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountStats from '../AccountStats';
import * as useAccountsModule from '../../../hooks/useAccounts';
import { mockWhatsAppAccounts, mockInstagramAccounts } from '../../../mocks/mockData';
import { AllProvidersWrapper } from '../../../tests/mockContexts';

describe('AccountStats Component', () => {
  // Setup do mock para o hook useAccounts
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deve renderizar estatísticas corretamente quando há contas', () => {
    // Mock de contas
    const mockAccounts = [
      // WhatsApp (2 conectadas, 1 desconectada)
      { ...mockWhatsAppAccounts[0], status: 'connected' },
      { ...mockWhatsAppAccounts[1], status: 'connected' },
      { ...mockWhatsAppAccounts[2], status: 'disconnected' },
      // Instagram (1 conectada, 1 desconectada)
      { ...mockInstagramAccounts[0], status: 'connected' },
      { ...mockInstagramAccounts[1], status: 'disconnected' },
    ];
    
    // Mock do hook useAccounts
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: mockAccounts,
      loading: false,
      error: null,
      pagination: {
        total: mockAccounts.length,
        page: 1,
        limit: 10,
        pages: 1,
        hasMore: false
      }
    });

    render(<AccountStats />, { wrapper: AllProvidersWrapper });
    
    // Verifica as estatísticas totais
    expect(screen.getByText('5')).toBeInTheDocument();  // Total de contas
    
    // Verifica as estatísticas por plataforma
    expect(screen.getByText('3')).toBeInTheDocument();  // Total do WhatsApp
    expect(screen.getByText('2')).toBeInTheDocument();  // Total do Instagram
    
    // Verifica estatísticas por status
    const connected = screen.getByTestId('connected-count');
    const disconnected = screen.getByTestId('disconnected-count');
    
    expect(connected).toHaveTextContent('3');  // 3 contas conectadas
    expect(disconnected).toHaveTextContent('2');  // 2 contas desconectadas
  });

  it('deve mostrar zeros quando não há contas', () => {
    // Mock do hook useAccounts com lista vazia
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: [],
      loading: false,
      error: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
        hasMore: false
      }
    });

    render(<AccountStats />, { wrapper: AllProvidersWrapper });
    
    // Verifica se todas as estatísticas são zero
    const totalCountElement = screen.getByTestId('total-accounts');
    const whatsappCountElement = screen.getByTestId('whatsapp-count');
    const instagramCountElement = screen.getByTestId('instagram-count');
    const connectedCountElement = screen.getByTestId('connected-count');
    const disconnectedCountElement = screen.getByTestId('disconnected-count');
    
    expect(totalCountElement).toHaveTextContent('0');
    expect(whatsappCountElement).toHaveTextContent('0');
    expect(instagramCountElement).toHaveTextContent('0');
    expect(connectedCountElement).toHaveTextContent('0');
    expect(disconnectedCountElement).toHaveTextContent('0');
  });

  it('deve mostrar indicador de carregamento quando loading=true', () => {
    // Mock do hook useAccounts com loading=true
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: [],
      loading: true,
      error: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
        hasMore: false
      }
    });

    render(<AccountStats />, { wrapper: AllProvidersWrapper });
    
    // Verifica se o indicador de carregamento está presente
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('deve mostrar mensagem de erro quando error não é null', () => {
    // Mock do hook useAccounts com error
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: [],
      loading: false,
      error: new Error('Failed to fetch accounts'),
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
        hasMore: false
      }
    });

    render(<AccountStats />, { wrapper: AllProvidersWrapper });
    
    // Verifica se a mensagem de erro está presente
    expect(screen.getByText(/Failed to fetch accounts/i)).toBeInTheDocument();
  });

  it('deve mostrar porcentagens corretas de contas conectadas/desconectadas', () => {
    // Mock de contas - 2 conectadas (40%), 3 desconectadas (60%)
    const mockAccounts = [
      { ...mockWhatsAppAccounts[0], status: 'connected' },
      { ...mockWhatsAppAccounts[1], status: 'disconnected' },
      { ...mockWhatsAppAccounts[2], status: 'disconnected' },
      { ...mockInstagramAccounts[0], status: 'connected' },
      { ...mockInstagramAccounts[1], status: 'disconnected' },
    ];
    
    // Mock do hook useAccounts
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: mockAccounts,
      loading: false,
      error: null,
      pagination: {
        total: mockAccounts.length,
        page: 1,
        limit: 10,
        pages: 1,
        hasMore: false
      }
    });

    render(<AccountStats />, { wrapper: AllProvidersWrapper });
    
    // Verifica as porcentagens
    const connectedPercent = screen.getByTestId('connected-percent');
    const disconnectedPercent = screen.getByTestId('disconnected-percent');
    
    expect(connectedPercent).toHaveTextContent('40%');
    expect(disconnectedPercent).toHaveTextContent('60%');
  });

  it('deve renderizar ícones das plataformas corretamente', () => {
    // Mock de contas com ambas as plataformas
    const mockAccounts = [
      ...mockWhatsAppAccounts.slice(0, 2),
      ...mockInstagramAccounts.slice(0, 2)
    ];
    
    // Mock do hook useAccounts
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: mockAccounts,
      loading: false,
      error: null,
      pagination: {
        total: mockAccounts.length,
        page: 1,
        limit: 10,
        pages: 1,
        hasMore: false
      }
    });

    render(<AccountStats />, { wrapper: AllProvidersWrapper });
    
    // Verifica se os ícones das plataformas estão presentes
    expect(screen.getByTestId('whatsapp-platform-icon')).toBeInTheDocument();
    expect(screen.getByTestId('instagram-platform-icon')).toBeInTheDocument();
  });
});
