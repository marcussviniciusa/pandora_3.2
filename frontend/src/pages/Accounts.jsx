import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import SidebarLayout from '../components/layout/SidebarLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

// Mock API functions - Replace with actual API calls
const fetchAccounts = async () => {
  // Simulated API response
  return {
    whatsapp: [
      { id: 'wa1', name: 'Support WhatsApp', phone: '+5511998765432', status: 'active', messages: 245 },
      { id: 'wa2', name: 'Sales WhatsApp', phone: '+5511987654321', status: 'inactive', messages: 120 }
    ],
    instagram: [
      { id: 'ig1', name: 'Main Instagram', username: '@pandora_official', status: 'active', followers: 12500, messages: 340 },
      { id: 'ig2', name: 'Support Instagram', username: '@pandora_support', status: 'active', followers: 5200, messages: 180 }
    ]
  };
};

const addAccount = async (accountData) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  return { id: `new-${Date.now()}`, ...accountData };
};

const deleteAccount = async (id) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

const Accounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountType, setNewAccountType] = useState('whatsapp');
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    phone: '',
    username: ''
  });
  
  const { data: accounts, isLoading, error } = useQuery(
    'accounts',
    fetchAccounts,
    { staleTime: 300000 } // 5 minutes
  );
  
  const addMutation = useMutation(addAccount, {
    onSuccess: (data) => {
      queryClient.setQueryData('accounts', old => {
        const updated = { ...old };
        updated[newAccountType] = [...(updated[newAccountType] || []), data];
        return updated;
      });
      toast.success(`${newAccountType.charAt(0).toUpperCase() + newAccountType.slice(1)} account added successfully`);
      setIsAddingAccount(false);
      setNewAccountData({ name: '', phone: '', username: '' });
    },
    onError: () => {
      toast.error('Failed to add account');
    }
  });
  
  const deleteMutation = useMutation(deleteAccount, {
    onSuccess: (_, variables) => {
      const { id, platform } = variables;
      queryClient.setQueryData('accounts', old => {
        const updated = { ...old };
        updated[platform] = updated[platform].filter(account => account.id !== id);
        return updated;
      });
      toast.success('Account deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete account');
    }
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccountData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddAccount = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newAccountData.name) {
      toast.error('Account name is required');
      return;
    }
    
    if (newAccountType === 'whatsapp' && !newAccountData.phone) {
      toast.error('Phone number is required for WhatsApp accounts');
      return;
    }
    
    if (newAccountType === 'instagram' && !newAccountData.username) {
      toast.error('Username is required for Instagram accounts');
      return;
    }
    
    addMutation.mutate({
      ...newAccountData,
      status: 'active',
      messages: 0,
      ...(newAccountType === 'instagram' ? { followers: 0 } : {})
    });
  };
  
  const handleDeleteAccount = (id, platform) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteMutation.mutate({ id, platform });
    }
  };
  
  const renderAccountCard = (account, platform) => {
    return (
      <Card key={account.id} className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{account.name}</h3>
            {platform === 'whatsapp' ? (
              <p className="text-gray-600">{account.phone}</p>
            ) : (
              <p className="text-gray-600">{account.username}</p>
            )}
            <div className="mt-2 flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${account.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-gray-500 capitalize">{account.status}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
              title="Edit Account"
              onClick={() => toast.info('Edit functionality coming soon')}
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
              title="Delete Account"
              onClick={() => handleDeleteAccount(account.id, platform)}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-3 flex justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{account.messages}</span> messages
          </div>
          {platform === 'instagram' && (
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{account.followers.toLocaleString()}</span> followers
            </div>
          )}
        </div>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="p-4">
          <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </SidebarLayout>
    );
  }
  
  if (error) {
    return (
      <SidebarLayout>
        <div className="p-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h2 className="text-red-800 text-lg font-medium">Error loading accounts</h2>
            <p className="text-red-600 mt-1">Please try again later</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }
  
  return (
    <SidebarLayout>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <Button
            variant="primary"
            onClick={() => setIsAddingAccount(!isAddingAccount)}
            icon={<PlusIcon className="w-5 h-5 mr-1" />}
          >
            {isAddingAccount ? 'Cancel' : 'Add Account'}
          </Button>
        </div>
        
        {isAddingAccount && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Account</h2>
            
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="accountType"
                      value="whatsapp"
                      checked={newAccountType === 'whatsapp'}
                      onChange={() => setNewAccountType('whatsapp')}
                    />
                    <span className="ml-2">WhatsApp</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="accountType"
                      value="instagram"
                      checked={newAccountType === 'instagram'}
                      onChange={() => setNewAccountType('instagram')}
                    />
                    <span className="ml-2">Instagram</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <Input
                  id="name"
                  name="name"
                  value={newAccountData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Support Account"
                  required
                />
              </div>
              
              {newAccountType === 'whatsapp' ? (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    id="phone"
                    name="phone"
                    value={newAccountData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +551199999999"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Instagram Username</label>
                  <Input
                    id="username"
                    name="username"
                    value={newAccountData.username}
                    onChange={handleInputChange}
                    placeholder="e.g. @pandora_support"
                  />
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={addMutation.isLoading}
                  disabled={addMutation.isLoading}
                >
                  {addMutation.isLoading ? 'Adding...' : 'Add Account'}
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">WhatsApp</h2>
            {accounts?.whatsapp?.length > 0 ? (
              accounts.whatsapp.map(account => renderAccountCard(account, 'whatsapp'))
            ) : (
              <Card className="text-center py-8">
                <p className="text-gray-500">No WhatsApp accounts added</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setIsAddingAccount(true);
                    setNewAccountType('whatsapp');
                  }}
                >
                  Add WhatsApp Account
                </Button>
              </Card>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Instagram</h2>
            {accounts?.instagram?.length > 0 ? (
              accounts.instagram.map(account => renderAccountCard(account, 'instagram'))
            ) : (
              <Card className="text-center py-8">
                <p className="text-gray-500">No Instagram accounts added</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setIsAddingAccount(true);
                    setNewAccountType('instagram');
                  }}
                >
                  Add Instagram Account
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Accounts;
