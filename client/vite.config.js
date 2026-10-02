import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser talks to the Vite server only; Vite forwards the
// two API paths to the planner and the booking service. nginx does the same in
// the Docker image, so the client code never needs to know the service hosts.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/graphql': { target: process.env.PLANNER_URL || 'http://localhost:4000', changeOrigin: true },
      '/booking-api': {
        target: process.env.BOOKING_API_ORIGIN || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/booking-api/, ''),
      },
    },
  },
});
