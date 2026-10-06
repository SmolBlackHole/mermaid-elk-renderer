# Contributing

Use `dev` as the base branch for changes and open pull requests against `dev`.
Keep changes focused and include a regression test when fixing a bug.

## Scope of contributions

Fixes and improvements to the plugin itself are welcome. This includes its
Obsidian integration, ELK routing, settings, and dependency updates.

This plugin bundles Mermaid and enables ELK. It does not maintain a Mermaid
fork. Fixes for bugs in Mermaid itself belong upstream. I will reject PRs that
patch Mermaid's source or generated code, or add new plugin-side workarounds for
those bugs, even if the workaround works. Please do not submit these fixes here.
Report those bugs and propose fixes in the
[Mermaid repository](https://github.com/mermaid-js/mermaid). Once
an upstream fix is released, the plugin can pick it up through a dependency update.

The plugin already has some workarounds needed to make it function in Obsidian.
Maintaining those is in scope. Their presence does not mean I will accept new
workarounds for bugs that belong upstream.

I didn't think I'd have to spell this out: Do not weaken the CI audit gate to
make a PR pass. Report existing dependency advisories separately from the
problem your PR addresses...

## Reproducing rendering problems

For rendering changes, include a minimal Mermaid diagram and before/after
screenshots in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md).
Record the Mermaid provider, versions, and settings needed to reproduce it.

Include the plugin version or commit before and after the change, the Obsidian
and operating system versions, and the actual Mermaid version for each provider
tested. If a version is unknown, say so. For comparisons outside Obsidian, include
the browser version and a reproducible URL. Include a debug report when relevant.

## AI assistance and ownership

AI assistance is allowed for code, tests, documentation, and PR descriptions.
Disclose whether you used it in the pull request template. If you did, include
the model and version, the generation date, what was generated, and what you
changed. For example:

```txt
AI assistance: Yes
Model: GPT-5.6-Sol XHigh
Date: 2024-06-01
Generated content: PR description and test cases
Modifications: Minor edits for clarity and formatting
```

Review everything you submit, including generated content. You must be able to
explain how the changes work, justify why they are needed, and discuss their
tradeoffs. You are responsible for the contribution's correctness and the
claims made in the PR.

Complete the AI disclosure and ownership checkboxes for every PR. Contributions
with undisclosed AI assistance, unreviewed generated content, or changes the
contributor cannot explain or justify will not be accepted.

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
