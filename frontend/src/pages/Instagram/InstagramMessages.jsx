import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import instagramService from '../../services/instagramService';
import ConversationsContainer from '../../components/messages/ConversationsContainer';
import Button from '../../components/ui/Button';

/**
 * Instagram Messages page to display and interact with Instagram conversations
 */
const InstagramMessages = () => {
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Fetch Instagram accounts
  const { 
    data: accounts, 
    isLoading, 
    error 
  } = useQuery('instagram-accounts', instagramService.getAccounts);

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
    navigate('/instagram/accounts');
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
          <p className="text-gray-500 mb-4">{error.message || 'Ocorreu um erro desconhecido ao carregar as contas do Instagram.'}</p>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma conta do Instagram encontrada</h3>
          <p className="text-gray-500 mb-4">Para começar a usar o Instagram, você precisa adicionar uma conta.</p>
          <Button
            variant="primary"
            onClick={handleAddAccount}
          >
            Adicionar conta do Instagram
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
                {account.username}
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
            platform="instagram"
            accountId={selectedAccountId}
          />
        </div>
      )}
    </div>
  );
};

export default InstagramMessages;
