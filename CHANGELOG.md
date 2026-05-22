# Changelog

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
