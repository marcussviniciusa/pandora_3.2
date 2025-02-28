import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationsProvider } from './context/NotificationsContext';
import io from 'socket.io-client';
import { API_URL } from './config';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import WhatsAppAccounts from './pages/WhatsApp/WhatsAppAccounts';
import WhatsAppMessages from './pages/WhatsApp/WhatsAppMessages';
import InstagramAccounts from './pages/Instagram/InstagramAccounts';
import InstagramMessages from './pages/Instagram/InstagramMessages';
import Conversations from './pages/Conversations';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';
import Users from './pages/Users';
import NotFound from './pages/NotFound';

// Layouts
import SidebarLayout from './components/layout/SidebarLayout';

// Components
import LoadingScreen from './components/ui/LoadingScreen';

// Services
import { getCurrentUser } from './services/authService';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

/**
 * Protected route component to handle authentication
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

/**
 * Main application component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

/**
 * App content with React Query access
 */
function AppContent() {
  // Get current user if authenticated
  const { isLoading, data: userData } = useQuery('currentUser', getCurrentUser, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <Router>
      <AuthProvider initialUser={userData}>
        <SocketProvider>
          <NotificationsProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                userData ? <Navigate to="/dashboard" /> : <Login />
              } />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/conversations/:platform?/:accountId?" element={
                <ProtectedRoute>
                  <Conversations />
                </ProtectedRoute>
              } />
              <Route path="/accounts" element={
                <ProtectedRoute>
                  <Accounts />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              
              {/* WhatsApp Routes */}
              <Route path="/whatsapp" element={
                <ProtectedRoute>
                  <WhatsAppAccounts />
                </ProtectedRoute>
              } />
              <Route path="/whatsapp/messages" element={
                <ProtectedRoute>
                  <WhatsAppMessages />
                </ProtectedRoute>
              } />
              <Route path="/whatsapp/messages/:id" element={
                <ProtectedRoute>
                  <WhatsAppMessages />
                </ProtectedRoute>
              } />
              <Route path="/whatsapp/messages/:id/:conversationId" element={
                <ProtectedRoute>
                  <WhatsAppMessages />
                </ProtectedRoute>
              } />
              
              {/* Instagram Routes */}
              <Route path="/instagram" element={
                <ProtectedRoute>
                  <InstagramAccounts />
                </ProtectedRoute>
              } />
              <Route path="/instagram/messages" element={
                <ProtectedRoute>
                  <InstagramMessages />
                </ProtectedRoute>
              } />
              <Route path="/instagram/messages/:id" element={
                <ProtectedRoute>
                  <InstagramMessages />
                </ProtectedRoute>
              } />
              <Route path="/instagram/messages/:id/:conversationId" element={
                <ProtectedRoute>
                  <InstagramMessages />
                </ProtectedRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Toast notifications */}
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          </NotificationsProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
