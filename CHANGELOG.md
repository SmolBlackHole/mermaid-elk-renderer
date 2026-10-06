# Changelog

## Unreleased

- Applied a build-time fix to the bundled Mermaid runtime that mirrors the manual patch Obsidian ships in their own Mermaid build: the edge-label wrap switch now compares the measured label width with a rounded value instead of strict equality, so long edge labels (CJK text in particular) wrap to a second line on setups where the measurement lands on a sub-pixel fraction instead of being clipped mid-glyph. The build asserts the patch site exists and fails loudly if a Mermaid upgrade changes the bundled code shape.

## 1.2.3

- Updated bundled Mermaid to 11.17.0 and refreshed security fixes in locked dependencies.
- Updated ESLint and Vitest while retaining TypeScript 6 and ELK 0.2.2.
- Removed unused renderer styles and deprecated settings calls without dropping the legacy settings UI.
- Added pull request validation, a contributing guide, and Dependabot updates targeting `dev`.
- Added regression coverage for settings compatibility, debug logging, and release metadata.
- Added the standalone negative-year Gantt converter and shared EditorConfig settings.

## 1.2.2

- Updated development tooling and GitHub Actions dependencies.
- Added declarative settings for Obsidian 1.13+ while retaining the existing settings UI for older Obsidian versions.
- Restored the release compatibility map for 1.2.1 and added the 1.2.2 entry.

## 1.2.1

- Fixed ELK frontmatter insertion when an existing `config:` block uses non-default indentation.
- Added safe Mermaid render diagnostics for routing, diagram type, and Gantt date metadata.
- Migrated tests to Vitest and added Fast-check properties for frontmatter indentation and settings normalization.
- Updated locked Mermaid dependencies to 11.16.1 and added Dependabot for npm and GitHub Actions updates.

## 1.2.0

- Updated bundled Mermaid to 11.16.0 and @mermaid-js/layout-elk to 0.2.2.
- Reorganized the settings tab into clear sections (General, Routing, Styling, Experimental, Support, Danger zone).
- Added live example files in `examples/` that can be copied into any vault.
- Added six new prerendered SVG showcases (cynefin, railroad IR, railroad EBNF, railroad PEG, pie, treeView).
- Added `npm run render-svgs` script that renders all .mmd sources to SVG and regenerates the examples doc page.
- Added `assets/prerendered-meta.json` to centralize diagram metadata.
- Rewrote README for clarity, embedded `example_1.png` as hero image, added settings table.
- Reworded the documentation files for clarity, added support and development sections.

## 1.1.0

- Added optional bundled Mermaid 11 rendering for newer diagram support.
- Added global defaults for Mermaid `look` and `theme` on routed diagrams while preserving diagram-specific config.
- Added regex override controls in a dedicated danger zone for advanced label edge cases.
- Added local debug logging, copyable debug reports, and support links in the settings tab.
- Improved preview rerender behavior when settings change and when the plugin is enabled or disabled.
- Improved compatibility handling for ordered labels, multiline labels, and unsupported beta diagram types.

## 1.0.0

- Initial standalone release of Mermaid ELK Renderer.
- ELK layout registration via `@mermaid-js/layout-elk`.
- Per-diagram ELK activation using `%% elk %%` marker in Mermaid blocks.
