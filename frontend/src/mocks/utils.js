/**
 * Utilidades para os mocks de API
 */

/**
 * Adiciona um atraso simulado para imitar latência de rede
 * @param {number} ms - Tempo em milissegundos para atrasar (padrão: valor do .env ou 300ms)
 * @returns {Promise} Promise que resolve após o atraso
 */
export const delay = (ms) => {
  // Usa o valor do .env se disponível, senão usa o padrão de 300ms
  const delayTime = ms || parseInt(import.meta.env.VITE_MOCK_DELAY || 300);
  return new Promise(resolve => setTimeout(resolve, delayTime));
};

/**
 * Determina se deve simular um erro baseado na taxa de erro configurada
 * @returns {boolean} True se deve simular um erro
 */
export const shouldError = () => {
  // Taxa de erro configurada no .env (0-100, padrão: 5%)
  const errorRate = parseInt(import.meta.env.VITE_MOCK_ERROR_RATE || 5);
  return Math.random() * 100 < errorRate;
};

/**
 * Gera um erro de API simulado
 * @param {number} status - Código de status HTTP (padrão: 500)
 * @param {string} message - Mensagem de erro (padrão: "Erro interno do servidor")
 * @returns {object} Objeto de contexto para resposta de erro
 */
export const generateError = (status = 500, message = "Erro interno do servidor") => {
  const errors = {
    400: "Requisição inválida",
    401: "Não autorizado",
    403: "Acesso proibido",
    404: "Recurso não encontrado",
    408: "Timeout de requisição",
    500: "Erro interno do servidor",
    502: "Gateway inválido",
    503: "Serviço indisponível",
    504: "Timeout de gateway"
  };
  
  return {
    status: status,
    message: message || errors[status] || "Erro desconhecido"
  };
};

/**
 * Gera dados paginados para uma coleção
 * @param {Array} collection - Coleção de dados
 * @param {Object} params - Parâmetros de paginação
 * @param {number} params.page - Número da página (inicia em 1)
 * @param {number} params.limit - Itens por página
 * @returns {Object} Dados paginados com metadados
 */
export const paginate = (collection, { page = 1, limit = 10 }) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = collection.length;
  
  return {
    data: collection.slice(startIndex, endIndex),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasMore: endIndex < total
    }
  };
};

/**
 * Filtra uma coleção com base em parâmetros de consulta
 * @param {Array} collection - Coleção de dados
 * @param {Object} filters - Filtros no formato { campo: valor }
 * @returns {Array} Coleção filtrada
 */
export const filterCollection = (collection, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return [...collection];
  }
  
  return collection.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      // Casos especiais para datas
      if (key.includes('Date') && item[key]) {
        if (key.startsWith('start')) {
          const actualKey = key.replace('start', '').toLowerCase();
          return new Date(item[actualKey]) >= new Date(value);
        }
        if (key.startsWith('end')) {
          const actualKey = key.replace('end', '').toLowerCase();
          return new Date(item[actualKey]) <= new Date(value);
        }
      }
      
      // Pesquisa de texto
      if (key === 'search' && value) {
        const searchableProps = ['name', 'title', 'description', 'id', 'content', 'message'];
        return searchableProps.some(prop => 
          item[prop] && item[prop].toString().toLowerCase().includes(value.toLowerCase())
        );
      }
      
      // Comparação exata
      return item[key] === value || item[key]?.toString().toLowerCase() === value.toLowerCase();
    });
  });
};
