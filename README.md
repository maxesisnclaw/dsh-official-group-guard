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

## Boundary (important)

This is **visual occlusion, not access control**: the catalogue still reaches the browser (visible in
devtools) and the server is unchanged. Real restriction has to happen server-side (e.g. an egress
relay that only accepts requests under specific conditions).

## License

MIT
