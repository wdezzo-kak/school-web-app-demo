import { defineConfig , loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) =>{
  const env = loadEnv(mode, '.', '');
  return {
  base: '/school-web-app-demo',
  server: {
        port: 3000,
        host: '0.0.0.0',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
    
  plugins: [react(), tailwindcss()],
  };
});

