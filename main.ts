import { loadMermaid, Plugin } from "obsidian";
import elkLayouts from "@mermaid-js/layout-elk";

const ELK_MARKER_LINE_RE = /^%%\s*elk\s*%%$/i;
const INIT_DIRECTIVE_LINE_RE = /^%%\{[\s\S]*\}%%$/;
const FRONTMATTER_DELIMITER = "---";
const FRONTMATTER_RE = /^\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?/;
const ELK_LAYOUT_FRONTMATTER = "---\nconfig:\n  layout: \"elk\"\n---\n";
const PATCH_FLAG = "__mermaidElkMarkerPatched";
const DEBUG_LOGS = true;
const ORDERED_LIST_MARKER_RE = /(^|<br\s*\/?>)(\s*)(\d+)\.(?=\s)/gi;
const QUOTED_LABEL_RE = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
const BRACKET_LABEL_RE = /\[([^[]\]\n]*(?:<br\s*\/?>[^[]\]\n]*)*)\]/gi;

type RenderFn = (id: string, source: string, ...rest: unknown[]) => Promise<unknown>;

interface MermaidLike extends Record<string, unknown> {
	render: RenderFn;
	mermaidAPI?: MermaidLike;
	registerLayoutLoaders?: (layouts: unknown) => void;
}

type MarkerRemovalResult = {
	hasMarker: boolean;
	markerLine: number | null;
	source: string;
};

type PreparedElkSource = {
	hasFrontmatter: boolean;
	markerLine: number;
	sanitizedListLabels: boolean;
	source: string;
};

export default class MermaidElkRendererPlugin extends Plugin {
	private _originalMermaid: MermaidLike | null = null;
	private _previousWindowMermaid: MermaidLike | undefined;
	private _patchedMermaid: MermaidLike | null = null;

	private log(message: string, details?: Record<string, unknown>) {
		if (!DEBUG_LOGS) return;
		if (details) {
			console.log(`${this.manifest.name}: ${message}`, details);
			return;
		}

		console.log(`${this.manifest.name}: ${message}`);
	}

	private sanitizeMarkdownListLabels(source: string): string {
		const escapeOrderedListMarkers = (label: string) =>
			label.replace(ORDERED_LIST_MARKER_RE, "$1$2$3\\.");

		return source
			.replace(QUOTED_LABEL_RE, (match, label: string) => `"${escapeOrderedListMarkers(label)}"`)
			.replace(BRACKET_LABEL_RE, (match, label: string) => `[${escapeOrderedListMarkers(label)}]`);
	}

	private removeElkMarker(source: string): MarkerRemovalResult {
		const lines = source.split(/\r?\n/);
		let frontmatterChecked = false;

		for (let index = 0; index < lines.length; index++) {
			const trimmed = lines[index].trim();

			if (!trimmed) continue;

			if (!frontmatterChecked && trimmed === FRONTMATTER_DELIMITER) {
				frontmatterChecked = true;
				index++;
				while (index < lines.length && lines[index].trim() !== FRONTMATTER_DELIMITER) {
					index++;
				}
				continue;
			}

			frontmatterChecked = true;

			if (INIT_DIRECTIVE_LINE_RE.test(trimmed)) continue;

			if (ELK_MARKER_LINE_RE.test(trimmed)) {
				lines.splice(index, 1);
				return { hasMarker: true, markerLine: index + 1, source: lines.join("\n") };
			}

			return { hasMarker: false, markerLine: null, source };
		}

		return { hasMarker: false, markerLine: null, source };
	}

	private upsertElkLayoutInFrontmatter(body: string): string {
		const lines = body.split(/\r?\n/);
		const configIndex = lines.findIndex((line) => /^config:\s*$/.test(line));

		if (configIndex === -1) {
			return [...lines, "config:", "  layout: \"elk\""].join("\n").replace(/^\n/, "");
		}

		let insertIndex = configIndex + 1;
		for (let index = configIndex + 1; index < lines.length; index++) {
			const line = lines[index];
			if (line.trim() && !/^\s/.test(line)) break;

			if (/^\s+layout\s*:/.test(line)) {
				const indent = line.match(/^\s*/)?.[0] ?? "  ";
				lines[index] = `${indent}layout: "elk"`;
				return lines.join("\n");
			}

			insertIndex = index + 1;
		}

		lines.splice(insertIndex, 0, "  layout: \"elk\"");
		return lines.join("\n");
	}

	private injectElkLayoutConfig(source: string): string {
		const match = source.match(FRONTMATTER_RE);
		if (!match) return `${ELK_LAYOUT_FRONTMATTER}${source}`;

		const updatedBody = this.upsertElkLayoutInFrontmatter(match[1]);
		const rest = source.slice(match[0].length);
		return `${FRONTMATTER_DELIMITER}\n${updatedBody}\n${FRONTMATTER_DELIMITER}\n${rest}`;
	}

	private prepareElkSource(source: string): PreparedElkSource | null {
		const marker = this.removeElkMarker(source);
		if (!marker.hasMarker) return null;

		const hasFrontmatter = FRONTMATTER_RE.test(marker.source);
		const cleanSource = this.sanitizeMarkdownListLabels(marker.source);
		return {
			hasFrontmatter,
			markerLine: marker.markerLine ?? 0,
			sanitizedListLabels: cleanSource !== marker.source,
			source: this.injectElkLayoutConfig(cleanSource),
		};
	}

	private markPatched(mermaid: MermaidLike) {
		try {
			Object.defineProperty(mermaid, PATCH_FLAG, { value: true, configurable: true });
		} catch {
			// Non-extensible Mermaid objects are still protected by the proxy `has` trap.
		}
	}

	private clearPatchFlag(mermaid: MermaidLike) {
		try {
			delete mermaid[PATCH_FLAG];
		} catch {
			// Ignore cleanup failures from non-configurable host objects.
		}
	}

	async onload() {
		this.log(`Loading ${this.manifest.name} ${this.manifest.version}`);
		const mermaid = await loadMermaid() as unknown as MermaidLike;
		if (PATCH_FLAG in mermaid) {
			this.log("mermaid already patched, skipping");
			return;
		}

		if (typeof mermaid.registerLayoutLoaders === "function") {
			mermaid.registerLayoutLoaders(elkLayouts);
			this.log("registered ELK layout loaders");
		} else {
			this.log("registerLayoutLoaders unavailable on Obsidian Mermaid instance");
		}

		this.patchMarkerRouting(mermaid);
		this.log("renderer patch installed", { hasMermaidAPI: Boolean(mermaid.mermaidAPI) });
	}

	onunload() {
		this.log(`Unloading ${this.manifest.name} ${this.manifest.version}`);
		const win = window as Window & { mermaid?: MermaidLike };
		if (this._originalMermaid && win.mermaid === this._patchedMermaid) {
			win.mermaid = this._previousWindowMermaid ?? this._originalMermaid;
			this.clearPatchFlag(this._originalMermaid);
			this._originalMermaid = null;
			this._previousWindowMermaid = undefined;
			this._patchedMermaid = null;
			this.log("renderer patch restored");
		} else if (this._originalMermaid) {
			this.log("renderer patch not restored because window.mermaid changed after patching");
		}
	}

	private wrapRender(original: RenderFn, thisArg: MermaidLike): RenderFn {
		return (id: string, source: string, ...rest: unknown[]): Promise<unknown> => {
			const src = typeof source === "string" ? source : String(source ?? "");
			const prepared = this.prepareElkSource(src);
			if (!prepared) {
				return original.call(thisArg, id, source, ...rest);
			}

			this.log("routing diagram through ELK", {
				id,
				hasFrontmatter: prepared.hasFrontmatter,
				markerLine: prepared.markerLine,
				sanitizedListLabels: prepared.sanitizedListLabels,
			});
			return original.call(thisArg, id, prepared.source, ...rest);
		};
	}

	private patchMarkerRouting(mermaid: MermaidLike) {
		const win = window as Window & { mermaid?: MermaidLike };
		this._originalMermaid = mermaid;
		this._previousWindowMermaid = win.mermaid;
		this.markPatched(mermaid);

		const patchedRender = this.wrapRender(mermaid.render, mermaid);

		let patchedApi: MermaidLike | undefined;
		if (mermaid.mermaidAPI && typeof mermaid.mermaidAPI.render === "function") {
			const api = mermaid.mermaidAPI;
			const patchedApiRender = this.wrapRender(api.render, api);
			patchedApi = new Proxy(api, {
				get: (t, prop, receiver) => prop === "render" ? patchedApiRender : Reflect.get(t, prop, receiver) as unknown,
				has: (t, prop) => prop === PATCH_FLAG || prop in t,
			});
		}

		const patchedMermaid = new Proxy(mermaid, {
			get: (t, prop, receiver) => {
				if (prop === "render") return patchedRender;
				if (prop === "mermaidAPI" && patchedApi) return patchedApi;
				return Reflect.get(t, prop, receiver) as unknown;
			},
			has: (t, prop) => prop === PATCH_FLAG || prop in t,
		});

		this._patchedMermaid = patchedMermaid;
		win.mermaid = patchedMermaid;
	}
}

