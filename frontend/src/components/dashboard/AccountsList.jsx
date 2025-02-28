import React, { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ApiErrorNotification from '../common/ApiErrorNotification';

/**
 * Componente para exibir a lista de contas conectadas no dashboard
 */
const AccountsList = () => {
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { 
    accounts, 
    loading, 
    error, 
    pagination, 
    goToPage,
    updateAccountStatus,
    refetch
  } = useAccounts({
    platform: platformFilter,
    status: statusFilter,
    limit: 5
  });
  
  // Função para renderizar o ícone da plataforma
  const renderPlatformIcon = (platform) => {
    if (platform === 'whatsapp') {
      return (
        <span className="inline-flex items-center justify-center bg-green-100 rounded-full w-8 h-8 text-green-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </span>
      );
    } else if (platform === 'instagram') {
      return (
        <span className="inline-flex items-center justify-center bg-purple-100 rounded-full w-8 h-8 text-purple-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
          </svg>
        </span>
      );
    }
    
    return null;
  };
  
  // Função para renderizar o status da conta
  const renderStatus = (status) => {
    const statusMap = {
      'connected': { color: 'text-green-700 bg-green-100', label: 'Conectada' },
      'disconnected': { color: 'text-gray-700 bg-gray-100', label: 'Desconectada' },
      'connecting': { color: 'text-yellow-700 bg-yellow-100', label: 'Conectando' },
      'error': { color: 'text-red-700 bg-red-100', label: 'Erro' },
    };
    
    const statusInfo = statusMap[status] || statusMap.disconnected;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };
  
  // Renderiza o ação para a conta
  const renderActions = (account) => {
    if (account.status === 'connected') {
      return (
        <button
          onClick={() => updateAccountStatus(account.id, 'disconnected')}
          className="text-xs text-red-600 hover:text-red-800 font-medium"
        >
          Desconectar
        </button>
      );
    }
    
    if (account.status === 'disconnected' || account.status === 'error') {
      return (
        <button
          onClick={() => updateAccountStatus(account.id, 'connecting')}
          className="text-xs text-green-600 hover:text-green-800 font-medium"
        >
          Conectar
        </button>
      );
    }
    
    return (
      <button
        disabled
        className="text-xs text-gray-400 cursor-not-allowed font-medium"
      >
        Aguarde...
      </button>
    );
  };
  
  // Renderiza os controles de paginação
  const renderPagination = () => {
    if (accounts.length === 0 || pagination.pages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4 text-sm">
        <button
          onClick={() => goToPage(pagination.page - 1)}
          disabled={pagination.page === 1}
          className={`px-2 py-1 rounded ${pagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
        >
          Anterior
        </button>
        
        <span className="text-gray-600">
          Página {pagination.page} de {pagination.pages}
        </span>
        
        <button
          onClick={() => goToPage(pagination.page + 1)}
          disabled={!pagination.hasMore}
          className={`px-2 py-1 rounded ${!pagination.hasMore ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
        >
          Próxima
        </button>
      </div>
    );
  };
  
  if (loading && accounts.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Contas Conectadas</h2>
        
        <div className="flex space-x-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs rounded border-gray-300 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas Plataformas</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded border-gray-300 py-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos Status</option>
            <option value="connected">Conectadas</option>
            <option value="disconnected">Desconectadas</option>
            <option value="error">Com Erro</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="mb-4">
          <ApiErrorNotification 
            error={error} 
            onRetry={refetch}
          />
        </div>
      )}
      
      {accounts.length === 0 ? (
        <div className="py-6 text-center text-gray-500">
          <p>Nenhuma conta encontrada com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {accounts.map(account => (
            <div key={account.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center">
                {renderPlatformIcon(account.platform)}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {account.platform === 'whatsapp' ? account.phoneNumber : account.username}
                  </p>
                  <p className="text-xs text-gray-500">{account.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {renderStatus(account.status)}
                <div className="text-xs text-gray-500">
                  {format(new Date(account.updatedAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                </div>
                {renderActions(account)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {renderPagination()}
    </div>
  );
};

export default AccountsList;
