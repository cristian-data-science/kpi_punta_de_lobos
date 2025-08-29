import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// Plugin para escribir un snapshot de configuración en un archivo local
function configSnapshotPlugin() {
  return {
    name: 'config-snapshot-plugin',
    configureServer(server) {
      server.middlewares.use('/__config_snapshot', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}')
            const cfg = data?.config || data
            const fileName = data?.file || 'public/config_snapshot.json'
            const outPath = path.resolve(process.cwd(), fileName)
            const pretty = JSON.stringify(cfg, null, 2)
            fs.writeFileSync(outPath, pretty, 'utf-8')
            res.statusCode = 200
            res.end('OK')
          } catch (err) {
            console.error('[config-snapshot] Error writing snapshot:', err)
            res.statusCode = 400
            res.end('Bad Request')
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), configSnapshotPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          echarts: ['echarts', 'echarts-for-react'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      // Evitar bucle de recarga por el archivo de snapshot
      ignored: ['**/config_snapshot.json', '**/public/config_snapshot.json']
    }
  },
  preview: {
    port: 4173,
    host: true
  }
})
