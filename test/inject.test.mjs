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

test('injects style + script into <head>, before app code', () => {
  const tap = tapIndexOf()
  const page = '<!doctype html><html><head><title>dsh</title></head><body></body></html>'
  const out = tap(page)
  assert.match(out, /dsh-official-group-guard/)
  assert.match(out, /<style id="dsh-official-group-guard-style">/)
  assert.ok(out.indexOf('dsh-official-group-guard') < out.indexOf('</head>'))
})

test('hides the picker group in CSS so the menu never mis-measures', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /html\.dsh-ogg-hide \[class\$="_group"\]/)
  assert.match(out, /:has\(button\[title\*="deepseek" i\]\)/)
  assert.match(out, /:not\(:has\(button\[aria-checked="true"\]\)\)/)
})

test('ships the konami sequence, the persistence key and the fallback', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a/)
  assert.match(out, /dsh\.official-group\.visible/)
  assert.match(out, /SUPPORTS_HAS/)
  assert.match(out, /window\.dispatchEvent\(new Event\('resize'\)\)/)
})

test('hides the settings provider row by row name', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /hasSuffix\(row, '_rowCard'\)/)
  assert.match(out, /hasSuffix\(el, '_rowName'\)/)
})

test('is idempotent', () => {
  const tap = tapIndexOf()
  const page = '<html><head></head><body></body></html>'
  const once = tap(page)
  assert.equal(tap(once), once)
})

test('falls back to prefixing without <head>', () => {
  const tap = tapIndexOf()
  assert.ok(tap('<html><body></body></html>').startsWith('<style'))
})
