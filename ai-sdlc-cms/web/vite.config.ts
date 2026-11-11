import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: `npm run dev` (cổng 5173) chuyển /api sang server Fastify ở 3300.
// changeOrigin: false để Host khớp Origin → qua được kiểm tra CSRF của server.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': { target: `http://127.0.0.1:${process.env.API_PORT || 3300}`, changeOrigin: false } } },
  build: { outDir: 'dist', emptyOutDir: false, chunkSizeWarningLimit: 2000 },
});
