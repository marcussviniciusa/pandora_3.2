import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

async function prepare() {
  // Inicialize o MSW apenas em desenvolvimento
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Inicializando Mock Service Worker para desenvolvimento...');
    const { initMocks } = await import('./mocks/api');
    await initMocks();
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
