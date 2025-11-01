import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { LanguageProvider } from './contexts/LanguageContext';


// --- Регистрация Service Worker ---
if ('serviceWorker' in navigator) {
  // Используем `new URL` чтобы получить правильный URL к файлу service-worker.
  // Этот современный подход позволяет избежать встраивания Vite через `?url`, 
  // что не поддерживается браузерами для service workers из-за политики безопасности.
  const serviceWorkerUrl = new URL('../service-worker.js', import.meta.url).href;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(serviceWorkerUrl, { type: 'module' })
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