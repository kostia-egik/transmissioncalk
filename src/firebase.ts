// FIX: Removed the conflicting global declaration of `ImportMeta.env`. The environment variable types
// have been moved to `src/custom.d.ts` to properly augment Vite's built-in types via declaration merging,
// which resolves the "Subsequent property declarations must have the same type" error.

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