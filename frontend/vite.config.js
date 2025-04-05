import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    https: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
    cors: false
  }
}); 