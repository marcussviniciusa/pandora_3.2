import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountsList from '../AccountsList';
import * as useAccountsModule from '../../../hooks/useAccounts';
import { mockWhatsAppAccounts, mockInstagramAccounts } from '../../../mocks/mockData';
import { AllProvidersWrapper } from '../../../tests/mockContexts';

// Mock do react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

describe('AccountsList Component', () => {
  // Setup mock para o hook useAccounts
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deve renderizar a lista de contas corretamente', () => {
    // Mock de contas
    const mockAccounts = [...mockWhatsAppAccounts, ...mockInstagramAccounts];
    
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
      },
      goToPage: vi.fn(),
      updateAccountStatus: vi.fn(),
      refreshAccounts: vi.fn()
    });

    render(<AccountsList />, { wrapper: AllProvidersWrapper });
    
    // Verifica se o título está presente
    expect(screen.getByText(/Connected Accounts/i)).toBeInTheDocument();
    
    // Verifica se todas as contas foram renderizadas
    mockAccounts.forEach(account => {
      expect(screen.getByText(account.name)).toBeInTheDocument();
    });
    
    // Verifica se os ícones das plataformas são mostrados
    const whatsappIcons = screen.getAllByTestId('whatsapp-icon');
    const instagramIcons = screen.getAllByTestId('instagram-icon');
    
    expect(whatsappIcons.length).toBe(mockWhatsAppAccounts.length);
    expect(instagramIcons.length).toBe(mockInstagramAccounts.length);
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
      },
      goToPage: vi.fn(),
      updateAccountStatus: vi.fn(),
      refreshAccounts: vi.fn()
    });

    render(<AccountsList />, { wrapper: AllProvidersWrapper });
    
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
      },
      goToPage: vi.fn(),
      updateAccountStatus: vi.fn(),
      refreshAccounts: vi.fn()
    });

    render(<AccountsList />, { wrapper: AllProvidersWrapper });
    
    // Verifica se a mensagem de erro está presente
    expect(screen.getByText(/Failed to fetch accounts/i)).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há contas', () => {
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
      },
      goToPage: vi.fn(),
      updateAccountStatus: vi.fn(),
      refreshAccounts: vi.fn()
    });

    render(<AccountsList />, { wrapper: AllProvidersWrapper });
    
    // Verifica se a mensagem "No accounts found" está presente
    expect(screen.getByText(/No accounts found/i)).toBeInTheDocument();
  });

  it('deve filtrar contas quando um filtro é selecionado', async () => {
    // Mock de contas
    const mockAccounts = [...mockWhatsAppAccounts, ...mockInstagramAccounts];
    
    // Mock para useAccounts
    const useAccountsMock = vi.fn().mockReturnValue({
      accounts: mockAccounts,
      loading: false,
      error: null,
      pagination: {
        total: mockAccounts.length,
        page: 1,
        limit: 10,
        pages: 1,
        hasMore: false
      },
      goToPage: vi.fn(),
      updateAccountStatus: vi.fn(),
      refreshAccounts: vi.fn()
    });
    
    vi.spyOn(useAccountsModule, 'useAccounts').mockImplementation(useAccountsMock);

    render(<AccountsList />, { wrapper: AllProvidersWrapper });
    
    // Configura userEvent
    const user = userEvent.setup();
    
    // Seleciona o filtro de plataforma "WhatsApp"
    const platformFilter = screen.getByLabelText(/Filter by platform/i);
    await user.selectOptions(platformFilter, ['whatsapp']);
    
    // Verifica se o hook foi chamado com o filtro correto
    expect(useAccountsMock).toHaveBeenCalledWith(expect.objectContaining({ 
      platform: 'whatsapp' 
    }));
  });

  it('deve chamar updateAccountStatus quando o botão de status é clicado', async () => {
    // Mock para a função updateAccountStatus
    const updateAccountStatusMock = vi.fn();
    
    // Mock de contas com a primeira conectada
    const mockAccounts = [
      { ...mockWhatsAppAccounts[0], status: 'connected' },
      ...mockWhatsAppAccounts.slice(1),
      ...mockInstagramAccounts
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
      },
      goToPage: vi.fn(),
      updateAccountStatus: updateAccountStatusMock,
      refreshAccounts: vi.fn()
    });

    render(<AccountsList />, { wrapper: AllProvidersWrapper });
    
    // Configura userEvent
    const user = userEvent.setup();
    
    // Encontra o primeiro botão de status e clica nele
    const accountRows = screen.getAllByTestId('account-row');
    const statusButton = within(accountRows[0]).getByRole('button', { name: /disconnect/i });
    await user.click(statusButton);
    
    // Verifica se a função foi chamada com os parâmetros corretos
    expect(updateAccountStatusMock).toHaveBeenCalledWith(
      mockAccounts[0].id,
      'disconnected'
    );
  });

  it('deve chamar refreshAccounts quando o botão refresh é clicado', async () => {
    // Mock para a função refreshAccounts
    const refreshAccountsMock = vi.fn();
    
    // Mock do hook useAccounts
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: mockWhatsAppAccounts,
      loading: false,
      error: null,
      pagination: {
        total: mockWhatsAppAccounts.length,
        page: 1,
        limit: 10,
        pages: 1,
        hasMore: false
      },
      goToPage: vi.fn(),
      updateAccountStatus: vi.fn(),
      refreshAccounts: refreshAccountsMock
    });

    render(<AccountsList />, { wrapper: AllProvidersWrapper });
    
    // Configura userEvent
    const user = userEvent.setup();
    
    // Encontra o botão de refresh e clica nele
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    // Verifica se a função foi chamada
    expect(refreshAccountsMock).toHaveBeenCalledTimes(1);
  });
});
