import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardService } from '../api/dashboardService';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock do axios para testes
const mock = new MockAdapter(axios);

describe('Dashboard Service', () => {
  beforeEach(() => {
    // Limpa todas as configurações de mock antes de cada teste
    mock.reset();
    
    // Define o ambiente como desenvolvimento
    vi.stubEnv('VITE_USE_REAL_API', 'false');
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');
  });
  
  describe('getSystemStatus', () => {
    it('deve retornar dados de status do sistema', async () => {
      // Configura o mock
      const mockData = {
        api: { status: 'operational', uptime: '99.9%' },
        services: {
          database: { status: 'operational' },
          messaging: { status: 'operational' }
        }
      };
      
      mock.onGet('http://localhost:3000/api/dashboard/status').reply(200, mockData);
      
      // Executa o teste
      const result = await dashboardService.getSystemStatus();
      
      // Verifica o resultado
      expect(result).toEqual(mockData);
      expect(mock.history.get.length).toBe(1);
    });
    
    it('deve lidar com erros corretamente', async () => {
      // Configura o mock para retornar erro
      mock.onGet('http://localhost:3000/api/dashboard/status').reply(500);
      
      // Verifica se lança exceção
      await expect(dashboardService.getSystemStatus()).rejects.toThrow();
    });
  });
  
  describe('getActivityLogs', () => {
    it('deve retornar logs de atividade com paginação', async () => {
      // Configura o mock
      const mockData = {
        data: [
          { id: 'act1', type: 'message', platform: 'whatsapp' },
          { id: 'act2', type: 'status', platform: 'instagram' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1,
          hasMore: false
        }
      };
      
      mock.onGet('http://localhost:3000/api/dashboard/activity').reply(200, mockData);
      
      // Executa o teste
      const result = await dashboardService.getActivityLogs();
      
      // Verifica o resultado
      expect(result).toEqual(mockData);
    });
    
    it('deve aplicar filtros corretamente', async () => {
      // Configura o mock
      const mockData = {
        data: [{ id: 'act1', type: 'message', platform: 'whatsapp' }],
        pagination: {
          total: 1,
          page: 1,
          limit: 5,
          pages: 1,
          hasMore: false
        }
      };
      
      // Verifica se a URL contém os parâmetros corretos
      mock.onGet(/dashboard\/activity/).reply((config) => {
        const url = new URL(config.url, 'http://localhost:3000');
        const params = url.searchParams;
        
        expect(params.get('platform')).toBe('whatsapp');
        expect(params.get('type')).toBe('message');
        expect(params.get('limit')).toBe('5');
        expect(params.get('page')).toBe('2');
        
        return [200, mockData];
      });
      
      // Executa o teste com filtros
      const result = await dashboardService.getActivityLogs({
        platform: 'whatsapp',
        type: 'message',
        limit: 5,
        page: 2
      });
      
      // Verifica o resultado
      expect(result).toEqual(mockData);
    });
  });
  
  describe('getAnalyticsData', () => {
    it('deve retornar dados analíticos completos', async () => {
      // Configura o mock
      const mockData = {
        statusHistory: [{ date: '2023-09-01', status: 'operational' }],
        performanceMetrics: {
          apiResponseTime: [{ date: '2023-09-01', value: 120 }]
        },
        conversations: [],
        whatsappAccounts: [],
        instagramAccounts: []
      };
      
      mock.onGet('http://localhost:3000/api/dashboard/analytics').reply(200, mockData);
      
      // Executa o teste
      const result = await dashboardService.getAnalyticsData();
      
      // Verifica o resultado
      expect(result).toEqual(mockData);
    });
  });
  
  describe('getPerformanceMetrics', () => {
    it('deve aplicar filtros de data corretamente', async () => {
      // Configura o mock
      const mockData = {
        apiResponseTime: [{ date: '2023-09-01', value: 120 }],
        cpuUsage: [{ date: '2023-09-01', value: 45 }]
      };
      
      // Verifica se a URL contém os parâmetros de data
      mock.onGet(/dashboard\/performance/).reply((config) => {
        const url = new URL(config.url, 'http://localhost:3000');
        const params = url.searchParams;
        
        expect(params.get('startDate')).toBe('2023-09-01');
        expect(params.get('endDate')).toBe('2023-09-30');
        
        return [200, mockData];
      });
      
      // Executa o teste com filtros de data
      const result = await dashboardService.getPerformanceMetrics({
        startDate: '2023-09-01',
        endDate: '2023-09-30'
      });
      
      // Verifica o resultado
      expect(result).toEqual(mockData);
    });
  });
});
