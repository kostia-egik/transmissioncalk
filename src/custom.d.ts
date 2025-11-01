// This file contains type definitions for assets that TypeScript doesn't know about by default.

declare module '*.webp' {
  const value: string;
  export default value;
}

declare module '*.mp4' {
  const value: string;
  export default value;
}
