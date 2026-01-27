import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  // Dùng base tương đối để load được assets khi mở file qua loadFile trong Electron
  base: './',
  plugins: [react()],
});
