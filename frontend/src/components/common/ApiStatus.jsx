import React from 'react';
import useApiStatus from '../../hooks/useApiStatus';

/**
 * Componente para exibir o status da API
 */
const ApiStatus = () => {
  const { apiStatus, loading } = useApiStatus();
  
  if (loading) {
    return (
      <div className="flex items-center space-x-1 text-xs text-gray-500">
        <div className="animate-pulse h-2 w-2 rounded-full bg-gray-400"></div>
        <span>Verificando API...</span>
      </div>
    );
  }
  
  // Seleciona a cor e o texto com base no status
  const getStatusProps = () => {
    switch (apiStatus.status) {
      case 'operational':
        return {
          color: 'bg-green-500',
          text: 'API Operacional'
        };
      case 'degraded':
        return {
          color: 'bg-yellow-500',
          text: 'API Lenta'
        };
      case 'partial_outage':
        return {
          color: 'bg-orange-500',
          text: 'API com Problemas'
        };
      case 'major_outage':
        return {
          color: 'bg-red-500',
          text: 'API Indisponível'
        };
      case 'error':
        return {
          color: 'bg-red-500',
          text: 'Erro de Conexão'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Status Desconhecido'
        };
    }
  };
  
  const { color, text } = getStatusProps();
  
  return (
    <div className="flex items-center space-x-1.5 text-xs text-gray-700">
      <div className={`h-2 w-2 rounded-full ${color}`}></div>
      <span>{text}</span>
      {apiStatus.responseTime && (
        <span className="text-gray-500">({apiStatus.responseTime}ms)</span>
      )}
    </div>
  );
};

export default ApiStatus;
