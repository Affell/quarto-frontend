// Configuration centrale pour les variables d'environnement

export const config = {
  // URL de base de l'API backend
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.quarto.affell.fr',
  
  // Mode de développement
  isDevelopment: import.meta.env.DEV,
  
  // Mode de production
  isProduction: import.meta.env.PROD,
  
  // URL WebSocket (dérivée de l'URL API)
  get wsBaseUrl() {
    // Conversion correcte : http -> ws, https -> wss
    return this.apiBaseUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  }
} as const;

// Type pour la configuration
export type Config = typeof config;

export default config;
