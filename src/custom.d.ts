// This file contains type definitions for assets that TypeScript doesn't know about by default.

// FIX: Removed duplicate module declarations for asset types (*.webp, *.mp4, *?url).
// These were conflicting with Vite's built-in client types which already provide these definitions.
// Removing them resolves the "Duplicate identifier 'src'" error.

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
