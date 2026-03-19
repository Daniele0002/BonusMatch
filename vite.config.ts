import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
     plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Crea un file separato per tutte le librerie dentro node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }

        }
      }
    }
  },
      define: {
        // GEMINI_API_KEY rimossa dal bundle client — le chiamate AI passano via Netlify Function server-side
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
