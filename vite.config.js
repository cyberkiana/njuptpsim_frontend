import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        secure: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 头像静态资源：开发模式转发到虚拟机nginx（生产模式由nginx直接静态服务）
      '/avatar': {
        target: 'http://192.168.233.130',
        secure: false,
        changeOrigin: true,
      }      ,
      // 实验头图与WebGL文件：存于后端服务器独立文件夹（生产模式由后端静态直出）
      '/img': {
        target: 'http://localhost:8081',
        secure: false,
        changeOrigin: true,
      },
      '/webgl': {
        target: 'http://localhost:8081',
        secure: false,
        changeOrigin: true,
      }
    }
  }
})
