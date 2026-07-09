# Support

Back to the main guide: [README](../README.md)

## Settings page

The plugin settings include a **Support** section with a repository link, an issue tracker link, and a **Copy debug report** button

- [GitHub repository](https://github.com/SmolBlackHole/mermaid-elk-renderer)
- [Issue tracker](https://github.com/SmolBlackHole/mermaid-elk-renderer/issues)

## Reporting a bug

Copy the debug report first (button in plugin settings), then paste it into a new issue. Include the Mermaid snippet that fails, what you expected, and what happened instead

> [!bug] Good bug reports are faster bug fixes
> The debug report gives us your plugin version, Obsidian version, platform, settings, and recent log entries. With the failing snippet attached, that is usually enough to reproduce

## Privacy

The plugin keeps logs in memory. Nothing is sent anywhere. You decide what to share

> [!info] No telemetry
> The debug report is manual copy only. No data leaves your machine unless you paste it into an issue

## Something looks wrong

1. Reload or restart Obsidian
2. Test the same diagram with and without `%% elk %%`
3. Enable **Debug logging** if you need more detail
4. Copy the debug report
5. Open an issue with the Mermaid snippet attached
