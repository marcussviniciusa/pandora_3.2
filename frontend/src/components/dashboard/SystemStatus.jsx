import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { mockSystemStatus } from '../../mocks/mockData';
import { dashboardService } from '../../services/api';

/**
 * Component to display system status information
 */
const SystemStatus = () => {
  const { connected, socket } = useSocket();
  const [systemStatus, setSystemStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Function to fetch system status
    const fetchSystemStatus = async () => {
      setLoading(true);
      try {
        // Em ambiente de desenvolvimento, use os dados mockados
        if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
          setSystemStatus(mockSystemStatus);
        } else {
          // Get real system status from API
          const data = await dashboardService.getSystemStatus();
          setSystemStatus(data);
        }
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Error fetching system status:', err);
        setError('Não foi possível carregar o status do sistema');
        // Fallback to mock data in case of error
        if (import.meta.env.DEV) {
          setSystemStatus(mockSystemStatus);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSystemStatus();
    
    // Setup socket listener for real-time updates
    if (connected && socket) {
      socket.on('system_status_update', (data) => {
        setSystemStatus(data);
        setLastUpdated(new Date());
      });
    }
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      if (connected && socket) {
        socket.off('system_status_update');
      }
    };
  }, [connected, socket]);

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'major_outage':
        return 'bg-red-100 text-red-800';
      case 'partial_outage':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Status do Sistema</h3>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Status do Sistema</h3>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium text-gray-900">Status do Sistema</h3>
        <span className="text-xs text-gray-500">
          Atualizado: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
        </span>
      </div>
      
      <div className="mb-4">
        <div className={`px-2.5 py-1 rounded-md text-sm font-medium inline-block ${getStatusBadge(systemStatus.status)}`}>
          Status Geral: {systemStatus.status === 'operational' ? 'Todos os Sistemas Operacionais' : 'Problemas Detectados'}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Plataformas</h4>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.6 6.31a7.885 7.885 0 0 0-5.611-2.329c-4.366 0-7.926 3.56-7.976 7.926 0 1.394.366 2.787 1.097 3.99L4 20l4.232-1.098a7.9 7.9 0 0 0 3.768.976h.004c4.366 0 7.93-3.56 7.98-7.926a7.91 7.91 0 0 0-2.384-5.643zm-5.607 12.2h-.003a6.57 6.57 0 0 1-3.354-.92l-.24-.145-2.492.653.666-2.431-.156-.25a6.588 6.588 0 0 1-1.012-3.49c0-3.634 2.956-6.586 6.59-6.586 1.76 0 3.414.685 4.66 1.93a6.578 6.578 0 0 1 1.928 4.66c-.004 3.639-2.956 6.59-6.586 6.59zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.1-.133.197-.513.646-.627.775-.116.133-.231.15-.43.05-.197-.099-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.115.133-.198.2-.33.065-.134.034-.248-.018-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">WhatsApp</span>
                  <span className={`text-xs ${getStatusBadge(systemStatus.whatsapp.status)}`}>
                    {systemStatus.whatsapp.status === 'operational' ? 'Operacional' : 'Com problemas'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{systemStatus.whatsapp.message}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Instagram</span>
                  <span className={`text-xs ${getStatusBadge(systemStatus.instagram.status)}`}>
                    {systemStatus.instagram.status === 'operational' ? 'Operacional' : 'Com problemas'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{systemStatus.instagram.message}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700">Infraestrutura</h4>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">API</span>
                  <span className={`text-xs ${getStatusBadge(systemStatus.api.status)}`}>
                    {systemStatus.api.status === 'operational' ? 'Operacional' : 'Com problemas'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{systemStatus.api.message}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Banco de Dados</span>
                  <span className={`text-xs ${getStatusBadge(systemStatus.database.status)}`}>
                    {systemStatus.database.status === 'operational' ? 'Operacional' : 'Com problemas'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{systemStatus.database.message}</p>
              </div>
            </div>
          </div>
        </div>
        
        {connected ? (
          <div className="px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm mt-2">
            Conexão de socket ativa e funcionando corretamente
          </div>
        ) : (
          <div className="px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm mt-2">
            Conexão de socket inativa - tentando reconectar...
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemStatus;
