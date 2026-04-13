#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn, spawnSync } = require('child_process')
const path = require('path')

const port = process.argv[2] || '3000'
const origin = `http://localhost:${port}`
const routesToWarm = ['/', '/login', '/target-beneficiaries']
const useTurbo = process.env.NEXT_DEV_USE_WEBPACK !== 'true'

function runFreePort() {
  const freePortScript = path.join(__dirname, 'free-port.js')
  const result = spawnSync(process.execPath, [freePortScript, port], {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

async function requestRoute(route, timeoutMs, options = {}) {
  const { quiet = false } = options
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${origin}${route}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'cache-control': 'no-cache',
      },
    })

    if (!quiet) {
      console.log(`Warmup ${route} -> ${response.status}`)
    }
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!quiet) {
      console.warn(`Warmup ${route} failed: ${message}`)
    }
    return false
  } finally {
    clearTimeout(timeout)
  }
}

async function waitForServer() {
  const deadline = Date.now() + 120000

  while (Date.now() < deadline) {
    const ok = await requestRoute('/', 5000, { quiet: true })
    if (ok) return true
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  return false
}

async function warmRoutes() {
  const serverReady = await waitForServer()
  if (!serverReady) {
    console.warn('Warmup skipped because the dev server did not become reachable in time.')
    return
  }

  console.log('Warming core app routes...')
  for (const route of routesToWarm) {
    await requestRoute(route, route === '/target-beneficiaries' ? 120000 : 30000)
  }
  console.log('Warmup complete. You can open the app now.')
}

runFreePort()

const nextBin = require.resolve('next/dist/bin/next')
const nextArgs = ['dev']
if (useTurbo) {
  nextArgs.push('--turbo')
}
nextArgs.push('-p', port)

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env,
})

let startedWarmup = false

function maybeStartWarmup(chunk) {
  const text = chunk.toString()
  process.stdout.write(text)

  if (!startedWarmup && (text.includes('Ready in') || text.includes('Local:'))) {
    startedWarmup = true
    void warmRoutes()
  }
}

child.stdout.on('data', maybeStartWarmup)
child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk.toString())
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code || 0)
})

process.on('SIGINT', () => {
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  child.kill('SIGTERM')
})
