type Level = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: Level
  tag: string
  message: string
  data?: unknown
}

function send(entry: LogEntry) {
  if (!import.meta.env.DEV) return
  fetch('/__dev-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {})
}

function makeLogger(tag: string) {
  return {
    debug: (message: string, data?: unknown) => send({ level: 'debug', tag, message, data }),
    info:  (message: string, data?: unknown) => send({ level: 'info',  tag, message, data }),
    warn:  (message: string, data?: unknown) => send({ level: 'warn',  tag, message, data }),
    error: (message: string, data?: unknown) => send({ level: 'error', tag, message, data }),
  }
}

export const log = {
  game:  makeLogger('game'),
  perf:  makeLogger('perf'),
  board: makeLogger('board'),
  ui:    makeLogger('ui'),
}
