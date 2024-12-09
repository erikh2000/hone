import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [react()],
    css: {
      modules: {
        scopeBehaviour: 'local',
      }
    },
    server: { port: 3000 },
    resolve: {
      alias: { '@': '/src' }
    },
    build: { 
      sourcemap: true, 
      manifest: true
    }
  };
});
