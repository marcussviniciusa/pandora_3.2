import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import whatsappService from '../../services/whatsappService';
import ConversationsContainer from '../../components/messages/ConversationsContainer';
import Button from '../../components/ui/Button';
import messagesService from '../../services/messagesService';

/**
 * WhatsApp Messages page to display and interact with WhatsApp conversations
 */
const WhatsAppMessages = () => {
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Fetch WhatsApp accounts
  const { 
    data: accounts, 
    isLoading: accountsLoading, 
    error: accountsError 
  } = useQuery('whatsapp-accounts', whatsappService.getAccounts);

  // Fetch conversations for the selected account
  const {
    data: conversations,
    isLoading: conversationsLoading,
    error: conversationsError
  } = useQuery(
    ['conversations', 'whatsapp', selectedAccountId],
    () => messagesService.getConversations({ 
      platform: 'whatsapp',
      accountId: selectedAccountId 
    }),
    {
      enabled: !!selectedAccountId,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  // Set first available account as selected on initial load
  useEffect(() => {
    if (accounts?.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Handle account selection
  const handleAccountChange = (e) => {
    setSelectedAccountId(e.target.value);
  };

  // Handle add account button click
  const handleAddAccount = () => {
    navigate('/whatsapp/accounts');
  };

  // If accounts are loading, show loading indicator
  if (accountsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If there's an error loading accounts, show error message
  if (accountsError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-lg p-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Erro ao carregar contas</h3>
          <p className="text-gray-500 mb-4">{accountsError.message || 'Ocorreu um erro desconhecido ao carregar as contas do WhatsApp.'}</p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // If no accounts exist, prompt to create one
  if (!accounts?.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-lg p-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma conta do WhatsApp encontrada</h3>
          <p className="text-gray-500 mb-4">Para começar a usar o WhatsApp, você precisa adicionar uma conta.</p>
          <Button
            variant="primary"
            onClick={handleAddAccount}
          >
            Adicionar conta do WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Account selector */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium text-gray-700 mr-2">Conta:</span>
          <select
            className="border border-gray-300 rounded-md py-1 px-3 focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedAccountId}
            onChange={handleAccountChange}
          >
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name || account.phoneNumber}
                {account.status !== 'CONNECTED' && ' (Desconectado)'}
              </option>
            ))}
          </select>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddAccount}
        >
          Gerenciar contas
        </Button>
      </div>
      
      {/* Conversations container */}
      {selectedAccountId && (
        <div className="flex-1 overflow-hidden">
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <svg className="animate-spin h-10 w-10 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-gray-600">Carregando conversas...</p>
              </div>
            </div>
          ) : conversationsError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4 max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar conversas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {conversationsError?.message || 'Ocorreu um erro ao carregar as conversas do WhatsApp.'}
                </p>
                <button
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : (
            <ConversationsContainer
              platform="whatsapp"
              accountId={selectedAccountId}
              conversations={conversations}
              isLoading={conversationsLoading}
              error={conversationsError}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessages;
