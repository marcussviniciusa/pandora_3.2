import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SidebarLayout from '../components/layout/SidebarLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

// Mock API functions - Replace with actual API calls
const fetchUsers = async () => {
  // Simulated API response
  return [
    { id: 1, name: 'Admin User', email: 'admin@pandora.com', role: 'admin', status: 'active', lastLogin: '2025-02-25T10:30:00Z' },
    { id: 2, name: 'Support Agent', email: 'support@pandora.com', role: 'agent', status: 'active', lastLogin: '2025-02-27T14:45:00Z' },
    { id: 3, name: 'Maria Silva', email: 'maria@pandora.com', role: 'agent', status: 'active', lastLogin: '2025-02-28T09:15:00Z' },
    { id: 4, name: 'João Santos', email: 'joao@pandora.com', role: 'agent', status: 'inactive', lastLogin: '2025-02-10T16:20:00Z' }
  ];
};

const addUser = async (userData) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  return { id: Date.now(), ...userData, status: 'active', lastLogin: null };
};

const deleteUser = async (id) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

const Users = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'agent',
    password: '',
    confirmPassword: ''
  });
  
  const { data: users, isLoading, error } = useQuery(
    'users',
    fetchUsers,
    { staleTime: 300000 } // 5 minutes
  );
  
  const addMutation = useMutation(addUser, {
    onSuccess: (data) => {
      queryClient.setQueryData('users', old => [...(old || []), data]);
      toast.success('User added successfully');
      setIsAddingUser(false);
      setNewUserData({ name: '', email: '', role: 'agent', password: '', confirmPassword: '' });
    },
    onError: () => {
      toast.error('Failed to add user');
    }
  });
  
  const deleteMutation = useMutation(deleteUser, {
    onSuccess: (_, variables) => {
      queryClient.setQueryData('users', old => old.filter(user => user.id !== variables));
      toast.success('User deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete user');
    }
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddUser = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error('All fields are required');
      return;
    }
    
    if (newUserData.password !== newUserData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      toast.error('Please enter a valid email');
      return;
    }
    
    const { confirmPassword, ...userData } = newUserData;
    addMutation.mutate(userData);
  };
  
  const handleDeleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never logged in';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Invalid date';
    }
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
            <h2 className="text-red-800 text-lg font-medium">Error loading users</h2>
            <p className="text-red-600 mt-1">Please try again later</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }
  
  return (
    <SidebarLayout>
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Users</h1>
          <Button
            variant="primary"
            onClick={() => setIsAddingUser(!isAddingUser)}
            icon={isAddingUser ? <XMarkIcon className="w-5 h-5 mr-1" /> : <PlusIcon className="w-5 h-5 mr-1" />}
          >
            {isAddingUser ? 'Cancel' : 'Add User'}
          </Button>
        </div>
        
        {isAddingUser && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input
                    id="name"
                    name="name"
                    value={newUserData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newUserData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  id="role"
                  name="role"
                  value={newUserData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="admin">Administrator</option>
                  <option value="agent">Support Agent</option>
                  <option value="readonly">Read Only</option>
                </select>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newUserData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={newUserData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={addMutation.isLoading}
                  disabled={addMutation.isLoading}
                >
                  {addMutation.isLoading ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users && users.length > 0 ? (
              users.map(user => (
                <li key={user.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium text-sm">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-500 flex items-center">
                            {user.email}
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {user.role === 'admin' ? 'Administrator' : user.role === 'agent' ? 'Support Agent' : 'Read Only'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                          title="Edit User"
                          onClick={() => toast.info('Edit functionality coming soon')}
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        {user.id !== 1 && ( // Prevent deleting the main admin
                          <button
                            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                            title="Delete User"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === 1}
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Last login: {formatDate(user.lastLogin)}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-gray-500">
                No users found
              </li>
            )}
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Users;
