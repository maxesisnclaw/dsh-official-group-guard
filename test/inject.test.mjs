import assert from 'node:assert/strict'
import { test } from 'node:test'

import { apply, name } from '../index.js'

function tapIndexOf() {
  let tap = null
  const ctx = {
    inject: (services, callback) => {
      assert.deepEqual(services, ['webServer'])
      callback({ webServer: { tapIndex: (fn) => { tap = fn } } })
    },
  }
  apply(ctx)
  assert.equal(typeof tap, 'function', 'plugin must tap the served index page')
  return tap
}

test('plugin exposes a name', () => {
  assert.equal(name, 'dsh-official-group-guard')
})

test('injects the guard into <head>, before app code', () => {
  const tap = tapIndexOf()
  const page = '<!doctype html><html><head><title>dsh</title></head><body></body></html>'
  const out = tap(page)
  assert.match(out, /dsh-official-group-guard/)
  assert.ok(out.indexOf('dsh-official-group-guard') < out.indexOf('</head>'))
})

test('ships the konami sequence and the persistence key', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a/)
  assert.match(out, /dsh\.official-group\.visible/)
})

test('hides by default and only reveals on demand', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /localStorage\.getItem\(STORAGE_KEY\) === '1'/)
  assert.match(out, /hide\(group, !show && !selected\)/)
})

test('is idempotent', () => {
  const tap = tapIndexOf()
  const page = '<html><head></head><body></body></html>'
  const once = tap(page)
  assert.equal(tap(once), once)
})

test('falls back to prefixing without <head>', () => {
  const tap = tapIndexOf()
  assert.ok(tap('<html><body></body></html>').startsWith('<script>'))
})
