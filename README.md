# dsh-official-group-guard

English | [中文](README.zh.md)

Hide the DeepSeek *official* model group in the dsh UI by default; press **↑↑↓↓←→←→BA** to reveal it.

## Why

On an intranet deployment the DeepSeek official models are often a **personal route** (e.g. relayed
out through a workstation). Colleagues should not see or pick them, while the owner still needs
them. This plugin keeps the official group hidden and reveals it only in the browser where the
Konami code was entered. Nothing under `node_modules` is touched and there is no server-side
change — same injection technique as `dsh-download-button` / `dsh-force-motion`.

## What it covers

| Surface | Behaviour |
|---|---|
| Composer model picker | Hides the official group; **keeps it visible when the current session already runs an official model** (otherwise you cannot see your own selection) |
| Settings → Models page | Hides the official provider row |

## Install

```sh
dsh plugin --profile web add github:maxesisnclaw/dsh-official-group-guard
```

Then restart dsh.

## Usage

1. By default the official group is not rendered.
2. Press **↑ ↑ ↓ ↓ ← → ← → B A** on the page → revealed (a small toast confirms). The state lives in
   this browser's `localStorage` under `dsh.official-group.visible`.
3. Press again to hide.
4. Skip the code: run `localStorage.setItem('dsh.official-group.visible','1')` in the console and reload.

## How it survives upgrades

dsh's CSS-module class names look like `<hash>_group` / `<hash>_rowCard`: the hash changes between
builds but the key suffix does not, so selectors match on the suffix (`[class*="_group"]` plus an
exact `classList` suffix check) and a `MutationObserver` re-applies after every render.


## Iterating on the injected UI

The injected style/script lives in an **external file `client.html`**, read per index request (mtime
cached): edit it and hard-reload the browser — **no dsh restart needed**. Only changes to the plugin
code itself (`index.js` / `cordis.patch.yml`) require a restart. Override the path with
`DSH_OFFICIAL_GROUP_GUARD_CLIENT`.

## Known timing issue and how it is handled

The picker stores its measured position in component state (`style: menuPos ?? MEASURE_STYLE`), and
the option data (`title`) can arrive after the first paint — hiding after that measurement shows up
as a floating menu. So the CSS has two paths (option-`title` match plus a JS `data-dsh-ogg` tag) and
**dispatches `resize` whenever the hidden set changes** so the component re-measures (it listens to
`resize`/`scroll`), plus a few extra re-applies on the frames right after the menu appears.

## Boundary (important)

This is **visual occlusion, not access control**: the catalogue still reaches the browser (visible in
devtools) and the server is unchanged. Real restriction has to happen server-side (e.g. an egress
relay that only accepts requests under specific conditions).

## License

MIT
