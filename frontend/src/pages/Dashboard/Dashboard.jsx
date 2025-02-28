import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import SidebarLayout from '../../components/layout/SidebarLayout';
import Button from '../../components/ui/Button';
import Analytics from '../../components/dashboard/Analytics';
import ActivityLog from '../../components/dashboard/ActivityLog';
import SystemStatus from '../../components/dashboard/SystemStatus';
import { getAccounts as getWhatsAppAccounts } from '../../services/whatsappService';
import { getAccounts as getInstagramAccounts } from '../../services/instagramService';
import { getConversations } from '../../services/messagesService';

/**
 * Dashboard component
 */
const Dashboard = () => {
  const [totalMessages, setTotalMessages] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch WhatsApp accounts
  const { 
    data: whatsappAccounts,
    isLoading: isLoadingWhatsApp,
  } = useQuery('whatsappAccounts', getWhatsAppAccounts, {
    staleTime: 300000, // 5 minutes
    onError: (err) => console.error('Error fetching WhatsApp accounts:', err)
  });

  // Fetch Instagram accounts
  const { 
    data: instagramAccounts,
    isLoading: isLoadingInstagram,
  } = useQuery('instagramAccounts', getInstagramAccounts, {
    staleTime: 300000, // 5 minutes
    onError: (err) => console.error('Error fetching Instagram accounts:', err)
  });

  // Fetch recent conversations
  const { 
    data: recentConversations,
    isLoading: isLoadingConversations,
  } = useQuery('recentConversations', () => getConversations({ limit: 5, orderBy: 'updatedAt', order: 'DESC' }), {
    staleTime: 60000, // 1 minute
    onError: (err) => console.error('Error fetching recent conversations:', err)
  });

  // Calculate stats
  useEffect(() => {
    if (recentConversations) {
      // Count total and unread messages from all conversations (backend would normally provide this)
      let totalCount = 0;
      let unreadCount = 0;
      
      recentConversations.forEach(conversation => {
        if (conversation.messagesCount) {
          totalCount += conversation.messagesCount;
        }
        
        if (conversation.unreadCount) {
          unreadCount += conversation.unreadCount;
        }
      });
      
      setTotalMessages(totalCount);
      setUnreadMessages(unreadCount);
    }
  }, [recentConversations]);

  // Get WhatsApp connection status
  const getWhatsAppStatusSummary = () => {
    if (!whatsappAccounts) return { connected: 0, total: 0 };
    
    const connected = whatsappAccounts.filter(acc => acc.status === 'CONNECTED').length;
    return { connected, total: whatsappAccounts.length };
  };

  // Get Instagram connection status
  const getInstagramStatusSummary = () => {
    if (!instagramAccounts) return { connected: 0, total: 0 };
    
    const connected = instagramAccounts.filter(acc => acc.status === 'CONNECTED').length;
    return { connected, total: instagramAccounts.length };
  };

  // Stats
  const { connected: connectedWhatsApp, total: totalWhatsApp } = getWhatsAppStatusSummary();
  const { connected: connectedInstagram, total: totalInstagram } = getInstagramStatusSummary();
  
  const stats = [
    { name: 'Contas WhatsApp', stat: `${connectedWhatsApp}/${totalWhatsApp} conectadas`, color: 'bg-green-100 text-green-800' },
    { name: 'Contas Instagram', stat: `${connectedInstagram}/${totalInstagram} conectadas`, color: 'bg-blue-100 text-blue-800' },
    { name: 'Mensagens Totais', stat: totalMessages, color: 'bg-purple-100 text-purple-800' },
    { name: 'Mensagens Não Lidas', stat: unreadMessages, color: 'bg-yellow-100 text-yellow-800' },
  ];

  return (
    <SidebarLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Visão geral da plataforma de comunicação.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.name}
                className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:pt-6"
              >
                <dt>
                  <p className="truncate text-sm font-medium text-gray-500">
                    {item.name}
                  </p>
                </dt>
                <dd className="mt-1">
                  <p className={`truncate text-3xl font-semibold ${item.color.includes('bg-') ? 'text-gray-900' : item.color}`}>
                    {item.stat}
                  </p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.color} mt-2`}>
                    {item.name}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Account Sections */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* WhatsApp Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Contas WhatsApp</h2>
              <Link to="/whatsapp">
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </div>
            
            {isLoadingWhatsApp ? (
              <div className="flex justify-center items-center h-24">
                <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : !whatsappAccounts || whatsappAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24">
                <p className="text-gray-500 mb-2">Nenhuma conta WhatsApp encontrada</p>
                <Link to="/whatsapp">
                  <Button variant="primary" size="sm">
                    Adicionar Conta
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {whatsappAccounts.slice(0, 3).map((account) => (
                  <li key={account.id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${account.status === 'CONNECTED' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${account.status === 'CONNECTED' ? 'text-green-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{account.name || account.phoneNumber}</p>
                        <p className="text-xs text-gray-500">
                          {account.status === 'CONNECTED' ? (
                            <span className="text-green-600">Conectado</span>
                          ) : (
                            <span className="text-red-600">{account.status}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Link to={`/whatsapp/account/${account.id}`}>
                      <Button variant="text" size="sm">
                        Detalhes
                      </Button>
                    </Link>
                  </li>
                ))}
                {whatsappAccounts.length > 3 && (
                  <li className="py-3 text-center">
                    <Link to="/whatsapp" className="text-sm text-indigo-600 hover:text-indigo-800">
                      Ver mais {whatsappAccounts.length - 3} contas
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Instagram Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Contas Instagram</h2>
              <Link to="/instagram">
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </div>
            
            {isLoadingInstagram ? (
              <div className="flex justify-center items-center h-24">
                <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : !instagramAccounts || instagramAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24">
                <p className="text-gray-500 mb-2">Nenhuma conta Instagram encontrada</p>
                <Link to="/instagram">
                  <Button variant="primary" size="sm">
                    Adicionar Conta
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {instagramAccounts.slice(0, 3).map((account) => (
                  <li key={account.id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${account.status === 'CONNECTED' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${account.status === 'CONNECTED' ? 'text-green-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{account.username}</p>
                        <p className="text-xs text-gray-500">
                          {account.status === 'CONNECTED' ? (
                            <span className="text-green-600">Conectado</span>
                          ) : (
                            <span className="text-red-600">{account.status}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Link to={`/instagram/account/${account.id}`}>
                      <Button variant="text" size="sm">
                        Detalhes
                      </Button>
                    </Link>
                  </li>
                ))}
                {instagramAccounts.length > 3 && (
                  <li className="py-3 text-center">
                    <Link to="/instagram" className="text-sm text-indigo-600 hover:text-indigo-800">
                      Ver mais {instagramAccounts.length - 3} contas
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Conversas Recentes</h2>
            <Link to="/conversations">
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {isLoadingConversations ? (
              <div className="flex justify-center items-center h-24">
                <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : !recentConversations || recentConversations.length === 0 ? (
              <div className="flex justify-center items-center h-24 text-gray-500">
                Nenhuma conversa recente encontrada
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentConversations.map((conversation) => (
                  <li key={conversation.id} className="px-6 py-4 hover:bg-gray-50">
                    <Link to={`/conversations/${conversation.id}`} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            conversation.platform === 'whatsapp' ? 'bg-green-100' : 'bg-purple-100'
                          }`}>
                            {conversation.platform === 'whatsapp' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {conversation.contactName || conversation.contactNumber || 'Contato'}
                            {conversation.unreadCount > 0 && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage && conversation.lastMessage.length > 50
                              ? `${conversation.lastMessage.substring(0, 50)}...`
                              : conversation.lastMessage || 'Sem mensagens'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500">
                          {conversation.updatedAt
                            ? new Date(conversation.updatedAt).toLocaleDateString()
                            : ''}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            conversation.platform === 'whatsapp'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {conversation.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Analytics and Activity Log */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Analytics 
              whatsappAccounts={whatsappAccounts}
              instagramAccounts={instagramAccounts}
              conversations={recentConversations}
            />
          </div>
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <ActivityLog limit={10} />
              <SystemStatus />
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;
