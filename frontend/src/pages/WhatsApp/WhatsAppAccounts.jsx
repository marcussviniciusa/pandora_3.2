import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import SidebarLayout from '../../components/layout/SidebarLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getAccounts, createAccount, removeAccount, reconnect, getQRCode } from '../../services/whatsappService';

/**
 * WhatsApp accounts management page
 */
const WhatsAppAccounts = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [qrCodeSrc, setQrCodeSrc] = useState(null);
  const queryClient = useQueryClient();

  // Fetch WhatsApp accounts
  const { data: accounts, isLoading, isError, error } = useQuery(
    'whatsappAccounts', 
    getAccounts,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      onError: (err) => {
        console.error('Error fetching accounts:', err);
      }
    }
  );

  // Create account mutation
  const createAccountMutation = useMutation(createAccount, {
    onSuccess: () => {
      toast.success('Conta WhatsApp criada com sucesso!');
      setPhoneNumber('');
      setCreatingAccount(false);
      queryClient.invalidateQueries('whatsappAccounts');
    },
    onError: (err) => {
      toast.error('Erro ao criar conta WhatsApp');
      console.error('Error creating account:', err);
    }
  });

  // Remove account mutation
  const removeAccountMutation = useMutation(removeAccount, {
    onSuccess: () => {
      toast.success('Conta WhatsApp removida com sucesso!');
      queryClient.invalidateQueries('whatsappAccounts');
    },
    onError: (err) => {
      toast.error('Erro ao remover conta WhatsApp');
      console.error('Error removing account:', err);
    }
  });

  // Reconnect account mutation
  const reconnectMutation = useMutation(reconnect, {
    onSuccess: () => {
      toast.success('Reconexão iniciada com sucesso!');
      queryClient.invalidateQueries('whatsappAccounts');
    },
    onError: (err) => {
      toast.error('Erro ao reconectar conta WhatsApp');
      console.error('Error reconnecting account:', err);
    }
  });

  // Get QR code mutation
  const getQRCodeMutation = useMutation(getQRCode, {
    onSuccess: (data) => {
      if (data.qrCode) {
        setQrCodeSrc(data.qrCode);
      } else {
        toast.error('QR Code não disponível');
      }
    },
    onError: (err) => {
      toast.error('Erro ao obter QR Code');
      console.error('Error getting QR code:', err);
    }
  });

  // Handle account creation
  const handleCreateAccount = (e) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error('Por favor, insira um número de telefone');
      return;
    }
    
    createAccountMutation.mutate(phoneNumber);
  };

  // Handle account removal
  const handleRemoveAccount = (accountId) => {
    if (window.confirm('Tem certeza que deseja remover esta conta?')) {
      removeAccountMutation.mutate(accountId);
    }
  };

  // Handle account reconnection
  const handleReconnect = (accountId) => {
    reconnectMutation.mutate(accountId);
  };

  // Handle QR code request
  const handleGetQRCode = (accountId) => {
    setSelectedAccountId(accountId);
    getQRCodeMutation.mutate(accountId);
  };

  // Close QR code modal
  const closeQRModal = () => {
    setQrCodeSrc(null);
    setSelectedAccountId(null);
  };

  // Format status text and color
  const getStatusDisplay = (status) => {
    const statusMap = {
      CONNECTED: { text: 'Conectado', color: 'text-green-600', bgColor: 'bg-green-100' },
      DISCONNECTED: { text: 'Desconectado', color: 'text-red-600', bgColor: 'bg-red-100' },
      CONNECTING: { text: 'Conectando', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      AUTHENTICATING: { text: 'Autenticando', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      INITIALIZING: { text: 'Inicializando', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      QR_READY: { text: 'QR Code Pronto', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
      ERROR: { text: 'Erro', color: 'text-red-600', bgColor: 'bg-red-100' },
    };
    
    return statusMap[status] || { text: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  return (
    <SidebarLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Contas WhatsApp</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gerencie suas contas WhatsApp para enviar e receber mensagens.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Button
              onClick={() => setCreatingAccount(!creatingAccount)}
            >
              {creatingAccount ? 'Cancelar' : 'Adicionar Conta'}
            </Button>
          </div>
        </div>

        {/* Account creation form */}
        {creatingAccount && (
          <div className="mt-6 p-4 bg-white shadow rounded-lg">
            <h2 className="text-lg font-medium text-gray-900">Nova Conta WhatsApp</h2>
            <form onSubmit={handleCreateAccount} className="mt-4 space-y-4 max-w-md">
              <Input
                label="Número de Telefone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 5511999999999"
                helperText="Inclua o código do país e DDD, sem espaços ou outros caracteres"
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCreatingAccount(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={createAccountMutation.isLoading}
                  disabled={createAccountMutation.isLoading || !phoneNumber}
                >
                  Adicionar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                {isLoading ? (
                  <div className="flex justify-center items-center h-24 bg-white">
                    <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : isError ? (
                  <div className="flex justify-center items-center h-24 bg-white">
                    <p className="text-red-500">Erro ao carregar contas: {error?.message || 'Erro desconhecido'}</p>
                  </div>
                ) : accounts?.length === 0 ? (
                  <div className="flex justify-center items-center h-24 bg-white">
                    <p className="text-gray-500">Nenhuma conta WhatsApp encontrada.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Telefone</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nome</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Última Conexão</th>
                        <th scope="col" className="relative px-3 py-3.5">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {accounts?.map((account) => {
                        const { text: statusText, color: statusColor, bgColor: statusBgColor } = getStatusDisplay(account.status);
                        
                        return (
                          <tr key={account.id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{account.phoneNumber}</td>
                            <td className="px-3 py-4 text-sm text-gray-500">{account.name || '-'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColor} ${statusBgColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {account.lastConnection 
                                ? new Date(account.lastConnection).toLocaleString() 
                                : 'Nunca conectado'}
                            </td>
                            <td className="relative whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                {account.status === 'QR_READY' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGetQRCode(account.id)}
                                  >
                                    QR Code
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReconnect(account.id)}
                                  loading={reconnectMutation.isLoading && reconnectMutation.variables === account.id}
                                >
                                  Reconectar
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRemoveAccount(account.id)}
                                  loading={removeAccountMutation.isLoading && removeAccountMutation.variables === account.id}
                                >
                                  Remover
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrCodeSrc && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeQRModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Escaneie o QR Code
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Abra o WhatsApp no seu telefone e escaneie o QR Code para conectar.
                    </p>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <img src={qrCodeSrc} alt="WhatsApp QR Code" className="w-64 h-64" />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <Button
                  variant="outline"
                  onClick={closeQRModal}
                  fullWidth
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default WhatsAppAccounts;
