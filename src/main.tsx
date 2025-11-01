import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { LanguageProvider } from './contexts/LanguageContext';

// --- Регистрация Service Worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker зарегистрирован успешно, scope:', registration.scope);
      })
      .catch(error => {
        console.error('Ошибка регистрации Service Worker:', error);
      });
  });
}
// --- Конец регистрации Service Worker ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Не удалось найти корневой элемент для монтирования");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <NetworkProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NetworkProvider>
    </LanguageProvider>
  </React.StrictMode>
);