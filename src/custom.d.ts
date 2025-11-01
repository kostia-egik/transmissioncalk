// This file contains type definitions for assets that TypeScript doesn't know about by default.

declare module '*.webp' {
  const value: string;
  export default value;
}

declare module '*.mp4' {
  const value: string;
  export default value;
}

// Объявляем TypeScript, что импорт с суффиксом `?url` является модулем,
// который экспортирует строку (URL). Это исправляет ошибку TS2307.
declare module '*?url' {
    const value: string;
    export default value;
}

// FIX: Moved Vite environment variable types here from firebase.ts to properly augment the global scope.
// This resolves the "Subsequent property declarations must have the same type" error in firebase.ts and
// also fixes the "Duplicate identifier 'src'" errors which were likely symptoms of the type conflict.
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
