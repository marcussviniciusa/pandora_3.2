import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import axios from 'axios';
import { handlers } from '../api/handlers';

// Configuração do servidor MSW para testes
const server = setupServer(...handlers);

describe('MSW API Handlers', () => {
  // Configuração antes de todos os testes
  beforeAll(() => {
    // Define a URL base para as requisições durante os testes
    axios.defaults.baseURL = 'http://localhost:3000';
    
    // Inicia o servidor MSW
    server.listen();
  });
  
  // Limpa os handlers após cada teste
  afterEach(() => {
    server.resetHandlers();
  });
  
  // Fecha o servidor após todos os testes
  afterAll(() => {
    server.close();
  });

  describe('Dashboard Endpoints', () => {
    it('deve retornar status do sistema', async () => {
      // Faz a requisição ao endpoint mockado
      const response = await axios.get('/api/dashboard/status');
      
      // Verifica a resposta
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('api');
      expect(response.data).toHaveProperty('services');
      expect(response.data.api).toHaveProperty('status');
    });
    
    it('deve retornar logs de atividade com paginação', async () => {
      // Faz a requisição ao endpoint mockado
      const response = await axios.get('/api/dashboard/activity');
      
      // Verifica a resposta
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data)).toBe(true);
    });
    
    it('deve retornar métricas de performance', async () => {
      // Faz a requisição ao endpoint mockado
      const response = await axios.get('/api/dashboard/performance');
      
      // Verifica a resposta
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('apiResponseTime');
      expect(response.data).toHaveProperty('cpuUsage');
      expect(response.data).toHaveProperty('memoryUsage');
    });
    
    it('deve filtrar logs de atividade por plataforma', async () => {
      // Faz a requisição ao endpoint mockado com filtro
      const response = await axios.get('/api/dashboard/activity?platform=whatsapp');
      
      // Verifica a resposta
      expect(response.status).toBe(200);
      
      // Verifica se todos os itens são da plataforma WhatsApp
      expect(response.data.data.every(item => item.platform === 'whatsapp')).toBe(true);
    });
  });

  describe('Accounts Endpoints', () => {
    it('deve retornar lista de contas com paginação', async () => {
      // Faz a requisição ao endpoint mockado
      const response = await axios.get('/api/accounts');
      
      // Verifica a resposta
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Verifica se cada conta tem os campos necessários
      response.data.data.forEach(account => {
        expect(account).toHaveProperty('id');
        expect(account).toHaveProperty('name');
        expect(account).toHaveProperty('platform');
        expect(account).toHaveProperty('status');
      });
    });
    
    it('deve retornar contas filtradas por plataforma', async () => {
      // Faz a requisição ao endpoint mockado com filtro
      const response = await axios.get('/api/accounts?platform=instagram');
      
      // Verifica a resposta
      expect(response.status).toBe(200);
      
      // Verifica se todos os itens são da plataforma Instagram
      expect(response.data.data.every(item => item.platform === 'instagram')).toBe(true);
    });
    
    it('deve atualizar o status de uma conta', async () => {
      // Primeiro, busca uma conta existente
      const accountsResponse = await axios.get('/api/accounts');
      const firstAccount = accountsResponse.data.data[0];
      
      // Define o novo status (oposto do atual)
      const newStatus = firstAccount.status === 'connected' ? 'disconnected' : 'connected';
      
      // Atualiza o status
      const updateResponse = await axios.patch(`/api/accounts/${firstAccount.id}/status`, {
        status: newStatus
      });
      
      // Verifica a resposta
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.success).toBe(true);
      expect(updateResponse.data.account.id).toBe(firstAccount.id);
      expect(updateResponse.data.account.status).toBe(newStatus);
    });
  });

  describe('Error Handling e Delay', () => {
    it('deve simular erros quando o parâmetro mockError é true', async () => {
      // Tenta fazer uma requisição com mockError=true
      try {
        await axios.get('/api/dashboard/status?mockError=true');
        // Se chegar aqui, o teste falha porque deveria lançar um erro
        expect('não deveria chegar aqui').toBe(false);
      } catch (error) {
        // Verifica se o erro é do tipo esperado
        expect(error.response.status).toBe(500);
        expect(error.response.data).toHaveProperty('error');
      }
    });
    
    it('deve respeitar o parâmetro mockDelay', async () => {
      // Configura o timer
      vi.useFakeTimers();
      
      // Inicia uma requisição com delay de 500ms
      const requestPromise = axios.get('/api/dashboard/status?mockDelay=500');
      
      // Avança o tempo em 400ms (não deve ter completado ainda)
      vi.advanceTimersByTime(400);
      
      // Verifica se a requisição ainda está pendente
      let completed = false;
      requestPromise.then(() => { completed = true; });
      await Promise.resolve();  // dá uma chance para promessas completarem
      expect(completed).toBe(false);
      
      // Avança mais 200ms (deve completar)
      vi.advanceTimersByTime(200);
      
      // Aguarda a requisição completar
      await requestPromise;
      
      // Restaura timers
      vi.useRealTimers();
    });
  });
});
