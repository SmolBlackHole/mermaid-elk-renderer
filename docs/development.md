# Development notes

Back to the main guide: [README](../README.md)

## Project structure

The plugin is split into small modules:

- `src/main.ts` coordinates plugin lifecycle, settings, and report generation.
- `src/settings.ts` renders the Obsidian settings UI.
- `src/settings-data.ts` defines settings, defaults, and normalization.
- `src/renderer.ts` contains pure Mermaid source transformation logic.
- `src/mermaid-provider.ts` selects Obsidian Mermaid or bundled Mermaid.
- `src/renderer-patch.ts` installs and restores the Mermaid proxy.
- `src/preview-refresh.ts` rerenders open Markdown previews.
- `src/logger.ts` stores recent logs and drives the debug report.

## Common commands

```bash
npm test
npm run lint
npm run build
```

## Release files

The release artifacts expected by Obsidian are:

- `main.js`
- `manifest.json`
- `styles.css`

## Notes

The plugin supports two Mermaid paths:

- Obsidian's bundled Mermaid by default
- bundled Mermaid `11.15.0` as an optional compatibility path for newer diagram types
