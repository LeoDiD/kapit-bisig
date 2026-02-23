#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require('child_process')

const port = process.argv[2] || '3000'

function killWindows() {
  const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })

  const pids = new Set()
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (!trimmed.includes(`:${port}`)) continue
    const parts = trimmed.split(/\s+/)
    const state = parts[3]
    const pid = parts[4]
    if (state === 'LISTENING' && pid) pids.add(pid)
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
      console.log(`Freed port ${port} by killing PID ${pid}`)
    } catch {
      // Ignore already-dead processes.
    }
  }
}

function killUnix() {
  const output = execSync(`lsof -ti tcp:${port}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const pids = output
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean)

  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
      console.log(`Freed port ${port} by killing PID ${pid}`)
    } catch {
      // Ignore already-dead processes.
    }
  }
}

try {
  if (process.platform === 'win32') {
    killWindows()
  } else {
    killUnix()
  }
} catch {
  // No process found for this port (or missing tools). Continue silently.
}

