import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

/**
 * Hook para gerenciar as contas conectadas
 * @param {Object} options - Opções de configuração
 * @param {string} options.platform - Filtrar por plataforma ('whatsapp', 'instagram', 'all')
 * @param {string} options.status - Filtrar por status ('connected', 'disconnected', 'all')
 * @param {number} options.limit - Limite de itens por página
 * @returns {Object} Estado e funções para gerenciar contas
 */
export function useAccounts({ platform = 'all', status, limit = 10 } = {}) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    pages: 0,
    hasMore: false
  });
  
  const { socket } = useSocket();
  
  // Função para buscar contas da API
  const fetchAccounts = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      // Constrói a query string com os parâmetros
      const params = new URLSearchParams();
      if (platform && platform !== 'all') params.append('platform', platform);
      if (status && status !== 'all') params.append('status', status);
      params.append('page', page);
      params.append('limit', limit);
      
      const response = await axios.get(`${API_URL}/accounts?${params.toString()}`);
      
      setAccounts(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Erro ao buscar contas:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [platform, status, limit]);
  
  // Busca inicial de contas
  useEffect(() => {
    fetchAccounts(1);
  }, [fetchAccounts]);
  
  // Escuta eventos de socket para atualizações de contas
  useEffect(() => {
    if (!socket) return;
    
    const handleAccountUpdate = (updatedAccount) => {
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === updatedAccount.id ? { ...account, ...updatedAccount } : account
        )
      );
    };
    
    const handleAccountStatusChange = ({ id, status }) => {
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === id ? { ...account, status } : account
        )
      );
    };
    
    socket.on('account:update', handleAccountUpdate);
    socket.on('account:status', handleAccountStatusChange);
    
    return () => {
      socket.off('account:update', handleAccountUpdate);
      socket.off('account:status', handleAccountStatusChange);
    };
  }, [socket]);
  
  // Função para mudar a página
  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return;
    fetchAccounts(page);
  };
  
  // Função para atualizar o status de uma conta
  const updateAccountStatus = useCallback(async (accountId, newStatus) => {
    setError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.patch(`${API_URL}/accounts/${accountId}/status`, { status: newStatus });
      
      // Atualiza localmente a conta
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === accountId ? { ...account, status: newStatus } : account
        )
      );
      
      return true;
    } catch (err) {
      console.error(`Erro ao atualizar status da conta ${accountId}:`, err);
      setError(err);
      return false;
    }
  }, []);
  
  return {
    accounts,
    loading,
    error,
    pagination,
    goToPage,
    updateAccountStatus,
    refetch: fetchAccounts
  };
}
