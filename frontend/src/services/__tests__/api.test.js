import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { dashboardService } from '../api';

describe('API Services', () => {
  let mock;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  describe('Dashboard Service', () => {
    test('getSystemStatus - should fetch system status', async () => {
      const mockData = {
        status: 'operational',
        whatsapp: { status: 'operational', message: 'All systems operational' },
        instagram: { status: 'operational', message: 'All systems operational' },
        database: { status: 'operational', message: 'Database operational' },
        api: { status: 'operational', message: 'API operational' },
        updatedAt: new Date().toISOString()
      };

      mock.onGet('/dashboard/status').reply(200, mockData);
      
      const data = await dashboardService.getSystemStatus();
      expect(data).toEqual(mockData);
    });

    test('getActivityLogs - should fetch activity logs', async () => {
      const mockData = [
        { 
          id: 'act1', 
          type: 'message', 
          title: 'New message', 
          description: 'User sent a message',
          timestamp: new Date().toISOString() 
        }
      ];

      mock.onGet('/dashboard/activity').reply(200, mockData);
      
      const data = await dashboardService.getActivityLogs();
      expect(data).toEqual(mockData);
    });

    test('getAnalyticsData - should fetch analytics data', async () => {
      const mockData = {
        statusHistory: [],
        performanceMetrics: {},
        conversations: [],
        whatsappAccounts: [],
        instagramAccounts: []
      };

      mock.onGet('/dashboard/analytics').reply(200, mockData);
      
      const data = await dashboardService.getAnalyticsData();
      expect(data).toEqual(mockData);
    });

    test('should handle errors correctly', async () => {
      mock.onGet('/dashboard/status').reply(500, { message: 'Server error' });
      
      await expect(dashboardService.getSystemStatus()).rejects.toThrow();
    });
  });
});
