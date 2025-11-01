// FIX: Replaced the failing `/// <reference types="vite/client" />` with an explicit declaration 
// for import.meta.env. This resolves TypeScript errors about missing types for Vite's environment variables 
// when the type definition file cannot be found.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_FIREBASE_API_KEY: string;
      readonly VITE_FIREBASE_AUTH_DOMAIN: string;
      readonly VITE_FIREBASE_PROJECT_ID: string;
      readonly VITE_FIREBASE_STORAGE_BUCKET: string;
      readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
      readonly VITE_FIREBASE_APP_ID: string;
    };
  }
}

// FIX: Обновляем импорты Firebase для использования v9 compat-библиотек.
// Это позволяет коду, написанному в стиле v8, работать с последней версией Firebase и исправляет ошибку импорта.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// ВАЖНО: Замените значения ниже на конфигурацию вашего проекта Firebase.
// Для локальной разработки создайте файл .env.local в корне проекта и добавьте в него переменные:
// VITE_FIREBASE_API_KEY="your-api-key"
// VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
// VITE_FIREBASE_PROJECT_ID="your-project-id"
// VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
// VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
// VITE_FIREBASE_APP_ID="your-app-id"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Инициализация Firebase
// FIX: Use Firebase v8 initialization syntax to match the updated imports.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
export const auth = firebase.auth();
export const db = firebase.firestore();