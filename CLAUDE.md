# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static website (served at ai.btdat.io.vn) that presents the **AI-SDLC v5.9** process (14 steps B1–B14, 5 phases, 8 gates) plus its library of `.md` templates. All content and docs are in Vietnamese. Zero dependencies — plain Node.js, no `package.json`, no npm.

## Commands

```bash
node build.js            # regenerate everything under public/ (HTML pages, raw .md copies, both .zip bundles)
node server.js           # static server on http://localhost:3200 (PORT env overrides); reads from disk per request, no restart needed after build
node test-scrollspy.js [url]   # headless-Chrome check that left/top nav highlight follows scroll; needs server running and Chrome at C:\Program Files\Google\Chrome\Application\chrome.exe
```

There is no lint or unit-test suite. `test-scrollspy.js` (uses `minws.js`, a tiny CDP WebSocket client) is the only automated check.

## Architecture

`build.js` is a single-file generator: it reads `src/` + `templates/` + `vi-du-ins/` and writes all of `public/`. **Never hand-edit generated files in `public/`** (`index.html`, `mau/*.html`, `mau/raw/`, `ins/*.html`, `ins/raw/`, `assets/mau/*.zip`, `assets/ins/*.zip`). `public/assets/` PDFs/TXT/flowchart PNGs are source assets (the original PDF must not be modified). Generated output is committed.

Sources of truth:
- `src/data.js` — editorial content (meta, the 14 steps, gates, B2 groups, appendices, assets, gaps, KPI…).
- `src/steps-detail.json` — the 82 detail-table rows extracted from the PDF. Each row is `[step, who, how, notes, formLabel, {"links":[{id,label}]}]`; each link `id` must match a template id in `src/templates.json`, otherwise it renders as plain text (no broken link).
- `src/templates.json` — registry of template groups/files (`id`, `file` relative to `templates/`, `title`, `for`). Adding a template = create `.md` in `templates/` + add an entry here + rebuild.
- `src/md.js` — minimal markdown→HTML renderer; `MD_LINK_MAP` rewrites references like `rules/x.md` inside templates into `/mau/<id>.html` links.
- `src/ins-examples.json` + `vi-du-ins/` — "filled-in real example" set (INS Platform, anonymized), rendered to `/ins/`. `vi-du-ins/` is a verbatim copy from an external project; don't edit content. In examples, `> TODO` (no data) and `⚠️` (doc diverges from code) are intentional — don't fill them in.
- `src/flow-mapping.json` — B1..B14 → flowchart PNG in `public/assets/luu-do/`.
- `src/styles.css` — inlined into every page.
- `refs/` — external reference material (ASVS, MADR, spec-kit); not used by the build.

Key mechanics inside `build.js`:
- Main page = `shell()` + section functions (`hero`, `pipeline`, `stepBlock`, `gates`, `b2`, …, `insExample`). New top-level sections must be added to `NAV` **and** to `SECTION_IDS` in the scroll-spy script inside `shell()`.
- Popup viewer: `modalLayer()` embeds every template as `<template id="tpl-<id>">` in `index.html` so links with `data-form` open a modal without fetch/iframe (works from `file://`). Right sidebar links stay normal links.
- The ◆ "has a real filled example" marker is derived, not hard-coded: `insByStep` (from the example's `for` field, **first `Bx` only** — e.g. dor-dod mentions B7 but belongs to B2) and `insByOrigin` (via `insOriginTemplate()`, matching basenames case-insensitively with `_`↔`-`).
- `zip.js` is a hand-written ZIP writer used to bundle `templates/` and `vi-du-ins/`.

## Renumbering appendix items (PL 3.x)

When template numbering changes, update all four places or they drift: `src/templates.json` (`for` fields/order), `src/md.js` (`MD_LINK_MAP`), `src/data.js` (`b2Groups` numbers, B2 `steps.out`, `appendices`, `assets`, `gaps`), `src/steps-detail.json` (`"3.x …"` labels and `"PL 3.x"` strings). Also fix cross-references in templates such as `phu-luc/PL3-bo-tai-lieu-b2.md`, `b2/dor-dod.md`, `b2/docs-index.md`.

## Deployment

Runs on the user's Windows PC (host `datcty`): `start.bat` (idempotent, location-independent via `%~dp0`, `node` from PATH, logs to `server.log`) starts `server.js` on :3200. Public access is via the Cloudflare Tunnel `cms-ai-datcty` (Windows service, token-managed remotely); its Public Hostname `ai.btdat.io.vn → http://localhost:3200` is set in the Cloudflare Zero Trust dashboard, not in a local `config.yml`. The `~/.cloudflared/config.yml` and `datel` instructions in `README.md`/`GUIDE.md` describe the old host and are outdated. Auto-start after reboot needs a shortcut to `start.bat` in `shell:startup`. Deploying content = commit + `node build.js` (the server reads `public/` from disk, no restart). More detail in `README.md` and `GUIDE.md`.
