/// <reference types="vite/client" />

/**
 * Khai báo các biến môi trường để TypeScript nhận diện.
 * Prefix VITE_ bắt buộc để Vite expose biến này ra client.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AI_SERVICE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Khai báo để import CSS không bị lỗi TypeScript */
declare module '*.css' {
  const content: string
  export default content
}
