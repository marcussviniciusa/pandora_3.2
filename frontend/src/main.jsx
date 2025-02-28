import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

async function prepare() {
  // Inicialize o MSW apenas em desenvolvimento
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Inicializando Mock Service Worker para desenvolvimento...');
    console.log('ENV variables:', {
      DEV: import.meta.env.DEV,
      VITE_USE_REAL_API: import.meta.env.VITE_USE_REAL_API,
      VITE_API_URL: import.meta.env.VITE_API_URL,
    });
    
    try {
      const { initMocks } = await import('./mocks/api');
      await initMocks();
      console.log('Mock Service Worker iniciado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Mock Service Worker:', error);
    }
  }

  return Promise.resolve();
}

// Inicializa o aplicativo após preparação
prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
});
