import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as useAccountsModule from '../../../hooks/useAccounts';
import * as useApiStatusModule from '../../../hooks/useApiStatus';
import React from 'react';

// Mock para o SocketContext
vi.mock('../../../context/SocketContext', () => {
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

// Mock dos componentes filhos
vi.mock('../AccountStats', () => ({
  default: () => <div data-testid="mock-account-stats">Account Stats Component</div>
}));

vi.mock('../AccountsList', () => ({
  default: () => <div data-testid="mock-accounts-list">Accounts List Component</div>
}));

vi.mock('../SystemStatus', () => ({
  default: () => <div data-testid="mock-system-status">System Status Component</div>
}));

vi.mock('../ActivityLog', () => ({
  default: () => <div data-testid="mock-activity-log">Activity Log Component</div>
}));

vi.mock('../Analytics', () => ({
  default: () => <div data-testid="mock-analytics">Analytics Component</div>
}));

vi.mock('../../common/ApiStatus', () => ({
  default: () => <div data-testid="mock-api-status">API Status Component</div>
}));

// Precisamos do mock para o react-router-dom, mesmo sem o Outlet
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
  useParams: () => ({}),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

describe('Dashboard Component', () => {
  // Setup do mock para os hooks
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock para useAccounts
    vi.spyOn(useAccountsModule, 'useAccounts').mockReturnValue({
      accounts: [],
      loading: false,
      error: null,
      pagination: { total: 0, page: 1, limit: 10 }
    });
    
    // Mock para useApiStatus
    vi.spyOn(useApiStatusModule, 'useApiStatus').mockReturnValue({
      status: 'online',
      latency: 50,
      lastChecked: new Date(),
      error: null,
      checkApiStatus: vi.fn()
    });
  });

  it('deve renderizar o layout do dashboard corretamente', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mock-account-stats')).toBeInTheDocument();
    expect(screen.getByTestId('mock-accounts-list')).toBeInTheDocument();
    expect(screen.getByTestId('mock-system-status')).toBeInTheDocument();
    expect(screen.getByTestId('mock-activity-log')).toBeInTheDocument();
    expect(screen.getByTestId('mock-analytics')).toBeInTheDocument();
  });
  
  it('deve mostrar o indicador de status do socket', () => {
    render(<Dashboard />);
    
    expect(screen.getByText('Socket Conectado')).toBeInTheDocument();
    // Verifica se o indicador tem a classe correta para conexão ativa
    const indicador = screen.getByText('Socket Conectado').previousSibling;
    expect(indicador).toHaveClass('bg-green-500');
  });
  
  it('deve mostrar a mensagem de última atualização', () => {
    // Mockando Date.toLocaleTimeString para retornar um valor consistente
    const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
    Date.prototype.toLocaleTimeString = vi.fn(() => '12:34:56');
    
    render(<Dashboard />);
    
    expect(screen.getByText(/Dados atualizados automaticamente/)).toBeInTheDocument();
    expect(screen.getByText(/Última atualização: 12:34:56/)).toBeInTheDocument();
    
    // Restaura o método original após o teste
    Date.prototype.toLocaleTimeString = originalToLocaleTimeString;
  });
});
