import { loadMermaid, Plugin } from "obsidian";
import elkLayouts from "@mermaid-js/layout-elk";

const ELK_MARKER_RE = /^\s*%%\s*elk\s*%%\s*\n?/i;
const ELK_FRONTMATTER = "---\nconfig:\n  layout: \"elk\"\n---\n";
const PATCH_FLAG = "__mermaidElkMarkerPatched";
const ORIG_RENDER_KEY = "__mermaidElkOriginalRender";
const ORIG_API_RENDER_KEY = "__mermaidElkOriginalApiRender";

export default class MermaidElkRendererPlugin extends Plugin {
	async onload() {
		const globalMermaid = await loadMermaid();
		globalMermaid.registerLayoutLoaders(elkLayouts);

		this.patchMarkerRouting(globalMermaid);
	}

	onunload() {
		const mermaid = (window as any).mermaid;
		if (!mermaid) return;

		const originalRender = (mermaid as any)[ORIG_RENDER_KEY];
		if (typeof originalRender === "function") {
			mermaid.render = originalRender;
			delete (mermaid as any)[ORIG_RENDER_KEY];
		}

		if (mermaid.mermaidAPI) {
			const originalApiRender = (mermaid as any)[ORIG_API_RENDER_KEY];
			if (typeof originalApiRender === "function") {
				mermaid.mermaidAPI.render = originalApiRender;
				delete (mermaid as any)[ORIG_API_RENDER_KEY];
			}
		}
	}

	private patchMarkerRouting(mermaid: any) {
		if (!mermaid || typeof mermaid.render !== "function") return;

		if (mermaid.render && mermaid.render[PATCH_FLAG]) return;

		const originalRender = mermaid.render.bind(mermaid);
		(mermaid as any)[ORIG_RENDER_KEY] = originalRender;

		const originalApiRender = mermaid.mermaidAPI && typeof mermaid.mermaidAPI.render === "function"
			? mermaid.mermaidAPI.render.bind(mermaid.mermaidAPI)
			: null;
		(mermaid as any)[ORIG_API_RENDER_KEY] = originalApiRender;

		const plugin = this;
		const route = async (original: Function, id: string, source: string, ...rest: any[]) => {
			const src = typeof source === "string" ? source : String(source ?? "");

			if (!ELK_MARKER_RE.test(src)) {
				return original(id, source, ...rest);
			}

			const cleanSource = src.replace(ELK_MARKER_RE, "");
			const transformed = `${ELK_FRONTMATTER}${cleanSource}`;
			return original(id, transformed, ...rest);
		};

		const patchedRender = async function (id: string, source: string, ...rest: any[]) {
			return route((mermaid as any)[ORIG_RENDER_KEY], id, source, ...rest);
		};
		(patchedRender as any)[PATCH_FLAG] = true;
		mermaid.render = patchedRender;

		if (mermaid.mermaidAPI && originalApiRender) {
			const patchedApiRender = async function (id: string, source: string, ...rest: any[]) {
				return route((mermaid as any)[ORIG_API_RENDER_KEY], id, source, ...rest);
			};
			(patchedApiRender as any)[PATCH_FLAG] = true;
			mermaid.mermaidAPI.render = patchedApiRender;
		}
	}
}
