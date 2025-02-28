import React from 'react';
import PropTypes from 'prop-types';
import { useApiStatus } from '../../hooks/useApiStatus';

/**
 * Component that displays the current system status
 * @param {Object} props Component props
 * @param {number} [props.checkInterval=60000] Interval in ms to check system status
 * @param {boolean} [props.checkOnLoad=true] Whether to check status on component load
 * @param {boolean} [props.showLatency=false] Whether to display latency information
 * @returns {JSX.Element} The system status indicator component
 */
function SystemStatusIndicator({ 
  checkInterval = 60000, 
  checkOnLoad = true,
  showLatency = false
}) {
  const { status, latency, lastChecked, error, checkApiStatus } = useApiStatus({
    checkInterval,
    checkOnLoad
  });

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Sistema Online';
      case 'degraded':
        return 'Sistema Lento';
      case 'offline':
        return 'Sistema Offline';
      default:
        return 'Verificando...';
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'Nunca';
    
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(dateTime);
  };

  return (
    <div className="system-status-indicator py-2 px-4 rounded-md bg-gray-100 shadow-sm">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="ml-2 font-medium">{getStatusLabel()}</span>
        
        {showLatency && status !== 'checking' && status !== 'offline' && (
          <span className="ml-2 text-xs text-gray-500">
            ({latency}ms)
          </span>
        )}
        
        <button 
          className="ml-auto text-blue-600 text-sm hover:underline flex items-center"
          onClick={checkApiStatus}
          data-testid="refresh-status-btn"
        >
          <svg 
            className="w-4 h-4 mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Atualizar
        </button>
      </div>
      
      {lastChecked && (
        <div className="text-xs text-gray-500 mt-1">
          Última verificação: {formatTime(lastChecked)}
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-500 mt-1" data-testid="status-error">
          Erro: {error.message || 'Erro desconhecido'}
        </div>
      )}
    </div>
  );
}

SystemStatusIndicator.propTypes = {
  checkInterval: PropTypes.number,
  checkOnLoad: PropTypes.bool,
  showLatency: PropTypes.bool
};

export default SystemStatusIndicator;
