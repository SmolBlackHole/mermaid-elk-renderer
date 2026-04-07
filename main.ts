import { loadMermaid, Plugin } from "obsidian";
import elkLayouts from "@mermaid-js/layout-elk";

const ELK_MARKER_RE = /^\s*%%\s*elk\s*%%\s*\n?/i;
const ELK_FRONTMATTER = "---\nconfig:\n  layout: \"elk\"\n---\n";
const PATCH_FLAG = "__mermaidElkMarkerPatched";

type RenderFn = (id: string, source: string, ...rest: unknown[]) => Promise<unknown>;

interface MermaidLike extends Record<string, unknown> {
	render: RenderFn;
	mermaidAPI?: MermaidLike;
	registerLayoutLoaders: (layouts: unknown) => void;
}

export default class MermaidElkRendererPlugin extends Plugin {
	private _originalMermaid: MermaidLike | null = null;

	async onload() {
		const mermaid = await loadMermaid() as unknown as MermaidLike;
		if (PATCH_FLAG in mermaid) return;

		mermaid.registerLayoutLoaders(elkLayouts);
		this.patchMarkerRouting(mermaid);
	}

	onunload() {
		const win = window as Window & { mermaid?: MermaidLike };
		if (this._originalMermaid) {
			win.mermaid = this._originalMermaid;
			this._originalMermaid = null;
		}
	}

	private wrapRender(original: RenderFn, thisArg: MermaidLike): RenderFn {
		return (id: string, source: string, ...rest: unknown[]): Promise<unknown> => {
			const src = typeof source === "string" ? source : String(source ?? "");
			if (!ELK_MARKER_RE.test(src)) {
				return original.call(thisArg, id, source, ...rest);
			}
			const cleanSource = src.replace(ELK_MARKER_RE, "");
			return original.call(thisArg, id, `${ELK_FRONTMATTER}${cleanSource}`, ...rest);
		};
	}

	private patchMarkerRouting(mermaid: MermaidLike) {
		const win = window as Window & { mermaid?: MermaidLike };
		this._originalMermaid = mermaid;

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

		win.mermaid = new Proxy(mermaid, {
			get: (t, prop, receiver) => {
				if (prop === "render") return patchedRender;
				if (prop === "mermaidAPI" && patchedApi) return patchedApi;
				return Reflect.get(t, prop, receiver) as unknown;
			},
			has: (t, prop) => prop === PATCH_FLAG || prop in t,
		});
	}
}

