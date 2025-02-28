import React from 'react';
import SystemStatus from './SystemStatus';
import ActivityLog from './ActivityLog';
import Analytics from './Analytics';
import AccountStats from './AccountStats';
import AccountsList from './AccountsList';
import ApiStatus from '../common/ApiStatus';
import { useSocket } from '../../context/SocketContext';

/**
 * Componente principal do Dashboard
 */
const Dashboard = () => {
  const { isConnected } = useSocket();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <ApiStatus />
          <div className="flex items-center space-x-1.5 text-xs text-gray-700">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Socket Conectado' : 'Socket Desconectado'}</span>
          </div>
        </div>
      </div>
      
      {/* Cards de estatísticas de contas */}
      <AccountStats />
      
      {/* Status do sistema e métricas de desempenho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SystemStatus />
        </div>
        <div className="lg:col-span-1">
          <AccountsList />
        </div>
      </div>
      
      {/* Logs de atividade e análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <ActivityLog />
        </div>
        <div>
          <Analytics />
        </div>
      </div>
      
      {/* Rodapé com informações de atualização */}
      <div className="text-xs text-gray-500 text-center mt-8">
        <p>Dados atualizados automaticamente. Última atualização: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
