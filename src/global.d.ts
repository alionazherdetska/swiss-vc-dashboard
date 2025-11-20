// Global type declarations for browser-specific fields

export {};

declare global {
  interface Window {
    // Startup data injected via index.html or server-side script
    startupData?: any;
  }
}
