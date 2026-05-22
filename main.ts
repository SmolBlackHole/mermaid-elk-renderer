import { loadMermaid, MarkdownView, Plugin } from "obsidian";
import elkLayouts from "@mermaid-js/layout-elk";
import { MermaidElkRendererSettingTab } from "./settings";
import { DEFAULT_SETTINGS, normalizeSettings, type MermaidElkRendererSettings } from "./settings-data";
import { prepareElkSource } from "./renderer";

const PATCH_FLAG = "__mermaidElkMarkerPatched";

type RenderFn = (id: string, source: string, ...rest: unknown[]) => Promise<unknown>;

interface MermaidLike extends Record<string, unknown> {
	render: RenderFn;
	mermaidAPI?: MermaidLike;
	registerLayoutLoaders?: (layouts: unknown) => void;
}

export default class MermaidElkRendererPlugin extends Plugin {
	settings: MermaidElkRendererSettings = { ...DEFAULT_SETTINGS };

	private _originalMermaid: MermaidLike | null = null;
	private _previousWindowMermaid: MermaidLike | undefined;
	private _patchedMermaid: MermaidLike | null = null;
	private _refreshTimer: number | null = null;

	private log(message: string, details?: Record<string, unknown>) {
		if (!this.settings.debugLogging) return;
		if (details) {
			console.log(`${this.manifest.name}: ${message}`, details);
			return;
		}

		console.log(`${this.manifest.name}: ${message}`);
	}

	async loadSettings() {
		const data: unknown = await this.loadData();
		this.settings = normalizeSettings(data);
	}

	async saveSettings() {
		this.settings = normalizeSettings(this.settings);
		await this.saveData(this.settings);
		this.queuePreviewRefresh();
	}

	private queuePreviewRefresh() {
		if (this._refreshTimer !== null) {
			window.clearTimeout(this._refreshTimer);
		}

		this._refreshTimer = window.setTimeout(() => {
			this._refreshTimer = null;
			this.refreshOpenMarkdownPreviews();
		}, 120);
	}

	private refreshOpenMarkdownPreviews() {
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		let refreshedLeaves = 0;

		for (const leaf of leaves) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) continue;
			if (view.getMode() !== "preview") continue;

			view.previewMode.rerender(true);
			refreshedLeaves++;
		}

		this.log("refreshed markdown previews", { refreshedLeaves });
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
		await this.loadSettings();
		this.addSettingTab(new MermaidElkRendererSettingTab(this.app, this));

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
		this.queuePreviewRefresh();
	}

	onunload() {
		this.log(`Unloading ${this.manifest.name} ${this.manifest.version}`);
		if (this._refreshTimer !== null) {
			window.clearTimeout(this._refreshTimer);
			this._refreshTimer = null;
		}

		const win = window as Window & { mermaid?: MermaidLike };
		if (this._originalMermaid && win.mermaid === this._patchedMermaid) {
			win.mermaid = this._previousWindowMermaid ?? this._originalMermaid;
			this.clearPatchFlag(this._originalMermaid);
			this._originalMermaid = null;
			this._previousWindowMermaid = undefined;
			this._patchedMermaid = null;
			this.log("renderer patch restored");
			this.refreshOpenMarkdownPreviews();
		} else if (this._originalMermaid) {
			this.log("renderer patch not restored because window.mermaid changed after patching");
		}
	}

	private wrapRender(original: RenderFn, thisArg: MermaidLike): RenderFn {
		return (id: string, source: string, ...rest: unknown[]): Promise<unknown> => {
			const src = typeof source === "string" ? source : String(source ?? "");
			const prepared = prepareElkSource(src, this.settings);
			if (!prepared) {
				return original.call(thisArg, id, source, ...rest);
			}

			this.log("routing diagram through ELK", {
				appliedBy: prepared.appliedBy,
				changedLayout: prepared.changedLayout,
				hadExistingLayout: prepared.hadExistingLayout,
				id,
				hasFrontmatter: prepared.hasFrontmatter,
				markerLine: prepared.markerLine,
				preservedExistingLayout: prepared.preservedExistingLayout,
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

