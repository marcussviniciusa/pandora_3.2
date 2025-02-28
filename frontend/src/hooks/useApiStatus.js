import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_STATUS_URL = 'http://localhost:3000/api/dashboard/status';
const LATENCY_THRESHOLD = 300; // ms

/**
 * Hook para verificar o status da API do sistema
 * @param {Object} options - Opções de configuração
 * @param {boolean} [options.checkOnLoad=true] - Se deve verificar o status ao carregar o componente
 * @param {number} [options.checkInterval=null] - Intervalo em ms para verificar o status periodicamente (null para desativar)
 * @returns {Object} Estado atual do status da API
 */
export function useApiStatus(options = {}) {
  const { 
    checkOnLoad = true, 
    checkInterval = null 
  } = options;

  const [status, setStatus] = useState('checking');
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Função para verificar o status da API
   * @returns {Promise<void>}
   */
  const checkApiStatus = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(API_STATUS_URL);
      
      const endTime = Date.now();
      const responseLatency = endTime - startTime;
      
      setLatency(responseLatency);
      setLastChecked(new Date());
      setError(null);
      
      // Determina o status com base na latência
      if (responseLatency < LATENCY_THRESHOLD) {
        setStatus('online');
      } else {
        setStatus('degraded');
      }
    } catch (err) {
      // Em caso de erro, definir o status como offline
      setStatus('offline');
      setLatency(null);
      setLastChecked(new Date());
      setError(err);
    }
  }, []);

  // Efeito para verificar o status ao carregar o componente
  useEffect(() => {
    if (checkOnLoad) {
      checkApiStatus();
    }
  }, [checkApiStatus, checkOnLoad]);

  // Efeito para verificar o status periodicamente
  useEffect(() => {
    if (checkInterval) {
      const intervalId = setInterval(checkApiStatus, checkInterval);
      
      // Limpeza ao desmontar
      return () => clearInterval(intervalId);
    }
  }, [checkApiStatus, checkInterval]);

  return {
    status,
    latency,
    lastChecked,
    error,
    checkApiStatus
  };
}

export default useApiStatus;
