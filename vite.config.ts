import { defineConfig } from 'vite'
import path from 'path'
import os from 'os'
import { readFile } from 'fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function formatToday() {
  return new Date().toISOString().slice(0, 10)
}

function projectLayoutAnalysisPlugin() {
  return {
    name: 'project-layout-analysis-api',
    configureServer(server: any) {
      server.middlewares.use('/api/project-layout-analysis', async (req: any, res: any, next: any) => {
        try {
          const requestUrl = new URL(req.url, 'http://localhost')
          const projectCode = requestUrl.searchParams.get('projectCode')
          const stageCode = requestUrl.searchParams.get('stageCode') ?? ''
          const staticsType = Number(requestUrl.searchParams.get('staticsType') ?? '1')

          if (!projectCode) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing projectCode' }))
            return
          }

          const settingsPath = path.join(os.homedir(), '.kiro', 'settings', 'mcp.json')
          const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
          const authorization = settings?.mcpServers?.['dataset-service']?.headers?.Authorization

          if (!authorization) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing dataset-service authorization' }))
            return
          }

          const body = {
            jsonrpc: '2.0',
            id: 7131,
            method: 'tools/call',
            params: {
              name: 'query_dataset_data',
              arguments: {
                datasetCode: '7131',
                datasourceCode: 'ads_venus',
                params: {
                  projectCode,
                  staticsDate: formatToday(),
                  stagemainid: stageCode,
                  secondbusinesstypecodes: '',
                  housetypemainids: '',
                  staticsType,
                },
                format: 'json',
              },
            },
          }

          const response = await fetch('https://matrix.gtcloud.cn/mcpapi/mcp/dataset', {
            method: 'POST',
            headers: {
              Authorization: authorization,
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify(body),
          })

          const text = await response.text()
          const match = text.match(/data:\s*(\{.*\})/s)
          const payload = match ? JSON.parse(match[1]) : null
          const contentText = payload?.result?.content?.[0]?.text
          const parsed = contentText ? JSON.parse(contentText) : null

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parsed ?? { responseData: [] }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
        }
      })
    },
  }
}

function projectPhasesPlugin() {
  return {
    name: 'project-phases-api',
    configureServer(server: any) {
      server.middlewares.use('/api/project-phases', async (req: any, res: any) => {
        try {
          const requestUrl = new URL(req.url, 'http://localhost')
          const projectCode = requestUrl.searchParams.get('projectCode')

          if (!projectCode) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing projectCode' }))
            return
          }

          const settingsPath = path.join(os.homedir(), '.kiro', 'settings', 'mcp.json')
          const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
          const authorization = settings?.mcpServers?.['dataset-service']?.headers?.Authorization

          if (!authorization) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing dataset-service authorization' }))
            return
          }

          const body = {
            jsonrpc: '2.0',
            id: 6210,
            method: 'tools/call',
            params: {
              name: 'query_dataset_data',
              arguments: {
                datasetCode: '6210',
                datasourceCode: 'ads_tdda',
                params: {
                  projectCode,
                },
                format: 'json',
              },
            },
          }

          const response = await fetch('https://matrix.gtcloud.cn/mcpapi/mcp/dataset', {
            method: 'POST',
            headers: {
              Authorization: authorization,
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify(body),
          })

          const text = await response.text()
          const match = text.match(/data:\s*(\{.*\})/s)
          const payload = match ? JSON.parse(match[1]) : null
          const contentText = payload?.result?.content?.[0]?.text
          const parsed = contentText ? JSON.parse(contentText) : null

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parsed ?? { responseData: [] }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
        }
      })
    },
  }
}

function projectVersionTrendPlugin() {
  return {
    name: 'project-version-trend-api',
    configureServer(server: any) {
      server.middlewares.use('/api/project-version-trend', async (req: any, res: any) => {
        try {
          const requestUrl = new URL(req.url, 'http://localhost')
          const projectCode = requestUrl.searchParams.get('projectCode')
          const staticsVersion = Number(requestUrl.searchParams.get('staticsVersion') ?? '4')

          if (!projectCode) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing projectCode' }))
            return
          }

          const settingsPath = path.join(os.homedir(), '.kiro', 'settings', 'mcp.json')
          const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
          const authorization = settings?.mcpServers?.['dataset-service']?.headers?.Authorization

          if (!authorization) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing dataset-service authorization' }))
            return
          }

          const body = {
            jsonrpc: '2.0',
            id: 6243,
            method: 'tools/call',
            params: {
              name: 'query_dataset_data',
              arguments: {
                datasetCode: '6243',
                datasourceCode: 'ads_tdda',
                params: {
                  projectCode,
                  staticsVersion,
                  secBusiCode: '',
                },
                format: 'json',
              },
            },
          }

          const response = await fetch('https://matrix.gtcloud.cn/mcpapi/mcp/dataset', {
            method: 'POST',
            headers: {
              Authorization: authorization,
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify(body),
          })

          const text = await response.text()
          const match = text.match(/data:\s*(\{.*\})/s)
          const payload = match ? JSON.parse(match[1]) : null
          const contentText = payload?.result?.content?.[0]?.text
          const parsed = contentText ? JSON.parse(contentText) : null

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parsed ?? { responseData: [] }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
        }
      })
    },
  }
}

function projectSalesTrendPlugin() {
  return {
    name: 'project-sales-trend-api',
    configureServer(server: any) {
      server.middlewares.use('/api/project-sales-trend', async (req: any, res: any) => {
        try {
          const requestUrl = new URL(req.url, 'http://localhost')
          const projectCode = requestUrl.searchParams.get('projectCode')
          const dateType = Number(requestUrl.searchParams.get('dateType') ?? '1')
          const stageCode = requestUrl.searchParams.get('stageCode') ?? ''

          if (!projectCode) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing projectCode' }))
            return
          }

          const settingsPath = path.join(os.homedir(), '.kiro', 'settings', 'mcp.json')
          const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
          const authorization = settings?.mcpServers?.['dataset-service']?.headers?.Authorization

          if (!authorization) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing dataset-service authorization' }))
            return
          }

          const body = {
            jsonrpc: '2.0',
            id: 6236,
            method: 'tools/call',
            params: {
              name: 'query_dataset_data',
              arguments: {
                datasetCode: '6236',
                datasourceCode: 'ads_tdda',
                params: {
                  dateType,
                  projectCode,
                  stageCode,
                  secBusiCodes: '',
                  layoutCodes: '',
                },
                format: 'json',
              },
            },
          }

          const response = await fetch('https://matrix.gtcloud.cn/mcpapi/mcp/dataset', {
            method: 'POST',
            headers: {
              Authorization: authorization,
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify(body),
          })

          const text = await response.text()
          const match = text.match(/data:\s*(\{.*\})/s)
          const payload = match ? JSON.parse(match[1]) : null
          const contentText = payload?.result?.content?.[0]?.text
          const parsed = contentText ? JSON.parse(contentText) : null

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parsed ?? { responseData: [] }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
        }
      })
    },
  }
}

function projectVisitOrderTrendPlugin() {
  return {
    name: 'project-visit-order-trend-api',
    configureServer(server: any) {
      server.middlewares.use('/api/project-visit-order-trend', async (req: any, res: any) => {
        try {
          const requestUrl = new URL(req.url, 'http://localhost')
          const projectCodes = requestUrl.searchParams.get('projectCodes')

          if (!projectCodes) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing projectCodes' }))
            return
          }

          const settingsPath = path.join(os.homedir(), '.kiro', 'settings', 'mcp.json')
          const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
          const authorization = settings?.mcpServers?.['dataset-service']?.headers?.Authorization

          if (!authorization) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing dataset-service authorization' }))
            return
          }

          const body = {
            jsonrpc: '2.0',
            id: 6249,
            method: 'tools/call',
            params: {
              name: 'query_dataset_data',
              arguments: {
                datasetCode: '6249',
                datasourceCode: 'ads_tdda',
                params: {
                  projectCodes,
                },
                format: 'json',
              },
            },
          }

          const response = await fetch('https://matrix.gtcloud.cn/mcpapi/mcp/dataset', {
            method: 'POST',
            headers: {
              Authorization: authorization,
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify(body),
          })

          const text = await response.text()
          const match = text.match(/data:\s*(\{.*\})/s)
          const payload = match ? JSON.parse(match[1]) : null
          const contentText = payload?.result?.content?.[0]?.text
          const parsed = contentText ? JSON.parse(contentText) : null

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parsed ?? { responseData: [] }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
        }
      })
    },
  }
}

export default defineConfig({
  base: '/sale_speed/', // GitHub Pages 子路径部署
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    projectLayoutAnalysisPlugin(),
    projectPhasesPlugin(),
    projectVersionTrendPlugin(),
    projectSalesTrendPlugin(),
    projectVisitOrderTrendPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Development server configuration
  server: {
    host: '0.0.0.0', // 允许外网访问
    port: 5173,
    strictPort: false,
  },

  // Build optimization
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-select', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
})
