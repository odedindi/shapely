import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const LOG_DIR = path.resolve(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'dev.log')
const MAX_TAIL_LINES = 200

function tailLines(filePath: string, n: number): string {
  if (!fs.existsSync(filePath)) return ''
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trimEnd().split('\n')
  return lines.slice(-n).join('\n')
}

const VIEWER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Shapely Dev Logs</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0 }
    body { background: #0d0d14; color: #c9d1d9; font-family: 'Menlo', 'Consolas', monospace; font-size: 12px; padding: 12px }
    h1 { font-size: 15px; font-weight: 700; color: #818cf8; margin-bottom: 10px; letter-spacing: 0.5px }
    #controls { display: flex; gap: 8px; margin-bottom: 10px; align-items: center }
    button { background: #1e1e2e; border: 1px solid #2d2d42; color: #c9d1d9; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px }
    button:active { background: #2d2d42 }
    label { color: #9ca3af; font-size: 12px; display: flex; align-items: center; gap: 4px }
    #log { white-space: pre-wrap; word-break: break-all; line-height: 1.6 }
    .INFO  { color: #c9d1d9 }
    .WARN  { color: #fbbf24 }
    .ERROR { color: #fb7185 }
    .DEBUG { color: #6b7280 }
    .tag-game  { color: #818cf8 }
    .tag-perf  { color: #22d3ee }
    .tag-board { color: #34d399 }
    .tag-ui    { color: #c084fc }
    #status { font-size: 11px; color: #6b7280; margin-inline-start: auto }
  </style>
</head>
<body>
  <h1>📋 Shapely Dev Logs</h1>
  <div id="controls">
    <button onclick="fetchLogs()">Refresh</button>
    <button onclick="clearView()">Clear view</button>
    <label><input type="checkbox" id="autoRefresh" checked /> Auto (2s)</label>
    <label><input type="checkbox" id="scrollLock" checked /> Scroll lock</label>
    <span id="status">—</span>
  </div>
  <div id="log"></div>
  <script>
    let timer = null
    function colorize(line) {
      const levelMatch = line.match(/\\[(INFO|WARN|ERROR|DEBUG)\\]/)
      const tagMatch = line.match(/\\[(game|perf|board|ui)\\]/)
      const level = levelMatch ? levelMatch[1] : 'INFO'
      const tag = tagMatch ? tagMatch[1] : ''
      const ts = line.slice(0, 24)
      const rest = line.slice(24)
      return '<span class="' + level + '">' +
        '<span style="color:#4b5563">' + ts + '</span>' +
        rest.replace('\\[' + level + '\\]', '<b>[' + level + ']</b>')
            .replace(tag ? '\\[' + tag + '\\]' : '', tag ? '<span class="tag-' + tag + '">[' + tag + ']</span>' : '') +
        '</span>'
    }
    async function fetchLogs() {
      try {
        const r = await fetch('/__dev-log/tail')
        const text = await r.text()
        const el = document.getElementById('log')
        el.innerHTML = text.split('\\n').filter(Boolean).map(colorize).join('\\n')
        document.getElementById('status').textContent = 'updated ' + new Date().toLocaleTimeString()
        if (document.getElementById('scrollLock').checked) window.scrollTo(0, document.body.scrollHeight)
      } catch(e) { document.getElementById('status').textContent = 'fetch failed' }
    }
    function clearView() { document.getElementById('log').innerHTML = '' }
    function tick() {
      if (document.getElementById('autoRefresh').checked) fetchLogs()
      timer = setTimeout(tick, 2000)
    }
    fetchLogs()
    tick()
  </script>
</body>
</html>`

export function devLoggerPlugin(): Plugin {
  return {
    name: 'shapely-dev-logger',
    apply: 'serve',
    configureServer(server) {
      if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })

      server.middlewares.use('/__dev-log', async (req, res) => {
        const url = req.url ?? '/'

        if (req.method === 'GET' && url === '/tail') {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end(tailLines(LOG_FILE, MAX_TAIL_LINES))
          return
        }

        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(VIEWER_HTML)
          return
        }

        if (req.method === 'POST') {
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
          return
        }

        res.writeHead(405).end()
      })
    },
  }
}
