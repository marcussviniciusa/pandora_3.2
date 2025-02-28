import React from 'react';
import { vi } from 'vitest';

// Mock para os serviços da API
const mockDashboardService = {
  getSystemStatus: vi.fn().mockResolvedValue({ 
    api: { 
      status: 'online',
      version: '1.0.0'
    }
  }),
  getAccounts: vi.fn().mockResolvedValue({ 
    accounts: [], 
    pagination: { total: 0, page: 1, limit: 10, pages: 0 } 
  }),
  updateAccountStatus: vi.fn().mockResolvedValue({ 
    account: { id: '1', status: 'connected' } 
  }),
  getMessages: vi.fn().mockResolvedValue({ 
    totalMessages: 0, 
    todayMessages: 0, 
    messagesStatistics: { week: [] } 
  }),
  getPerformanceMetrics: vi.fn().mockResolvedValue({
    cpu: 30,
    memory: 40,
    uptime: "12:45:30"
  }),
  getActivityLogs: vi.fn().mockResolvedValue([]),
  getStatusHistory: vi.fn().mockResolvedValue([]),
  getAccountStats: vi.fn().mockResolvedValue({
    total: 10,
    active: 8,
    inactive: 2
  }),
  getConversationStats: vi.fn().mockResolvedValue({
    total: 100,
    open: 25,
    closed: 75
  }),
  getAnalyticsData: vi.fn().mockResolvedValue({})
};

// Corrigindo o mock
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}));

vi.mock('../services/api/dashboardService', () => ({
  ...mockDashboardService,
  default: mockDashboardService,
  __esModule: true
}));

// Criando um mock explícito para SocketContext
export const SocketContext = React.createContext(undefined);

// Mock value para o SocketContext
const mockSocketContextValue = {
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true
  },
  isConnected: true,
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribeToEvent: vi.fn(),
  unsubscribeFromEvent: vi.fn()
};

// Mock para o módulo SocketContext
vi.mock('../context/SocketContext', () => {
  const actual = jest.requireActual('react');
  
  return {
    SocketContext: {
      Provider: actual.createContext(mockSocketContextValue).Provider,
      Consumer: actual.createContext(mockSocketContextValue).Consumer
    },
    useSocket: () => mockSocketContextValue,
    SocketProvider: ({ children }) => children
  };
});

// Criando um mock explícito para AuthContext
export const AuthContext = React.createContext(undefined);

// Mock value para o AuthContext
const mockAuthContextValue = {
  user: { id: 'user1', name: 'Test User', role: 'admin' },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  token: 'mock-token-12345',
  isLoading: false,
  error: null
};

// Mock para o módulo AuthContext
vi.mock('../context/AuthContext', () => {
  const actual = jest.requireActual('react');
  
  return {
    AuthContext: {
      Provider: actual.createContext(mockAuthContextValue).Provider,
      Consumer: actual.createContext(mockAuthContextValue).Consumer
    },
    useAuth: () => mockAuthContextValue,
    AuthProvider: ({ children }) => children
  };
});

// Mock para react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useLocation: vi.fn().mockReturnValue({ pathname: '/dashboard', search: '', hash: '', state: null }),
  useParams: vi.fn().mockReturnValue({}),
  Outlet: vi.fn().mockImplementation(() => <div data-testid="mock-outlet" />),
  Link: vi.fn().mockImplementation(({ children, to }) => (
    <a href={to} data-testid="mock-link">
      {children}
    </a>
  )),
  Navigate: vi.fn().mockImplementation(({ to }) => <div data-testid="mock-navigate" data-to={to} />),
  useRouteMatch: vi.fn().mockReturnValue({ path: '/dashboard', url: '/dashboard' })
}));

// Wrapper para testes
export const AllProvidersWrapper = ({ children }) => {
  return (
    <SocketContext.Provider value={mockSocketContextValue}>
      <AuthContext.Provider value={mockAuthContextValue}>
        {children}
      </AuthContext.Provider>
    </SocketContext.Provider>
  );
};
