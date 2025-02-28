import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SystemStatusIndicator from '../SystemStatusIndicator';
import { setupApiStatusTest } from '../../../tests/utils/apiStatusTestUtils';
import { AllProvidersWrapper } from '../../../tests/mockContexts';

// Mock the useApiStatus hook to control its behavior in tests
vi.mock('../../../hooks/useApiStatus', () => ({
  useApiStatus: vi.fn()
}));

// Import the mocked hook
import { useApiStatus } from '../../../hooks/useApiStatus';

describe('SystemStatusIndicator Component', () => {
  const apiStatusUtils = setupApiStatusTest();
  
  beforeEach(() => {
    // Reset mock between tests
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    apiStatusUtils.cleanup();
  });
  
  const renderComponent = (props = {}) => {
    return render(
      <SystemStatusIndicator {...props} />,
      { wrapper: AllProvidersWrapper }
    );
  };
  
  it('deve exibir o estado inicial "Verificando..."', () => {
    // Mock the hook to return initial state
    useApiStatus.mockReturnValue({
      status: 'checking',
      latency: null,
      lastChecked: null,
      error: null,
      checkApiStatus: vi.fn()
    });
    
    renderComponent();
    
    expect(screen.getByText('Verificando...')).toBeInTheDocument();
  });
  
  it('deve exibir o estado "Sistema Online" após verificação bem-sucedida', () => {
    // Mock the hook to return online state
    useApiStatus.mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: vi.fn()
    });
    
    renderComponent();
    
    expect(screen.getByText('Sistema Online')).toBeInTheDocument();
    
    // Verify the color is correct
    const statusIndicator = screen.getByText('Sistema Online').previousSibling;
    expect(statusIndicator).toHaveClass('bg-green-500');
  });
  
  it('deve exibir o estado "Sistema Lento" quando há latência alta', () => {
    // Mock the hook to return degraded state
    useApiStatus.mockReturnValue({
      status: 'degraded',
      latency: 350,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: vi.fn()
    });
    
    renderComponent();
    
    expect(screen.getByText('Sistema Lento')).toBeInTheDocument();
    
    // Verify the color is correct
    const statusIndicator = screen.getByText('Sistema Lento').previousSibling;
    expect(statusIndicator).toHaveClass('bg-yellow-500');
  });
  
  it('deve exibir o estado "Sistema Offline" quando o servidor está indisponível', () => {
    // Mock the hook to return offline state with an error
    const mockError = new Error('Servidor indisponível');
    useApiStatus.mockReturnValue({
      status: 'offline',
      latency: null,
      lastChecked: new Date(),
      error: mockError,
      checkApiStatus: vi.fn()
    });
    
    renderComponent();
    
    expect(screen.getByText('Sistema Offline')).toBeInTheDocument();
    
    // Verify the color is correct
    const statusIndicator = screen.getByText('Sistema Offline').previousSibling;
    expect(statusIndicator).toHaveClass('bg-red-500');
    
    // Verify error message is displayed
    expect(screen.getByTestId('status-error')).toBeInTheDocument();
    expect(screen.getByText(/Erro: Servidor indisponível/)).toBeInTheDocument();
  });
  
  it('deve exibir informações de latência quando showLatency=true', () => {
    // Mock the hook to return online state with latency
    useApiStatus.mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: vi.fn()
    });
    
    renderComponent({ showLatency: true });
    
    // Check if latency is shown
    expect(screen.getByText(/\(50ms\)/)).toBeInTheDocument();
  });
  
  it('deve chamar a função checkApiStatus ao clicar no botão "Atualizar"', async () => {
    // Create a mock function
    const mockCheckApiStatus = vi.fn();
    
    // Mock the hook to return a function we can spy on
    useApiStatus.mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: mockCheckApiStatus
    });
    
    renderComponent();
    
    // Set up user events
    const user = userEvent.setup();
    
    // Click refresh button
    await user.click(screen.getByTestId('refresh-status-btn'));
    
    // Verify that checkApiStatus was called
    expect(mockCheckApiStatus).toHaveBeenCalledTimes(1);
  });
  
  it('deve exibir a data/hora da última verificação', () => {
    // Mock a specific date
    const mockDate = new Date('2025-02-28T10:30:00');
    
    // Mock the hook to return a state with lastChecked
    useApiStatus.mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: mockDate,
      error: null,
      checkApiStatus: vi.fn()
    });
    
    renderComponent();
    
    // Check if last check time is displayed
    expect(screen.getByText(/Última verificação:/)).toBeInTheDocument();
  });
  
  it('deve passar os parâmetros corretos para o hook useApiStatus', () => {
    // Mock the hook return value to avoid destructuring errors
    useApiStatus.mockReturnValue({
      status: 'online',
      latency: 100,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: vi.fn()
    });
    
    // Render with custom props
    renderComponent({
      checkInterval: 2000,
      checkOnLoad: false
    });
    
    // Verify that the hook was called with the correct parameters
    expect(useApiStatus).toHaveBeenCalledWith({
      checkInterval: 2000,
      checkOnLoad: false
    });
  });
});
