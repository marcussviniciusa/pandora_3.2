import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import instagramService from '../../services/instagramService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/**
 * Instagram Accounts Management Component
 */
const InstagramAccounts = () => {
  const queryClient = useQueryClient();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    username: '',
    password: '',
    name: ''
  });
  const [formError, setFormError] = useState('');

  // Fetch Instagram accounts
  const { 
    data: accounts, 
    isLoading, 
    error 
  } = useQuery('instagram-accounts', instagramService.getAccounts);

  // Add account mutation
  const addAccountMutation = useMutation(
    (accountData) => instagramService.createAccount(accountData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('instagram-accounts');
        setShowAddAccount(false);
        setNewAccountData({ username: '', password: '', name: '' });
        setFormError('');
      },
      onError: (error) => {
        setFormError(error.message || 'Erro ao adicionar conta.');
      }
    }
  );

  // Remove account mutation
  const removeAccountMutation = useMutation(
    (accountId) => instagramService.removeAccount(accountId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('instagram-accounts');
      }
    }
  );

  // Reconnect account mutation
  const reconnectAccountMutation = useMutation(
    (accountId) => instagramService.reconnect(accountId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('instagram-accounts');
      }
    }
  );

  // Handle input change for new account form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccountData({ ...newAccountData, [name]: value });
  };

  // Handle form submission for new account
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!newAccountData.username.trim() || !newAccountData.password.trim()) {
      setFormError('Nome de usuário e senha são obrigatórios.');
      return;
    }

    // Submit form
    addAccountMutation.mutate(newAccountData);
  };

  // Handle remove account
  const handleRemoveAccount = (accountId) => {
    if (window.confirm('Tem certeza que deseja remover esta conta? Esta ação não pode ser desfeita.')) {
      removeAccountMutation.mutate(accountId);
    }
  };

  // Handle reconnect account
  const handleReconnect = (accountId) => {
    reconnectAccountMutation.mutate(accountId);
  };

  // Render account status badge
  const renderStatusBadge = (status) => {
    let badgeClass = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch(status) {
      case 'CONNECTED':
        badgeClass += ' bg-green-100 text-green-800';
        return <span className={badgeClass}>Conectado</span>;
      case 'DISCONNECTED':
        badgeClass += ' bg-red-100 text-red-800';
        return <span className={badgeClass}>Desconectado</span>;
      case 'CONNECTING':
        badgeClass += ' bg-yellow-100 text-yellow-800';
        return <span className={badgeClass}>Conectando...</span>;
      default:
        badgeClass += ' bg-gray-100 text-gray-800';
        return <span className={badgeClass}>{status || 'Desconhecido'}</span>;
    }
  };

  // If accounts are loading, show loading indicator
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Contas do Instagram</h1>
        <Button
          variant="primary"
          onClick={() => setShowAddAccount(!showAddAccount)}
        >
          {showAddAccount ? 'Cancelar' : 'Adicionar Conta'}
        </Button>
      </div>

      {/* Error message if accounts failed to load */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          Erro ao carregar contas: {error.message || 'Ocorreu um erro desconhecido'}
        </div>
      )}

      {/* Add account form */}
      {showAddAccount && (
        <div className="bg-white border rounded-md p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Adicionar nova conta</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Input
                  label="Nome de usuário"
                  name="username"
                  value={newAccountData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Input
                  label="Senha"
                  name="password"
                  type="password"
                  value={newAccountData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Input
                  label="Nome da conta (opcional)"
                  name="name"
                  value={newAccountData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Instagram da empresa"
                />
              </div>
            </div>
            
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={addAccountMutation.isLoading}
                disabled={addAccountMutation.isLoading}
              >
                Adicionar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts list */}
      <div className="bg-white border rounded-md shadow-sm overflow-hidden">
        {accounts?.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhuma conta do Instagram adicionada. Clique em "Adicionar Conta" para começar.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Atualização
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts?.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {account.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">
                      {account.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(account.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {account.updatedAt 
                      ? new Date(account.updatedAt).toLocaleString() 
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      {account.status !== 'CONNECTED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReconnect(account.id)}
                          isLoading={reconnectAccountMutation.isLoading && reconnectAccountMutation.variables === account.id}
                          disabled={reconnectAccountMutation.isLoading && reconnectAccountMutation.variables === account.id}
                        >
                          Reconectar
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        isLoading={removeAccountMutation.isLoading && removeAccountMutation.variables === account.id}
                        disabled={removeAccountMutation.isLoading && removeAccountMutation.variables === account.id}
                      >
                        Remover
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InstagramAccounts;
