// This file contains type definitions for assets that TypeScript doesn't know about by default.

// FIX: Renaming the exported variable from `content` to `src` to align with Vite's default asset types.
// This is intended to resolve the "Duplicate identifier 'src'" error, which likely stems from a conflict
// with Vite's own client type declarations that use `src` as the identifier.
declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

// Объявляем TypeScript, что импорт с суффиксом `?url` является модулем,
// который экспортирует строку (URL). Это исправляет ошибку TS2307.
declare module '*?url' {
    const src: string;
    export default src;
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