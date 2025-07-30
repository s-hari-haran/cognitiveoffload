import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', '@radix-ui/react-badge', '@radix-ui/react-button', '@radix-ui/react-calendar', '@radix-ui/react-card', '@radix-ui/react-carousel', '@radix-ui/react-chart', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-command', '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-drawer', '@radix-ui/react-dropdown-menu', '@radix-ui/react-form', '@radix-ui/react-hover-card', '@radix-ui/react-input-otp', '@radix-ui/react-input', '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-pagination', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-resizable', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-sheet', '@radix-ui/react-sidebar', '@radix-ui/react-skeleton', '@radix-ui/react-slider', '@radix-ui/react-switch', '@radix-ui/react-table', '@radix-ui/react-tabs', '@radix-ui/react-textarea', '@radix-ui/react-toast', '@radix-ui/react-toggle-group', '@radix-ui/react-toggle', '@radix-ui/react-tooltip'],
          utils: ['class-variance-authority', 'clsx', 'tailwind-merge', 'tailwindcss-animate'],
          charts: ['recharts'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
          socket: ['socket.io-client'],
          date: ['date-fns']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
}) 