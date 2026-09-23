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

test('injects the external client markup into <head>, before app code', () => {
  const tap = tapIndexOf()
  const page = '<!doctype html><html><head><title>dsh</title></head><body></body></html>'
  const out = tap(page)
  assert.match(out, /dsh-official-group-guard/)
  assert.match(out, /<style id="dsh-official-group-guard-style">/)
  assert.match(out, /<script>/)
  assert.ok(out.indexOf('dsh-official-group-guard-style') < out.indexOf('</head>'))
})

test('hides the picker group by option title (first paint) and by JS tag (late data)', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /html\.dsh-ogg-hide \[class\$="_group"\]:has\(button\[title\*="deepseek" i\]\)/)
  assert.match(out, /html\.dsh-ogg-hide \[data-dsh-ogg="1"\]:not\(\[data-dsh-ogg-keep="1"\]\)/)
})

test('re-measures the menu after hiding so it cannot stay floating', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /window\.dispatchEvent\(new Event\('resize'\)\)/)
  assert.match(out, /onMenuAppear/)
  assert.match(out, /\[0, 60, 200, 500, 1200\]/)
})

test('keeps a session that already runs an official model usable', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /aria-checked/)
  assert.match(out, /dshOggKeep/)
})

test('ships the konami sequence, the persistence key and the settings-page rule', () => {
  const out = tapIndexOf()('<html><head></head><body></body></html>')
  assert.match(out, /arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a/)
  assert.match(out, /dsh\.official-group\.visible/)
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
