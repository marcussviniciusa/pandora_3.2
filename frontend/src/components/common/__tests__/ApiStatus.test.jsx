import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiStatus from '../ApiStatus';
import * as useApiStatusModule from '../../../hooks/useApiStatus';
import { AllProvidersWrapper } from '../../../tests/mockContexts';

describe('ApiStatus Component', () => {
  // Setup do mock para o hook useApiStatus
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar indicador de status corretamente quando online', () => {
    // Mock do hook retornando status online
    vi.spyOn(useApiStatusModule, 'useApiStatus').mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: vi.fn()
    });

    render(<ApiStatus />, { wrapper: AllProvidersWrapper });

    // Verifica se o indicador correto é mostrado
    const statusElement = screen.getByTestId('api-status-indicator');
    expect(statusElement).toHaveClass('bg-green-500');

    // Verifica o texto
    expect(screen.getByText(/API Online/i)).toBeInTheDocument();
    expect(screen.getByText(/50ms/i)).toBeInTheDocument();
  });

  it('deve renderizar indicador de status corretamente quando offline', () => {
    // Mock do hook retornando status offline
    vi.spyOn(useApiStatusModule, 'useApiStatus').mockReturnValue({
      status: 'offline',
      latency: null,
      lastChecked: new Date(),
      error: new Error('Connection failed'),
      checkApiStatus: vi.fn()
    });

    render(<ApiStatus />, { wrapper: AllProvidersWrapper });

    // Verifica se o indicador correto é mostrado
    const statusElement = screen.getByTestId('api-status-indicator');
    expect(statusElement).toHaveClass('bg-red-500');
    
    // Verifica o texto
    expect(screen.getByText(/API Offline/i)).toBeInTheDocument();
  });

  it('deve renderizar indicador de status corretamente quando degraded', () => {
    // Mock do hook retornando status degraded
    vi.spyOn(useApiStatusModule, 'useApiStatus').mockReturnValue({
      status: 'degraded',
      latency: 350,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: vi.fn()
    });

    render(<ApiStatus />, { wrapper: AllProvidersWrapper });

    // Verifica se o indicador correto é mostrado
    const statusElement = screen.getByTestId('api-status-indicator');
    expect(statusElement).toHaveClass('bg-yellow-500');
    
    // Verifica o texto
    expect(screen.getByText(/API Degraded/i)).toBeInTheDocument();
    expect(screen.getByText(/350ms/i)).toBeInTheDocument();
  });

  it('deve renderizar indicador de status corretamente quando checking', () => {
    // Mock do hook retornando status checking
    vi.spyOn(useApiStatusModule, 'useApiStatus').mockReturnValue({
      status: 'checking',
      latency: null,
      lastChecked: null,
      error: null,
      checkApiStatus: vi.fn()
    });

    render(<ApiStatus />, { wrapper: AllProvidersWrapper });

    // Verifica se o indicador correto é mostrado
    const statusElement = screen.getByTestId('api-status-indicator');
    expect(statusElement).toHaveClass('bg-gray-500');
    
    // Verifica o texto
    expect(screen.getByText(/Checking API/i)).toBeInTheDocument();
  });

  it('deve chamar checkApiStatus quando botão de atualização é clicado', async () => {
    // Mock da função checkApiStatus
    const checkApiStatusMock = vi.fn();
    
    // Mock do hook
    vi.spyOn(useApiStatusModule, 'useApiStatus').mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: checkApiStatusMock
    });

    render(<ApiStatus />, { wrapper: AllProvidersWrapper });
    
    // Configura o userEvent
    const user = userEvent.setup();
    
    // Encontra e clica no botão de refresh
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    // Verifica se a função foi chamada
    expect(checkApiStatusMock).toHaveBeenCalledTimes(1);
  });

  it('deve exibir data e hora da última verificação', () => {
    // Data fixada para teste
    const fixedDate = new Date('2023-09-15T12:30:45');
    
    // Mock do hook retornando lastChecked
    vi.spyOn(useApiStatusModule, 'useApiStatus').mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: fixedDate,
      error: null,
      checkApiStatus: vi.fn()
    });

    render(<ApiStatus />, { wrapper: AllProvidersWrapper });
    
    // Verifica se a data é exibida corretamente
    // O formato exato depende da implementação, mas deve conter a data
    const dateTimeText = screen.getByText(/12:30/);
    expect(dateTimeText).toBeInTheDocument();
  });
});
