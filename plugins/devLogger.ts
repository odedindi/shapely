import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const LOG_DIR = path.resolve(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'dev.log')

export function devLoggerPlugin(): Plugin {
  return {
    name: 'shapely-dev-logger',
    apply: 'serve',
    configureServer(server) {
      if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })

      server.middlewares.use('/__dev-log', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405).end()
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = Buffer.concat(chunks).toString('utf-8')

        try {
          const entry = JSON.parse(body) as { level: string; tag: string; message: string; data?: unknown }
          const ts = new Date().toISOString()
          const dataStr = entry.data !== undefined ? ' ' + JSON.stringify(entry.data) : ''
          const line = `${ts} [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message}${dataStr}\n`
          fs.appendFileSync(LOG_FILE, line, 'utf-8')
        } catch {}

        res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}')
      })
    },
  }
}
