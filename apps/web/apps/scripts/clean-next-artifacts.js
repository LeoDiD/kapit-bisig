#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const targets = ['.next', '.next-app']
const maxAttempts = 6
const retryDelayMs = 750
const ignoredLockedEntries = new Set(['trace'])

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function isRetryableError(error) {
  const code = error && typeof error === 'object' ? error.code : undefined
  return code === 'EPERM' || code === 'EBUSY' || code === 'ENOTEMPTY'
}

function shouldIgnoreLockedEntry(error) {
  if (!isRetryableError(error)) return false
  const targetPath = error && typeof error === 'object' ? error.path : ''
  if (typeof targetPath !== 'string') return false
  return ignoredLockedEntries.has(path.basename(targetPath))
}

function removePath(absolutePath) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      fs.rmSync(absolutePath, { recursive: true, force: true })
      return
    } catch (error) {
      if (shouldIgnoreLockedEntry(error)) {
        console.warn(`Skipping locked artifact: ${path.relative(root, absolutePath) || path.basename(absolutePath)}`)
        return
      }

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error
      }

      console.warn(`Retrying cleanup for ${path.relative(root, absolutePath) || path.basename(absolutePath)} (${attempt}/${maxAttempts})...`)
      sleep(retryDelayMs)
    }
  }
}

function removeTargetContents(absolutePath) {
  if (!fs.existsSync(absolutePath)) return

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true })
  for (const entry of entries) {
    removePath(path.join(absolutePath, entry.name))
  }
}

function removeTarget(dirName) {
  const absolutePath = path.join(root, dirName)
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      fs.rmSync(absolutePath, { recursive: true, force: true })
      return
    } catch (error) {
      if (shouldIgnoreLockedEntry(error)) {
        console.warn(`Partial cleanup for ${dirName}; locked trace file will be reused.`)
        removeTargetContents(absolutePath)
        return
      }

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error
      }

      console.warn(`Retrying cleanup for ${dirName} (${attempt}/${maxAttempts})...`)
      sleep(retryDelayMs)
    }
  }
}

try {
  for (const target of targets) {
    removeTarget(target)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to clean Next artifacts: ${message}`)
  process.exit(1)
}
