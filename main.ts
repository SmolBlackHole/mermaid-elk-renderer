import { loadMermaid, Plugin } from "obsidian";
import { renderMermaidSVGAsync } from "beautiful-mermaid";

// Strip %% elk %% marker for backward compatibility (ELK is built into beautiful-mermaid)
const ELK_MARKER_RE = /^\s*%%\s*elk\s*%%\s*\n?/i;
const PATCH_FLAG = "__mermaidElkMarkerPatched";

type RenderFn = (id: string, source: string, ...rest: unknown[]) => Promise<unknown>;
type MermaidRenderResult = { svg: string; bindFunctions?: (el: Element) => void };

interface MermaidLike extends Record<string, unknown> {
	render: RenderFn;
	mermaidAPI?: MermaidLike;
}

export default class MermaidElkRendererPlugin extends Plugin {
	private _originalMermaid: MermaidLike | null = null;

	async onload() {
		const mermaid = await loadMermaid() as unknown as MermaidLike;
		if (PATCH_FLAG in mermaid) return;

		this.patchMarkerRouting(mermaid);
	}

	onunload() {
		const win = window as Window & { mermaid?: MermaidLike };
		if (this._originalMermaid) {
			win.mermaid = this._originalMermaid;
			this._originalMermaid = null;
		}
	}

	private makeRenderer(fallback: RenderFn, fallbackThis: MermaidLike): RenderFn {
		return async (id: string, source: string, ...rest: unknown[]): Promise<MermaidRenderResult> => {
			const src = typeof source === "string" ? source : String(source ?? "");
			const cleanSource = src.replace(ELK_MARKER_RE, "");

			const style = getComputedStyle(document.body);
			const bg = style.getPropertyValue("--background-primary").trim() || "var(--background-primary)";
			const fg = style.getPropertyValue("--text-normal").trim() || "var(--text-normal)";

			try {
				const svg = await renderMermaidSVGAsync(cleanSource, { bg, fg });
				return { svg };
			} catch {
				return fallback.call(fallbackThis, id, cleanSource, ...rest) as Promise<MermaidRenderResult>;
			}
		};
	}

	private patchMarkerRouting(mermaid: MermaidLike) {
		const win = window as Window & { mermaid?: MermaidLike };
		this._originalMermaid = mermaid;

		const patchedRender = this.makeRenderer(mermaid.render, mermaid);

		let patchedApi: MermaidLike | undefined;
		if (mermaid.mermaidAPI && typeof mermaid.mermaidAPI.render === "function") {
			const api = mermaid.mermaidAPI;
			const patchedApiRender = this.makeRenderer(api.render, api);
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

