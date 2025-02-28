import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { mockStatusHistory, mockPerformanceMetrics } from '../../mocks/mockData';
import { dashboardService } from '../../services/api';

/**
 * Dashboard analytics component
 */
const Analytics = ({ 
  whatsappAccounts, 
  instagramAccounts, 
  conversations, 
  startDate, 
  endDate 
}) => {
  // Analytics state
  const [messagesByPlatform, setMessagesByPlatform] = useState([]);
  const [messagesByDay, setMessagesByDay] = useState([]);
  const [accountStatus, setAccountStatus] = useState([]);
  const [conversationStats, setConversationStats] = useState({ total: 0, active: 0, archived: 0 });
  const [statusHistory, setStatusHistory] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart colors
  const COLORS = {
    whatsapp: '#25D366',
    instagram: '#C13584',
    connected: '#10B981',
    disconnected: '#EF4444',
    archived: '#6B7280',
    active: '#3B82F6',
    api: '#3B82F6',
    database: '#8B5CF6',
    operational: '#10B981',
    degraded: '#FBBF24',
    partial_outage: '#F97316',
    major_outage: '#EF4444'
  };
  
  // Calculate analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardService.getAnalyticsData();
        // Messages by platform
        const whatsappMessages = data.conversations
          .filter(c => c.platform === 'whatsapp')
          .reduce((sum, c) => sum + (c.messagesCount || 0), 0);
        
        const instagramMessages = data.conversations
          .filter(c => c.platform === 'instagram')
          .reduce((sum, c) => sum + (c.messagesCount || 0), 0);
        
        setMessagesByPlatform([
          { name: 'WhatsApp', value: whatsappMessages },
          { name: 'Instagram', value: instagramMessages }
        ]);
        
        // Messages by day (last 7 days)
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();
        
        const messagesByDayData = last7Days.map(day => {
          const dayConversations = data.conversations.filter(c => {
            if (!c.messages || !c.messages.length) return false;
            const messageDates = c.messages.map(m => m.timestamp.split('T')[0]);
            return messageDates.includes(day);
          });
          
          const whatsappCount = dayConversations
            .filter(c => c.platform === 'whatsapp')
            .reduce((sum, c) => {
              return sum + c.messages.filter(m => m.timestamp.split('T')[0] === day).length;
            }, 0);
            
          const instagramCount = dayConversations
            .filter(c => c.platform === 'instagram')
            .reduce((sum, c) => {
              return sum + c.messages.filter(m => m.timestamp.split('T')[0] === day).length;
            }, 0);
            
          return {
            date: day,
            WhatsApp: whatsappCount,
            Instagram: instagramCount
          };
        });
        
        setMessagesByDay(messagesByDayData);
        
        // Account status
        const connectedWhatsApp = data.whatsappAccounts?.filter(a => a.status === 'connected').length || 0;
        const disconnectedWhatsApp = data.whatsappAccounts?.filter(a => a.status !== 'connected').length || 0;
        
        const connectedInstagram = data.instagramAccounts?.filter(a => a.status === 'connected').length || 0;
        const disconnectedInstagram = data.instagramAccounts?.filter(a => a.status !== 'connected').length || 0;
        
        setAccountStatus([
          { name: 'WhatsApp Conectado', value: connectedWhatsApp },
          { name: 'WhatsApp Desconectado', value: disconnectedWhatsApp },
          { name: 'Instagram Conectado', value: connectedInstagram },
          { name: 'Instagram Desconectado', value: disconnectedInstagram }
        ]);
        
        // Conversation stats
        const total = data.conversations.length;
        const active = data.conversations.filter(c => !c.archived).length;
        const archived = data.conversations.filter(c => c.archived).length;
        
        setConversationStats({ total, active, archived });
        
        // Carrega dados do histórico de status
        if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
          setStatusHistory(mockStatusHistory);
          setPerformanceMetrics(mockPerformanceMetrics);
        } else {
          setStatusHistory(data.statusHistory);
          setPerformanceMetrics(data.performanceMetrics);
        }
        
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [conversations, whatsappAccounts, instagramAccounts]);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Get status color based on status value
  const getStatusColor = (status) => {
    return COLORS[status] || '#CBD5E1'; // default color
  };
  
  // Format date for display
  const formatDate = (dateStr) => {
    const dateParts = dateStr.split('-');
    return `${dateParts[2]}/${dateParts[1]}`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Platform Message Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Distribuição de Mensagens por Plataforma</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={messagesByPlatform}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {messagesByPlatform.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'WhatsApp' ? COLORS.whatsapp : COLORS.instagram} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Messages by Day */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Mensagens por Dia</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={messagesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="WhatsApp" fill={COLORS.whatsapp} />
              <Bar dataKey="Instagram" fill={COLORS.instagram} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* System Status Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Histórico de Status do Sistema</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusHistory}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="date" tickFormatter={formatDate} />
              <YAxis dataKey="date" type="category" tickFormatter={formatDate} hide />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="whatsapp" name="WhatsApp" fill={COLORS.whatsapp}>
                {statusHistory.map((entry, index) => (
                  <Cell key={`cell-whatsapp-${index}`} fill={getStatusColor(entry.whatsapp)} />
                ))}
              </Bar>
              <Bar dataKey="instagram" name="Instagram" fill={COLORS.instagram}>
                {statusHistory.map((entry, index) => (
                  <Cell key={`cell-instagram-${index}`} fill={getStatusColor(entry.instagram)} />
                ))}
              </Bar>
              <Bar dataKey="api" name="API" fill={COLORS.api}>
                {statusHistory.map((entry, index) => (
                  <Cell key={`cell-api-${index}`} fill={getStatusColor(entry.api)} />
                ))}
              </Bar>
              <Bar dataKey="database" name="Banco de Dados" fill={COLORS.database}>
                {statusHistory.map((entry, index) => (
                  <Cell key={`cell-database-${index}`} fill={getStatusColor(entry.database)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.operational }}></div>
            <span className="text-xs text-gray-600">Operacional</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.degraded }}></div>
            <span className="text-xs text-gray-600">Degradado</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.partial_outage }}></div>
            <span className="text-xs text-gray-600">Parciamente Indisponível</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.major_outage }}></div>
            <span className="text-xs text-gray-600">Indisponível</span>
          </div>
        </div>
      </div>
      
      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-medium text-gray-900 mb-4">Métricas de Desempenho</h3>
          <div className="space-y-6">
            {/* API Response Time */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tempo de Resposta da API (ms)</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceMetrics.apiResponseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke={COLORS.api} name="Tempo (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Message Delivery Time */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tempo de Entrega de Mensagens (ms)</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceMetrics.messageDeliveryTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#F97316" name="Tempo (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* System Resources */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Utilização de Recursos (%)</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceMetrics.cpuUsage.map((cpu, i) => ({
                    date: cpu.date,
                    cpu: cpu.value,
                    memory: performanceMetrics.memoryUsage[i].value
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="cpu" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} name="CPU" />
                    <Area type="monotone" dataKey="memory" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="Memória" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Conversation Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Estatísticas de Conversas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-500 text-2xl font-bold">{conversationStats.total}</div>
            <div className="text-sm text-gray-600">Total de Conversas</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-500 text-2xl font-bold">{conversationStats.active}</div>
            <div className="text-sm text-gray-600">Conversas Ativas</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-500 text-2xl font-bold">{conversationStats.archived}</div>
            <div className="text-sm text-gray-600">Conversas Arquivadas</div>
          </div>
        </div>
      </div>
      
      {/* Account Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Status das Contas</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={accountStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {accountStatus.map((entry, index) => {
                  let color;
                  if (entry.name.includes('Conectado')) {
                    color = COLORS.connected;
                  } else {
                    color = COLORS.disconnected;
                  }
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

Analytics.propTypes = {
  whatsappAccounts: PropTypes.array,
  instagramAccounts: PropTypes.array,
  conversations: PropTypes.array,
  startDate: PropTypes.string,
  endDate: PropTypes.string
};

export default Analytics;
