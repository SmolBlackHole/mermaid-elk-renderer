# Support, bug reports, and debug reports

Back to the main guide: [README](../README.md)

## Where to click first

The settings page includes a **Support** section with:

- a repository link
- an issue tracker link
- a **Copy debug report** button

Repository:

- [GitHub repository](https://github.com/SmolBlackHole/mermaid-elk-renderer)
- [Issue tracker](https://github.com/SmolBlackHole/mermaid-elk-renderer/issues)

## Reporting a bug

When opening an issue, use **Copy debug report** first and paste the result into the GitHub issue template.

Direct link:

- [Open issues](https://github.com/SmolBlackHole/mermaid-elk-renderer/issues)

This gives the report a useful baseline:

- plugin version
- Obsidian version
- platform label
- current settings
- recent local log entries

> [!bug] Good bug reports are faster bug fixes
> Include the Mermaid snippet that fails, what you expected, and what actually happened.

## Privacy

The plugin keeps logs locally in memory and does not upload them anywhere.
You decide what to share.

> [!info] No telemetry
> The debug report is manual copy only.
> Nothing is sent automatically.

## When something looks weird

1. Reload or restart Obsidian.
2. Test the same diagram with and without `%% elk %%`.
3. If needed, enable **Debug logging**.
4. Copy the debug report.
5. Open an issue with the Mermaid snippet attached.
