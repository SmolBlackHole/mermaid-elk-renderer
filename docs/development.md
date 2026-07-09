# Development

Back to the main guide: [README](../README.md)

## Project structure

```
src/
  main.ts              plugin lifecycle, settings, debug reports
  settings.ts          Obsidian settings tab UI
  settings-data.ts     settings types, defaults, normalization
  renderer.ts          Mermaid source transformations
  mermaid-provider.ts  selects Obsidian Mermaid or bundled Mermaid 11
  renderer-patch.ts    installs/restores the Mermaid proxy
  preview-refresh.ts   rerenders open Markdown previews
  logger.ts            in-memory log buffer for debug reports
  mermaid-types.ts     shared TypeScript interfaces
```

## Commands

```bash
npm test              # run tests
npm run lint          # lint sources
npm run build         # typecheck + bundle
npm run render-svgs   # regenerate prerendered SVGs and examples doc
```

## Release artifacts

The three files Obsidian needs:

- `main.js`
- `manifest.json`
- `styles.css`

## Mermaid paths

Two rendering paths, controlled by the **Use bundled Mermaid 11** setting:

- Obsidian's built-in Mermaid (default)
- Bundled Mermaid 11.16.0 (for newer diagram types)

## Prerendered assets

SVGs in `assets/prerendered/` are generated from `.mmd` sources in `assets/prerendered-src/`. Metadata in `assets/prerendered-meta.json` drives the examples doc. Run `npm run render-svgs` after adding or changing a source file.
