import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import whatsappService from '../../services/whatsappService';
import ConversationsContainer from '../../components/messages/ConversationsContainer';
import Button from '../../components/ui/Button';

/**
 * WhatsApp Messages page to display and interact with WhatsApp conversations
 */
const WhatsAppMessages = () => {
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Fetch WhatsApp accounts
  const { 
    data: accounts, 
    isLoading, 
    error 
  } = useQuery('whatsapp-accounts', whatsappService.getAccounts);

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
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If there's an error loading accounts, show error message
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-lg p-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Erro ao carregar contas</h3>
          <p className="text-gray-500 mb-4">{error.message || 'Ocorreu um erro desconhecido ao carregar as contas do WhatsApp.'}</p>
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
          <ConversationsContainer
            platform="whatsapp"
            accountId={selectedAccountId}
          />
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessages;
