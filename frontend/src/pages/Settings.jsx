import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import SidebarLayout from '../components/layout/SidebarLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import { useAuth } from '../context/AuthContext';

// Mock service function - replace with actual API calls
const fetchSettings = async () => {
  return {
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    appearance: {
      theme: 'light',
      compactView: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 60
    }
  };
};

// Mock service function - replace with actual API calls
const updateSettings = async (settings) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return settings;
};

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading, error } = useQuery(
    'settings',
    fetchSettings,
    { staleTime: 300000 } // 5 minutes
  );
  
  const mutation = useMutation(updateSettings, {
    onSuccess: (data) => {
      queryClient.setQueryData('settings', data);
      toast.success('Settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });
  
  const [formData, setFormData] = useState(settings || {});
  
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);
  
  const handleToggleChange = (section, setting) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [setting]: !formData[section][setting]
      }
    });
  };
  
  const handleInputChange = (section, setting, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [setting]: value
      }
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
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
            <h2 className="text-red-800 text-lg font-medium">Error loading settings</h2>
            <p className="text-red-600 mt-1">Please try again later</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }
  
  return (
    <SidebarLayout>
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <form onSubmit={handleSubmit}>
          {/* Notifications Settings */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Toggle 
                  enabled={formData.notifications?.email || false} 
                  onChange={() => handleToggleChange('notifications', 'email')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Get notified in your browser</p>
                </div>
                <Toggle 
                  enabled={formData.notifications?.push || false} 
                  onChange={() => handleToggleChange('notifications', 'push')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">Get text messages for important alerts</p>
                </div>
                <Toggle 
                  enabled={formData.notifications?.sms || false} 
                  onChange={() => handleToggleChange('notifications', 'sms')}
                />
              </div>
            </div>
          </Card>
          
          {/* Appearance Settings */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Theme</h3>
                  <p className="text-sm text-gray-500">Choose your preferred theme</p>
                </div>
                <div className="w-48">
                  <select 
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.appearance?.theme || 'light'}
                    onChange={(e) => handleInputChange('appearance', 'theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Compact View</h3>
                  <p className="text-sm text-gray-500">Use less space for UI elements</p>
                </div>
                <Toggle 
                  enabled={formData.appearance?.compactView || false} 
                  onChange={() => handleToggleChange('appearance', 'compactView')}
                />
              </div>
            </div>
          </Card>
          
          {/* Security Settings */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <Toggle 
                  enabled={formData.security?.twoFactorAuth || false} 
                  onChange={() => handleToggleChange('security', 'twoFactorAuth')}
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Session Timeout (minutes)</h3>
                <p className="text-sm text-gray-500 mb-2">Time before you're automatically logged out</p>
                <Input 
                  type="number" 
                  className="w-48"
                  min="5"
                  max="1440"
                  value={formData.security?.sessionTimeout || 60}
                  onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                />
              </div>
            </div>
          </Card>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={mutation.isLoading}
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
};

export default Settings;
