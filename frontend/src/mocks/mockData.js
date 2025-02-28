/**
 * Mock data for development environment
 */

// Mock WhatsApp accounts
export const mockWhatsAppAccounts = [
  {
    id: 'wa1',
    phoneNumber: '+5511999887766',
    name: 'Vendas WhatsApp',
    status: 'connected',
    platform: 'whatsapp',
    createdAt: '2023-05-15T10:30:00.000Z',
    updatedAt: '2023-05-15T10:30:00.000Z'
  },
  {
    id: 'wa2',
    phoneNumber: '+5511988776655',
    name: 'Suporte WhatsApp',
    status: 'connected',
    platform: 'whatsapp',
    createdAt: '2023-06-20T14:45:00.000Z',
    updatedAt: '2023-06-20T14:45:00.000Z'
  }
];

// Mock Instagram accounts
export const mockInstagramAccounts = [
  {
    id: 'ig1',
    username: 'minha_loja_oficial',
    name: 'Minha Loja',
    status: 'connected',
    platform: 'instagram',
    profilePicture: 'https://picsum.photos/200',
    createdAt: '2023-04-10T09:20:00.000Z',
    updatedAt: '2023-04-10T09:20:00.000Z'
  },
  {
    id: 'ig2',
    username: 'suporte_minha_loja',
    name: 'Suporte Minha Loja',
    status: 'connected',
    platform: 'instagram',
    profilePicture: 'https://picsum.photos/201',
    createdAt: '2023-05-05T11:15:00.000Z',
    updatedAt: '2023-05-05T11:15:00.000Z'
  }
];

// Mock contacts
export const mockContacts = [
  {
    id: 'c1',
    name: 'João Silva',
    phoneNumber: '+5511987654321',
    profilePicture: 'https://picsum.photos/202',
    platform: 'whatsapp'
  },
  {
    id: 'c2',
    name: 'Maria Oliveira',
    phoneNumber: '+5511976543210',
    profilePicture: 'https://picsum.photos/203',
    platform: 'whatsapp'
  },
  {
    id: 'c3',
    username: 'cliente_feliz',
    name: 'Cliente Feliz',
    profilePicture: 'https://picsum.photos/204',
    platform: 'instagram'
  },
  {
    id: 'c4',
    username: 'comprador_vip',
    name: 'Comprador VIP',
    profilePicture: 'https://picsum.photos/205',
    platform: 'instagram'
  }
];

// Generate random messages between dates
const generateRandomMessages = (conversationId, contactId, accountId, platform, startDate, endDate, count = 10) => {
  const messages = [];
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();
  const timeStep = (endTime - startTime) / count;
  
  const templates = [
    'Olá, tudo bem?',
    'Gostaria de saber mais sobre os produtos',
    'Qual o preço do produto X?',
    'Vocês entregam em qual prazo?',
    'Obrigado pelo atendimento!',
    'Isso resolve meu problema',
    'Vou pensar e retorno depois',
    'Pode me enviar mais informações?',
    'Quais as formas de pagamento?',
    'O produto está disponível?',
    'Preciso de ajuda com meu pedido'
  ];
  
  const responses = [
    'Olá! Como posso ajudar?',
    'Claro, temos várias opções disponíveis',
    'O preço é R$ 99,90 com frete grátis',
    'Nosso prazo de entrega é de 3-5 dias úteis',
    'Por nada! Estamos à disposição',
    'Que bom! Qualquer dúvida estamos aqui',
    'Ok, ficaremos no aguardo',
    'Estou enviando o catálogo completo agora',
    'Aceitamos cartão, boleto e PIX',
    'Sim, temos em estoque!',
    'Qual o número do seu pedido?'
  ];

  for (let i = 0; i < count; i++) {
    const time = new Date(startTime + timeStep * i);
    const isFromContact = i % 2 === 0;
    
    messages.push({
      id: `msg-${conversationId}-${i}`,
      conversationId,
      text: isFromContact ? templates[i % templates.length] : responses[i % responses.length],
      from: isFromContact ? contactId : accountId,
      fromType: isFromContact ? 'contact' : 'account',
      timestamp: time.toISOString(),
      status: 'delivered',
      read: time < new Date(Date.now() - 1000 * 60 * 60),
      platform
    });
  }
  
  return messages;
};

// Mock conversations
export const mockConversations = [
  {
    id: 'conv1',
    contactId: 'c1',
    accountId: 'wa1',
    platform: 'whatsapp',
    lastMessage: 'Obrigado pelo atendimento!',
    lastMessageTimestamp: '2023-08-15T14:30:00.000Z',
    unreadCount: 2,
    status: 'active',
    createdAt: '2023-08-10T09:20:00.000Z',
    updatedAt: '2023-08-15T14:30:00.000Z'
  },
  {
    id: 'conv2',
    contactId: 'c2',
    accountId: 'wa2',
    platform: 'whatsapp',
    lastMessage: 'Qual o prazo de entrega?',
    lastMessageTimestamp: '2023-08-16T10:45:00.000Z',
    unreadCount: 0,
    status: 'active',
    createdAt: '2023-08-12T11:20:00.000Z',
    updatedAt: '2023-08-16T10:45:00.000Z'
  },
  {
    id: 'conv3',
    contactId: 'c3',
    accountId: 'ig1',
    platform: 'instagram',
    lastMessage: 'O produto está disponível?',
    lastMessageTimestamp: '2023-08-14T16:20:00.000Z',
    unreadCount: 1,
    status: 'active',
    createdAt: '2023-08-14T15:10:00.000Z',
    updatedAt: '2023-08-14T16:20:00.000Z'
  },
  {
    id: 'conv4',
    contactId: 'c4',
    accountId: 'ig2',
    platform: 'instagram',
    lastMessage: 'Obrigado, vou fazer o pedido',
    lastMessageTimestamp: '2023-08-13T13:15:00.000Z',
    unreadCount: 0,
    status: 'active',
    createdAt: '2023-08-11T10:30:00.000Z',
    updatedAt: '2023-08-13T13:15:00.000Z'
  }
];

// Generate messages for each conversation
export const mockMessages = [
  ...generateRandomMessages('conv1', 'c1', 'wa1', 'whatsapp', '2023-08-10T09:20:00.000Z', '2023-08-15T14:30:00.000Z', 15),
  ...generateRandomMessages('conv2', 'c2', 'wa2', 'whatsapp', '2023-08-12T11:20:00.000Z', '2023-08-16T10:45:00.000Z', 12),
  ...generateRandomMessages('conv3', 'c3', 'ig1', 'instagram', '2023-08-14T15:10:00.000Z', '2023-08-14T16:20:00.000Z', 8),
  ...generateRandomMessages('conv4', 'c4', 'ig2', 'instagram', '2023-08-11T10:30:00.000Z', '2023-08-13T13:15:00.000Z', 10)
];

// Mock activity logs
export const mockActivityLogs = [
  {
    id: 'act1',
    type: 'message',
    platform: 'whatsapp',
    title: 'Nova mensagem',
    description: 'João Silva enviou uma nova mensagem para Vendas WhatsApp',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
  },
  {
    id: 'act2',
    type: 'account',
    platform: 'instagram',
    title: 'Alteração de status',
    description: 'Conta Minha Loja está conectada',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
  },
  {
    id: 'act3',
    type: 'system',
    title: 'Notificação do sistema',
    description: 'Backup diário concluído com sucesso',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() // 35 minutes ago
  },
  {
    id: 'act4',
    type: 'message',
    platform: 'instagram',
    title: 'Nova mensagem',
    description: 'Maria Oliveira enviou uma nova mensagem para Minha Loja',
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString() // 50 minutes ago
  },
  {
    id: 'act5',
    type: 'account',
    platform: 'whatsapp',
    title: 'Alteração de status',
    description: 'Conta Suporte WhatsApp está conectada',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'act6',
    type: 'error',
    title: 'Erro no sistema',
    description: 'Falha na sincronização de mensagens do Instagram',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  },
  {
    id: 'act7',
    type: 'message',
    platform: 'whatsapp',
    title: 'Nova mensagem',
    description: 'Pedro Santos enviou uma nova mensagem para Vendas WhatsApp',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
  },
  {
    id: 'act8',
    type: 'system',
    title: 'Atualização do sistema',
    description: 'O sistema foi atualizado para a versão 3.2.1',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
  },
  {
    id: 'act9',
    type: 'account',
    platform: 'instagram',
    title: 'Alteração de status',
    description: 'Conta Suporte Minha Loja está conectada',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
  },
  {
    id: 'act10',
    type: 'message',
    platform: 'whatsapp',
    title: 'Nova mensagem',
    description: 'Ana Costa enviou uma nova mensagem para Suporte WhatsApp',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() // 10 hours ago
  },
  {
    id: 'act11',
    type: 'error',
    title: 'Erro de conexão',
    description: 'Falha temporária na conexão com a API do WhatsApp',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  },
  {
    id: 'act12',
    type: 'system',
    title: 'Manutenção programada',
    description: 'Manutenção programada para hoje às 23:00',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  }
];

// Mock system status
export const mockSystemStatus = {
  status: 'operational',
  whatsapp: {
    status: 'operational',
    message: 'Todos os serviços do WhatsApp estão operacionais'
  },
  instagram: {
    status: 'operational',
    message: 'Todos os serviços do Instagram estão operacionais'
  },
  database: {
    status: 'operational',
    message: 'Banco de dados operacional e respondendo dentro dos parâmetros normais'
  },
  api: {
    status: 'operational',
    message: 'API respondendo normalmente com tempo médio de resposta de 120ms'
  },
  updatedAt: new Date().toISOString()
};

// Mock services status history for analytics
export const mockStatusHistory = [
  { 
    date: '2023-09-01', 
    whatsapp: 'operational', 
    instagram: 'operational', 
    api: 'operational', 
    database: 'operational' 
  },
  { 
    date: '2023-09-02', 
    whatsapp: 'operational', 
    instagram: 'degraded', 
    api: 'operational', 
    database: 'operational' 
  },
  { 
    date: '2023-09-03', 
    whatsapp: 'operational', 
    instagram: 'major_outage', 
    api: 'degraded', 
    database: 'operational' 
  },
  { 
    date: '2023-09-04', 
    whatsapp: 'operational', 
    instagram: 'operational', 
    api: 'operational', 
    database: 'operational' 
  },
  { 
    date: '2023-09-05', 
    whatsapp: 'degraded', 
    instagram: 'operational', 
    api: 'operational', 
    database: 'operational' 
  },
  { 
    date: '2023-09-06', 
    whatsapp: 'operational', 
    instagram: 'operational', 
    api: 'operational', 
    database: 'operational' 
  },
  { 
    date: '2023-09-07', 
    whatsapp: 'operational', 
    instagram: 'operational', 
    api: 'operational', 
    database: 'partial_outage' 
  }
];

// Mock performance metrics
export const mockPerformanceMetrics = {
  apiResponseTime: [
    { date: '2023-09-01', value: 120 },
    { date: '2023-09-02', value: 115 },
    { date: '2023-09-03', value: 145 },
    { date: '2023-09-04', value: 110 },
    { date: '2023-09-05', value: 105 },
    { date: '2023-09-06', value: 125 },
    { date: '2023-09-07', value: 130 }
  ],
  messageDeliveryTime: [
    { date: '2023-09-01', value: 850 },
    { date: '2023-09-02', value: 900 },
    { date: '2023-09-03', value: 1200 },
    { date: '2023-09-04', value: 780 },
    { date: '2023-09-05', value: 820 },
    { date: '2023-09-06', value: 750 },
    { date: '2023-09-07', value: 830 }
  ],
  cpuUsage: [
    { date: '2023-09-01', value: 35 },
    { date: '2023-09-02', value: 42 },
    { date: '2023-09-03', value: 65 },
    { date: '2023-09-04', value: 38 },
    { date: '2023-09-05', value: 40 },
    { date: '2023-09-06', value: 45 },
    { date: '2023-09-07', value: 39 }
  ],
  memoryUsage: [
    { date: '2023-09-01', value: 48 },
    { date: '2023-09-02', value: 52 },
    { date: '2023-09-03', value: 75 },
    { date: '2023-09-04', value: 50 },
    { date: '2023-09-05', value: 55 },
    { date: '2023-09-06', value: 49 },
    { date: '2023-09-07', value: 53 }
  ]
};

// Mock user object
export const mockUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@pandora.com',
  role: 'admin',
  preferences: {
    theme: 'light',
    language: 'pt-BR',
    notifications: {
      email: true,
      push: true,
      sound: true
    }
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-08-01T00:00:00.000Z'
};

// Mock users list
export const mockUsers = [
  mockUser,
  {
    id: 2,
    name: 'Atendente 1',
    email: 'atendente1@pandora.com',
    role: 'agent',
    preferences: {
      theme: 'light',
      language: 'pt-BR',
      notifications: {
        email: true,
        push: true,
        sound: true
      }
    },
    createdAt: '2023-02-15T00:00:00.000Z',
    updatedAt: '2023-07-20T00:00:00.000Z'
  },
  {
    id: 3,
    name: 'Atendente 2',
    email: 'atendente2@pandora.com',
    role: 'agent',
    preferences: {
      theme: 'dark',
      language: 'pt-BR',
      notifications: {
        email: false,
        push: true,
        sound: false
      }
    },
    createdAt: '2023-03-10T00:00:00.000Z',
    updatedAt: '2023-08-05T00:00:00.000Z'
  },
  {
    id: 4,
    name: 'Supervisor',
    email: 'supervisor@pandora.com',
    role: 'supervisor',
    preferences: {
      theme: 'light',
      language: 'pt-BR',
      notifications: {
        email: true,
        push: true,
        sound: true
      }
    },
    createdAt: '2023-01-20T00:00:00.000Z',
    updatedAt: '2023-07-15T00:00:00.000Z'
  }
];
