import { loadMermaid, Plugin } from "obsidian";
import elkLayouts from "@mermaid-js/layout-elk";

const ELK_MARKER_RE = /^\s*%%\s*elk\s*%%\s*\n?/i;
const ELK_FRONTMATTER = "---\nconfig:\n  layout: \"elk\"\n---\n";
const PATCH_FLAG = "__mermaidElkMarkerPatched";
const ORIG_RENDER_KEY = "__mermaidElkOriginalRender";
const ORIG_API_RENDER_KEY = "__mermaidElkOriginalApiRender";

type RenderFn = (id: string, source: string, ...rest: unknown[]) => Promise<unknown>;

interface MermaidLike extends Record<string, unknown> {
	render: RenderFn;
	mermaidAPI?: MermaidLike;
	registerLayoutLoaders: (layouts: unknown) => void;
}

export default class MermaidElkRendererPlugin extends Plugin {
	async onload() {
		const globalMermaid = await loadMermaid() as unknown as MermaidLike;
		globalMermaid.registerLayoutLoaders(elkLayouts);

		this.patchMarkerRouting(globalMermaid);
	}

	onunload() {
		const win = window as Window & { mermaid?: MermaidLike };
		const mermaid = win.mermaid;
		if (!mermaid) return;

		const originalRender = mermaid[ORIG_RENDER_KEY];
		if (typeof originalRender === "function") {
			mermaid.render = originalRender as RenderFn;
			delete mermaid[ORIG_RENDER_KEY];
		}

		if (mermaid.mermaidAPI) {
			const originalApiRender = mermaid.mermaidAPI[ORIG_API_RENDER_KEY];
			if (typeof originalApiRender === "function") {
				mermaid.mermaidAPI.render = originalApiRender as RenderFn;
				delete mermaid.mermaidAPI[ORIG_API_RENDER_KEY];
			}
		}
	}

	private patchMarkerRouting(mermaid: MermaidLike) {
		if (typeof mermaid.render !== "function") return;
		if (PATCH_FLAG in mermaid.render) return;

		const originalRender = mermaid.render.bind(mermaid);
		mermaid[ORIG_RENDER_KEY] = originalRender;

		const originalApiRender = mermaid.mermaidAPI && typeof mermaid.mermaidAPI.render === "function"
			? mermaid.mermaidAPI.render.bind(mermaid.mermaidAPI)
			: null;
		mermaid[ORIG_API_RENDER_KEY] = originalApiRender;

		const route = (original: RenderFn, id: string, source: string, ...rest: unknown[]): Promise<unknown> => {
			const src = typeof source === "string" ? source : String(source ?? "");

			if (!ELK_MARKER_RE.test(src)) {
				return original(id, source, ...rest);
			}

			const cleanSource = src.replace(ELK_MARKER_RE, "");
			const transformed = `${ELK_FRONTMATTER}${cleanSource}`;
			return original(id, transformed, ...rest);
		};

		const patchedRender = (id: string, source: string, ...rest: unknown[]): Promise<unknown> =>
			route(mermaid[ORIG_RENDER_KEY] as RenderFn, id, source, ...rest);
		Object.defineProperty(patchedRender, PATCH_FLAG, { value: true, configurable: true });
		mermaid.render = patchedRender;

		if (mermaid.mermaidAPI && originalApiRender) {
			const api = mermaid.mermaidAPI;
			const patchedApiRender = (id: string, source: string, ...rest: unknown[]): Promise<unknown> =>
				route(api[ORIG_API_RENDER_KEY] as RenderFn, id, source, ...rest);
			Object.defineProperty(patchedApiRender, PATCH_FLAG, { value: true, configurable: true });
			api.render = patchedApiRender;
		}
	}
}

