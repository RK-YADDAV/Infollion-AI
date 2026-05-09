import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/chat': 'http://localhost:8000',
      '/upload-doc': 'http://localhost:8000',
      '/upload-image': 'http://localhost:8000',
      '/reset': 'http://localhost:8000',
      '/chats': 'http://localhost:8000',
    },
  },
});
