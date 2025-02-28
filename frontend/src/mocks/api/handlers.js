/**
 * API Request Handlers for MSW (Mock Service Worker)
 * Define mock handlers for API endpoints to simulate backend responses
 */
import { rest } from 'msw';
import { 
  mockSystemStatus, 
  mockActivityLogs, 
  mockStatusHistory, 
  mockPerformanceMetrics,
  mockWhatsAppAccounts,
  mockInstagramAccounts,
  mockConversations
} from '../mockData';
import { delay, shouldError, generateError, paginate, filterCollection } from '../utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Middleware para simular comportamento realista da API
const withApiMiddleware = async (req, res, ctx) => {
  // Adiciona delay para simular latência da rede
  await delay();
  
  // Simula erros aleatórios baseados na taxa configurada
  if (shouldError()) {
    const error = generateError();
    console.log(`[Mock API] Simulando erro ${error.status}: ${error.message}`);
    return res(
      ctx.status(error.status),
      ctx.json({ 
        error: true, 
        message: error.message, 
        timestamp: new Date().toISOString()
      })
    );
  }
  
  // Continua com a resposta normal
  return null;
};

/**
 * API Handlers
 */
export const handlers = [
  // Login
  rest.post(`${API_URL}/auth/login`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Login successful',
          data: {
            token: 'mock-jwt-token-for-development-only',
            user: {
              id: 1,
              name: 'Admin User',
              email: 'admin@pandora.com',
              role: 'admin',
              createdAt: new Date().toISOString()
            }
          }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid credentials',
        timestamp: new Date().toISOString()
      })
    );
  }),

  // Dashboard Status
  rest.get(`${API_URL}/dashboard/status`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    return res(
      ctx.status(200),
      ctx.json(mockSystemStatus)
    );
  }),

  // Dashboard Activity Logs
  rest.get(`${API_URL}/dashboard/activity`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const platform = req.url.searchParams.get('platform');
    const type = req.url.searchParams.get('type');
    const search = req.url.searchParams.get('search');
    
    // Filtra os logs com base nos parâmetros
    let filteredLogs = [...mockActivityLogs];
    if (platform) {
      filteredLogs = filteredLogs.filter(log => log.platform === platform);
    }
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(search.toLowerCase()) || 
        log.username.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Retorna dados paginados
    return res(
      ctx.status(200),
      ctx.json(paginate(filteredLogs, { page, limit }))
    );
  }),

  // Dashboard Performance Metrics
  rest.get(`${API_URL}/dashboard/performance`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const startDate = req.url.searchParams.get('startDate');
    const endDate = req.url.searchParams.get('endDate');
    
    // Clone as métricas para não modificar o original
    const metrics = JSON.parse(JSON.stringify(mockPerformanceMetrics));
    
    // Filtra cada conjunto de métricas por data se necessário
    if (startDate && endDate) {
      const filterByDateRange = (data) => {
        return data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
        });
      };
      
      metrics.apiResponseTime = filterByDateRange(metrics.apiResponseTime);
      metrics.cpuUsage = filterByDateRange(metrics.cpuUsage);
      metrics.memoryUsage = filterByDateRange(metrics.memoryUsage);
      metrics.messagesSent = filterByDateRange(metrics.messagesSent);
      metrics.messagesReceived = filterByDateRange(metrics.messagesReceived);
    }
    
    return res(
      ctx.status(200),
      ctx.json(metrics)
    );
  }),

  // Dashboard Status History
  rest.get(`${API_URL}/dashboard/status/history`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const startDate = req.url.searchParams.get('startDate');
    const endDate = req.url.searchParams.get('endDate');
    
    // Filtra por data se fornecido
    let filteredHistory = mockStatusHistory;
    if (startDate && endDate) {
      filteredHistory = mockStatusHistory.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    }
    
    return res(
      ctx.status(200),
      ctx.json(filteredHistory)
    );
  }),

  // Dashboard Account Stats
  rest.get(`${API_URL}/dashboard/accounts/stats`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const whatsappActive = mockWhatsAppAccounts.filter(a => a.status === 'connected').length;
    const whatsappInactive = mockWhatsAppAccounts.filter(a => a.status !== 'connected').length;
    const instagramActive = mockInstagramAccounts.filter(a => a.status === 'connected').length;
    const instagramInactive = mockInstagramAccounts.filter(a => a.status !== 'connected').length;
    
    return res(
      ctx.status(200),
      ctx.json({
        whatsapp: { active: whatsappActive, inactive: whatsappInactive, total: mockWhatsAppAccounts.length },
        instagram: { active: instagramActive, inactive: instagramInactive, total: mockInstagramAccounts.length },
        total: mockWhatsAppAccounts.length + mockInstagramAccounts.length
      })
    );
  }),

  // Dashboard Conversation Stats
  rest.get(`${API_URL}/dashboard/conversations/stats`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const total = mockConversations.length;
    const active = mockConversations.filter(c => !c.archived).length;
    const archived = mockConversations.filter(c => c.archived).length;
    
    const whatsappConversations = mockConversations.filter(c => c.platform === 'whatsapp').length;
    const instagramConversations = mockConversations.filter(c => c.platform === 'instagram').length;
    
    return res(
      ctx.status(200),
      ctx.json({
        total,
        active,
        archived,
        platforms: {
          whatsapp: whatsappConversations,
          instagram: instagramConversations
        }
      })
    );
  }),

  // Dashboard Analytics Data
  rest.get(`${API_URL}/dashboard/analytics`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    return res(
      ctx.status(200),
      ctx.json({
        statusHistory: mockStatusHistory,
        performanceMetrics: mockPerformanceMetrics,
        conversations: mockConversations,
        whatsappAccounts: mockWhatsAppAccounts,
        instagramAccounts: mockInstagramAccounts
      })
    );
  }),
  
  // Accounts List
  rest.get(`${API_URL}/accounts`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const platform = req.url.searchParams.get('platform');
    const status = req.url.searchParams.get('status');
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    
    let accounts = [];
    
    // Seleciona as contas com base na plataforma solicitada
    if (!platform || platform === 'all') {
      accounts = [...mockWhatsAppAccounts, ...mockInstagramAccounts];
    } else if (platform === 'whatsapp') {
      accounts = [...mockWhatsAppAccounts];
    } else if (platform === 'instagram') {
      accounts = [...mockInstagramAccounts];
    }
    
    // Filtra por status se especificado
    if (status) {
      accounts = accounts.filter(a => a.status === status);
    }
    
    return res(
      ctx.status(200),
      ctx.json(paginate(accounts, { page, limit }))
    );
  }),
  
  // Single Account
  rest.get(`${API_URL}/accounts/:id`, async (req, res, ctx) => {
    const errorResponse = await withApiMiddleware(req, res, ctx);
    if (errorResponse) return errorResponse;
    
    const { id } = req.params;
    
    // Procura em ambas as coleções de contas
    const account = 
      mockWhatsAppAccounts.find(a => a.id === id) || 
      mockInstagramAccounts.find(a => a.id === id);
    
    if (!account) {
      return res(
        ctx.status(404),
        ctx.json({ error: true, message: 'Conta não encontrada' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(account)
    );
  })
];
