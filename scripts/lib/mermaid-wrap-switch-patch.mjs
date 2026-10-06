/**
 * Build-time patch for the mermaid edge-label wrap-switch, mirroring the fix
 * Obsidian applies to their own bundled mermaid.min.js (their build header
 * documents it: replace `f.width===r&&` with
 * `Math.round(f.width)===Math.round(r)&&` next to the "break-spaces" branch).
 *
 * Why: mermaid 11.x clamps edge-label foreignObjects to the measured div width
 * and only switches to `break-spaces` wrapping when the clamped measurement
 * equals the 200px cap EXACTLY (strict float equality). In real environments
 * the clamped table-cell measurement can land on a fraction (199.6px etc.),
 * the switch never fires, the label stays single-line `nowrap`, and the text
 * is clipped mid-glyph by the foreignObject viewport.
 *
 * mermaid ships the same logic in two shapes and the plugin bundle may pull
 * either one in:
 * - `dist/chunks/mermaid.core/*.mjs` (unminified, resolved via the "import"
 *   export condition as `const bbox = await fastdom_default.measure(...);
 *   if (bbox.width === width) {`), and
 * - `dist/chunks/mermaid.esm.min/*.mjs` (minified
 *   `(await X.measure(()=>Y.node().getBoundingClientRect())).width===n&&(...)`).
 *
 * The regexes are identifier-flexible so they survive esbuild minification of
 * the bundled output; callers must assert the replacement count so a mermaid
 * upgrade that changes these shapes fails loudly instead of silently dropping
 * the fix.
 */

// Minified shape: `(await X.measure(()=>Y.node().getBoundingClientRect())).width===n&&(`
const WRAP_SWITCH_MIN_RE =
	/\((await\s+[$\w]+\.measure\(\(\)\s*=>\s*[$\w]+\.node\(\)\.getBoundingClientRect\(\)\))\)\.width===([$_\w]+)&&/g;

// Source shape: `const bbox = await fastdom_default.measure(() => div.node().getBoundingClientRect()); if (bbox.width === width) {`
const WRAP_SWITCH_SRC_RE =
	/(const|let|var)\s+([$_\w]+)\s*=\s*(await\s+[$\w]+\.measure\(\(\)\s*=>\s*[$\w]+\.node\(\)\.getBoundingClientRect\(\)\));\s*if\s*\(\2\.width\s*===\s*([$_\w]+)\)\s*\{/g;

/**
 * @param {string} contents file content to patch
 * @returns {{ contents: string, count: number }}
 */
export function patchMermaidWrapSwitch(contents) {
	let count = 0;
	let patched = contents.replace(WRAP_SWITCH_MIN_RE, (_, measured, expected) => {
		count++;
		return `Math.round((${measured}).width)===Math.round(${expected})&&`;
	});
	patched = patched.replace(
		WRAP_SWITCH_SRC_RE,
		(_, kind, varName, measured, expected) => {
			count++;
			return `${kind} ${varName} = ${measured};if (Math.round(${varName}.width) === Math.round(${expected})) {`;
		},
	);
	return { contents: patched, count };
}
