import React from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';

/**
 * Componente para exibir notificações de erro de API
 * @param {Object} props - Propriedades do componente
 * @param {Error} props.error - Objeto de erro
 * @param {string} props.message - Mensagem personalizada (opcional)
 * @param {Function} props.onRetry - Função de nova tentativa (opcional)
 */
const ApiErrorNotification = ({ error, message, onRetry }) => {
  // Determina a mensagem de erro a ser exibida
  const getErrorMessage = () => {
    if (message) return message;
    
    if (!error) return 'Erro desconhecido ao conectar com o servidor';
    
    if (error.response) {
      // Resposta do servidor com erro
      const status = error.response.status;
      
      if (status === 401) return 'Sessão expirada. Faça login novamente.';
      if (status === 403) return 'Você não tem permissão para esta ação.';
      if (status === 404) return 'Recurso não encontrado no servidor.';
      if (status === 500) return 'Erro interno do servidor. Tente novamente mais tarde.';
      
      return error.response.data?.message || `Erro ${status} do servidor`;
    }
    
    if (error.request) {
      // Requisição feita mas sem resposta
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    }
    
    // Erro durante a configuração da requisição
    return error.message || 'Erro desconhecido durante a requisição';
  };
  
  const errorMessage = getErrorMessage();
  
  const notifyError = () => {
    if (onRetry) {
      toast.error(
        (t) => (
          <div className="flex flex-col">
            <span>{errorMessage}</span>
            <button 
              onClick={() => { toast.dismiss(t.id); onRetry(); }}
              className="mt-2 px-2 py-1 text-xs font-medium bg-white text-red-600 rounded border border-red-200 hover:bg-red-50"
            >
              Tentar novamente
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } else {
      toast.error(errorMessage, { duration: 5000 });
    }
  };
  
  return (
    <button
      onClick={notifyError}
      className="inline-flex items-center px-3 py-1 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200"
    >
      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Ver detalhes do erro
    </button>
  );
};

ApiErrorNotification.propTypes = {
  error: PropTypes.object,
  message: PropTypes.string,
  onRetry: PropTypes.func
};

export default ApiErrorNotification;
