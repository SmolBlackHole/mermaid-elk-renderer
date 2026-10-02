# Contributing

Use `dev` as the base branch for changes and open pull requests against `dev`.
Keep changes focused and include a regression test when fixing a bug.

## Local checks

Use Node.js 22 or newer and install the locked dependencies with `npm ci`.
Before opening a pull request, run:

```sh
npm audit
npm test
npm run lint
npm run build
```

The [development guide](docs/development.md) describes the project structure,
rendering paths, and example generation. Test rendering changes in an Obsidian
test vault with both the built-in and bundled Mermaid providers. Changes to
settings must preserve support for the minimum Obsidian version in `manifest.json`.

## Reporting problems

Use the [issue tracker](https://github.com/SmolBlackHole/mermaid-elk-renderer/issues)
and include a minimal diagram, plugin and Obsidian versions, and the selected
Mermaid provider. See [support and debug reports](docs/support.md) for collecting
diagnostics. Do not include private note contents in reports.
