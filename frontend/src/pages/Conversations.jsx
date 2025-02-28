import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import SidebarLayout from '../components/layout/SidebarLayout';
import ConversationsContainer from '../components/messages/ConversationsContainer';
import messagesService from '../services/messagesService';
import whatsappService from '../services/whatsappService';
import instagramService from '../services/instagramService';

/**
 * Conversations page component
 * Shows all conversations across platforms or filtered by platform and account
 */
const Conversations = () => {
  // Get route parameters for platform and account filtering
  const { platform, accountId } = useParams();
  const navigate = useNavigate();

  // State for managing the current account
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentPlatform, setCurrentPlatform] = useState(platform || 'all');
  
  // Query for conversations with platform filter
  const conversationsQuery = useQuery(
    ['conversations', currentPlatform, accountId],
    () => {
      const filters = {};
      if (currentPlatform && currentPlatform !== 'all') {
        filters.platform = currentPlatform;
      }
      if (accountId) {
        filters.accountId = accountId;
      }
      return messagesService.getConversations(filters);
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Query for WhatsApp accounts
  const whatsappAccountsQuery = useQuery(
    'whatsapp-accounts',
    whatsappService.getAccounts,
    {
      enabled: !platform || platform === 'whatsapp',
    }
  );

  // Query for Instagram accounts
  const instagramAccountsQuery = useQuery(
    'instagram-accounts',
    instagramService.getAccounts,
    {
      enabled: !platform || platform === 'instagram',
    }
  );

  // Effect to set current account when account ID changes
  useEffect(() => {
    if (!accountId) {
      setCurrentAccount(null);
      return;
    }

    const findAccount = async () => {
      if (platform === 'whatsapp' && whatsappAccountsQuery.data) {
        const account = whatsappAccountsQuery.data.find(acc => acc.id === accountId);
        setCurrentAccount(account || null);
      } else if (platform === 'instagram' && instagramAccountsQuery.data) {
        const account = instagramAccountsQuery.data.find(acc => acc.id === accountId);
        setCurrentAccount(account || null);
      }
    };

    findAccount();
  }, [accountId, platform, whatsappAccountsQuery.data, instagramAccountsQuery.data]);

  // Get all available accounts from both platforms
  const getAllAccounts = () => {
    const whatsappAccounts = whatsappAccountsQuery.data || [];
    const instagramAccounts = instagramAccountsQuery.data || [];
    
    return [
      ...whatsappAccounts.map(acc => ({ ...acc, platform: 'whatsapp' })),
      ...instagramAccounts.map(acc => ({ ...acc, platform: 'instagram' }))
    ];
  };

  // Handle platform filter change
  const handlePlatformChange = (newPlatform) => {
    setCurrentPlatform(newPlatform);
    if (accountId) {
      if (newPlatform === 'all') {
        navigate('/conversations');
      } else {
        navigate(`/conversations/${newPlatform}`);
      }
    } else {
      if (newPlatform === 'all') {
        navigate('/conversations');
      } else {
        navigate(`/conversations/${newPlatform}`);
      }
    }
  };

  // Handle account filter change
  const handleAccountChange = (newAccountId, accountPlatform) => {
    if (!newAccountId) {
      if (currentPlatform === 'all') {
        navigate('/conversations');
      } else {
        navigate(`/conversations/${currentPlatform}`);
      }
    } else {
      navigate(`/conversations/${accountPlatform}/${newAccountId}`);
    }
  };

  // Loading state
  const isLoading = conversationsQuery.isLoading || 
    whatsappAccountsQuery.isLoading || 
    instagramAccountsQuery.isLoading;

  // Error state
  const hasError = conversationsQuery.isError || 
    whatsappAccountsQuery.isError || 
    instagramAccountsQuery.isError;

  return (
    <SidebarLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todas as suas conversas de diferentes plataformas
          </p>
        </div>

        {/* Platform and account filters */}
        <div className="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700">
              Plataforma
            </label>
            <select
              id="platform"
              name="platform"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={currentPlatform}
              onChange={(e) => handlePlatformChange(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700">
              Conta
            </label>
            <select
              id="account"
              name="account"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={accountId || ''}
              onChange={(e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const platform = selectedOption.getAttribute('data-platform');
                handleAccountChange(e.target.value || null, platform);
              }}
            >
              <option value="">Todas as contas</option>
              {getAllAccounts().map(account => (
                <option 
                  key={`${account.platform}-${account.id}`} 
                  value={account.id}
                  data-platform={account.platform}
                >
                  {account.platform === 'whatsapp' ? '📱 ' : '📷 '}
                  {account.name || account.username || account.phoneNumber || 'Conta sem nome'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversations container component */}
        <ConversationsContainer 
          conversations={conversationsQuery.data || []}
          isLoading={isLoading}
          error={hasError ? 'Erro ao carregar conversas' : null}
          platform={currentPlatform}
          accountId={accountId}
        />
      </div>
    </SidebarLayout>
  );
};

export default Conversations;
