import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from '../../context/SocketContext';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { mockActivityLogs } from '../../mocks/mockData';
import { dashboardService } from '../../services/api';

/**
 * Activity log component for the dashboard
 */
const ActivityLog = ({ limit = 10 }) => {
  const { socket, connected } = useSocket();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carrega atividades iniciais do mock ou da API
  useEffect(() => {
    const fetchActivityLogs = async () => {
      setLoading(true);
      try {
        if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
          // Em ambiente de desenvolvimento, usa dados mockados
          setActivities(mockActivityLogs.slice(0, limit));
        } else {
          // Get real activity logs from API
          const data = await dashboardService.getActivityLogs(limit);
          setActivities(data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching activity logs:', err);
        setError('Não foi possível carregar os logs de atividades');
        // Fallback to mock data in case of error
        if (import.meta.env.DEV) {
          setActivities(mockActivityLogs.slice(0, limit));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, [limit]);

  // Listen for socket events that indicate activity
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (data) => {
      addActivity({
        type: 'message',
        platform: data.platform,
        title: 'Nova mensagem',
        description: `${data.sender} enviou uma mensagem`,
        timestamp: new Date().toISOString(),
        platformIcon: data.platform,
      });
    };

    const handleAccountStatusChange = (data) => {
      addActivity({
        type: 'account',
        platform: data.platform,
        title: 'Alteração de status',
        description: `Conta ${data.name || data.phoneNumber} está ${data.status === 'connected' ? 'conectada' : 'desconectada'}`,
        timestamp: new Date().toISOString(),
        platformIcon: data.platform,
      });
    };

    const handleSystemNotification = (data) => {
      addActivity({
        type: 'system',
        title: data.title || 'Notificação do sistema',
        description: data.message,
        timestamp: new Date().toISOString(),
      });
    };

    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('account_status_change', handleAccountStatusChange);
    socket.on('system_notification', handleSystemNotification);

    // Cleanup on unmount
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('account_status_change', handleAccountStatusChange);
      socket.off('system_notification', handleSystemNotification);
    };
  }, [socket, connected]);

  // Add a new activity to the activity log
  const addActivity = (activity) => {
    setActivities((prevActivities) => {
      const newActivities = [activity, ...prevActivities];
      return newActivities.slice(0, limit);
    });
  };

  // Get the icon for an activity
  const getActivityIcon = (activity) => {
    if (activity.type === 'message') {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          {activity.platform === 'whatsapp' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.6 6.31a7.885 7.885 0 0 0-5.611-2.329c-4.366 0-7.926 3.56-7.976 7.926 0 1.394.366 2.787 1.097 3.99L4 20l4.232-1.098a7.9 7.9 0 0 0 3.768.976h.004c4.366 0 7.93-3.56 7.98-7.926a7.91 7.91 0 0 0-2.384-5.643zm-5.607 12.2h-.003a6.57 6.57 0 0 1-3.354-.92l-.24-.145-2.492.653.666-2.431-.156-.25a6.588 6.588 0 0 1-1.012-3.49c0-3.634 2.956-6.586 6.59-6.586 1.76 0 3.414.685 4.66 1.93a6.578 6.578 0 0 1 1.928 4.66c-.004 3.639-2.956 6.59-6.586 6.59zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.1-.133.197-.513.646-.627.775-.116.133-.231.15-.43.05-.197-.099-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.115.133-.198.2-.33.065-.134.034-.248-.018-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          )}
        </div>
      );
    } else if (activity.type === 'account') {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else if (activity.type === 'error') {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };
  
  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    try {
      return formatDistance(new Date(timestamp), new Date(), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      return 'data desconhecida';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Atividades Recentes</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Atividades Recentes</h3>
        <div className="text-center py-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium text-gray-900">Atividades Recentes</h3>
        {connected ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
            Atualizado em tempo real
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="h-2 w-2 rounded-full bg-gray-500 mr-1"></span>
            Offline
          </span>
        )}
      </div>
      
      <div className="mt-6 flow-root">
        <ul className="-mb-8">
          {activities.length > 0 ? (
            activities.map((activity, activityIdx) => (
              <li key={activityIdx}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  ) : null}
                  <div className="relative flex space-x-3">
                    {getActivityIcon(activity)}
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900 font-medium">
                          {activity.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {activity.description}
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-gray-500">
                        <time dateTime={activity.timestamp}>
                          {formatTimestamp(activity.timestamp)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <div className="text-center py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Nenhuma atividade registrada
              </p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

ActivityLog.propTypes = {
  limit: PropTypes.number,
};

export default ActivityLog;
