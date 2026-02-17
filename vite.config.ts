import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Quan trọng: base './' giúp đường dẫn hoạt động trên GitHub Pages bất kể tên repo là gì
  base: './', 
});