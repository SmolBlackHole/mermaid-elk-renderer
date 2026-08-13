import type { MermaidElkRendererSettings } from "./settings-data";
import { getMermaidSourceDiagnostics, prepareElkSource } from "./renderer";
import { PluginLogger } from "./logger";
import { PATCH_FLAG, type MermaidLike, type MermaidSelection, type RenderFn } from "./mermaid-types";

const UNKNOWN_DIAGRAM_ERROR_RE = /UnknownDiagramError|No diagram type detected matching given configuration/i;
const BETA_DIAGRAM_TYPE_RE = /(^|\n)\s*([a-z][\w-]*-beta)\b/i;

export class MermaidRendererPatch {
    private originalMermaid: MermaidLike | null = null;
    private previousWindowMermaid: MermaidLike | undefined;
    private patchedMermaid: MermaidLike | null = null;
    private registeredElkLayouts = new WeakSet<MermaidLike>();
    private activeBundledMermaidSetting: boolean | null = null;
    private activeMermaidSource: string | null = null;
    private shownBundledMermaidHint = false;

    constructor(
        private getSettings: () => MermaidElkRendererSettings,
        private logger: PluginLogger,
        private notifyUser: (message: string) => void,
    ) { }

    get activeUseBundledMermaid() {
        return this.activeBundledMermaidSetting;
    }

    install(selection: MermaidSelection, useBundledMermaid: boolean) {
        const mermaid = selection.mermaid;
        if (PATCH_FLAG in mermaid) {
            this.logger.debug("mermaid already patched, skipping", { source: selection.source });
            return;
        }

        this.registerElkLayouts(mermaid, selection.elkLayouts, selection.source);
        this.patchMarkerRouting(mermaid, selection.restoreMermaid, selection.source);
        this.activeBundledMermaidSetting = useBundledMermaid;
        this.activeMermaidSource = selection.source;
        this.logger.debug("renderer patch installed", {
            hasMermaidAPI: Boolean(mermaid.mermaidAPI),
            source: selection.source,
        });
    }

    restore() {
        const win = window as Window & { mermaid?: MermaidLike };
        if (this.originalMermaid && win.mermaid === this.patchedMermaid) {
            win.mermaid = this.previousWindowMermaid ?? this.originalMermaid;
            this.clearPatchFlag(this.originalMermaid);
            this.originalMermaid = null;
            this.previousWindowMermaid = undefined;
            this.patchedMermaid = null;
            this.activeBundledMermaidSetting = null;
            this.activeMermaidSource = null;
            this.logger.debug("renderer patch restored");
            return true;
        }

        if (this.originalMermaid) {
            this.logger.debug("renderer patch not restored because window.mermaid changed after patching");
        }

        return false;
    }

    private registerElkLayouts(mermaid: MermaidLike, elkLayouts: unknown, source: string) {
        if (typeof mermaid.registerLayoutLoaders !== "function") {
            this.logger.debug("registerLayoutLoaders unavailable on Mermaid instance", { source });
            return;
        }

        if (this.registeredElkLayouts.has(mermaid)) {
            this.logger.debug("ELK layout loaders already registered", { source });
            return;
        }

        mermaid.registerLayoutLoaders(elkLayouts);
        this.registeredElkLayouts.add(mermaid);
        this.logger.debug("registered ELK layout loaders", { source });
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

    private wrapRender(original: RenderFn, thisArg: MermaidLike): RenderFn {
        return (id: string, source: string, ...rest: unknown[]): Promise<unknown> => {
            const src = typeof source === "string" ? source : String(source ?? "");
            const startedAt = Date.now();
            const diagnostics = getMermaidSourceDiagnostics(src);
            const prepared = prepareElkSource(src, this.getSettings());
            const sourceToRender = prepared?.source ?? source;

            this.logger.debug("starting Mermaid render", {
                ...diagnostics,
                diagramId: id,
                provider: this.activeMermaidSource ?? "unknown",
                routedThroughElk: Boolean(prepared),
                sourceChanged: prepared ? prepared.source !== src : false,
            });

            if (prepared) {
                this.logger.debug("prepared ELK source", {
                    appliedBy: prepared.appliedBy,
                    changedLayout: prepared.changedLayout,
                    diagramId: id,
                    hadExistingLayout: prepared.hadExistingLayout,
                    markerLine: prepared.markerLine,
                    preservedExistingLayout: prepared.preservedExistingLayout,
                    sanitizedListLabels: prepared.sanitizedListLabels,
                });
            }

            try {
                return original
                    .call(thisArg, id, sourceToRender, ...rest)
                    .then((result) => {
                        this.logger.debug("finished Mermaid render", {
                            diagramId: id,
                            durationMs: Date.now() - startedAt,
                            provider: this.activeMermaidSource ?? "unknown",
                            routedThroughElk: Boolean(prepared),
                        });
                        return result;
                    })
                .catch((error) => {
                    this.logger.warn("Mermaid render failed", {
                        ...diagnostics,
                        diagramId: id,
                        durationMs: Date.now() - startedAt,
                        error: this.getErrorDiagnostics(error),
                        provider: this.activeMermaidSource ?? "unknown",
                        routedThroughElk: Boolean(prepared),
                    });
                    const compatibilityError = this.toBundledMermaidCompatibilityError(error, src, id);
                    throw compatibilityError ?? error;
                });
            } catch (error) {
                this.logger.warn("Mermaid render failed", {
                    ...diagnostics,
                    diagramId: id,
                    durationMs: Date.now() - startedAt,
                    error: this.getErrorDiagnostics(error),
                    provider: this.activeMermaidSource ?? "unknown",
                    routedThroughElk: Boolean(prepared),
                });
                const compatibilityError = this.toBundledMermaidCompatibilityError(error, src, id);
                return Promise.reject(compatibilityError ?? this.toError(error));
            }
        };
    }

    private getErrorDiagnostics(error: unknown) {
        const message = this.toErrorMessage(error);
        return {
            hasParseError: /parse error/i.test(message),
            hasUnknownDiagramError: UNKNOWN_DIAGRAM_ERROR_RE.test(message),
            kind: error instanceof Error ? error.name : typeof error,
            messageLength: message.length,
        };
    }

    private toBundledMermaidCompatibilityError(error: unknown, source: string, id: string): Error | null {
        const settings = this.getSettings();
        if (settings.useBundledMermaid) return null;

        const errorMessage = this.toErrorMessage(error);
        if (!UNKNOWN_DIAGRAM_ERROR_RE.test(errorMessage)) return null;

        const diagramType = this.extractDiagramType(source);
        if (!diagramType || !diagramType.endsWith("-beta")) return null;

        this.logger.debug("detected unsupported diagram type on Obsidian Mermaid", {
            diagramId: id,
            diagramType,
            errorMessage,
        });

        if (!this.shownBundledMermaidHint) {
            this.shownBundledMermaidHint = true;
            this.notifyUser(
                `Diagram type '${diagramType}' is not supported by Obsidian's Mermaid. Enable 'Use bundled Mermaid 11' in this plugin's settings.`,
            );
        }

        return new Error(
            `Diagram type '${diagramType}' is not supported by Obsidian's Mermaid. Enable 'Use bundled Mermaid 11' in Mermaid ELK Renderer settings and re-render the note.`,
        );
    }

    private extractDiagramType(source: string): string | null {
        const normalizedSource = source.replace(/^---[\s\S]*?---\s*/m, "");
        const match = normalizedSource.match(BETA_DIAGRAM_TYPE_RE);
        if (!match) return null;

        return match[2].trim();
    }

    private toErrorMessage(error: unknown): string {
        if (typeof error === "string") return error;
        if (typeof error === "number" || typeof error === "boolean" || typeof error === "bigint") {
            return `${error}`;
        }
        if (typeof error === "symbol") {
            return error.description ?? "symbol";
        }
        if (error && typeof error === "object") {
            const maybeMessage = (error as { message?: unknown }).message;
            if (typeof maybeMessage === "string") return maybeMessage;

            try {
                return JSON.stringify(error);
            } catch {
                return "[unserializable error object]";
            }
        }

        return "";
    }

    private toError(error: unknown): Error {
        if (error instanceof Error) return error;
        return new Error(this.toErrorMessage(error) || "Mermaid render failed");
    }

    private patchMarkerRouting(mermaid: MermaidLike, restoreMermaid?: MermaidLike, source?: string) {
        const win = window as Window & { mermaid?: MermaidLike };
        this.originalMermaid = mermaid;
        this.previousWindowMermaid = restoreMermaid ?? win.mermaid;
        this.activeMermaidSource = source ?? null;
        this.markPatched(mermaid);

        const patchedRender = this.wrapRender(mermaid.render, mermaid);

        let patchedApi: MermaidLike | undefined;
        if (mermaid.mermaidAPI && typeof mermaid.mermaidAPI.render === "function") {
            const api = mermaid.mermaidAPI;
            const patchedApiRender = this.wrapRender(api.render, api);
            patchedApi = new Proxy(api, {
                get: (target, prop, receiver) => prop === "render" ? patchedApiRender : Reflect.get(target, prop, receiver) as unknown,
                has: (target, prop) => prop === PATCH_FLAG || prop in target,
            });
        }

        const patchedMermaid = new Proxy(mermaid, {
            get: (target, prop, receiver) => {
                if (prop === "render") return patchedRender;
                if (prop === "mermaidAPI" && patchedApi) return patchedApi;
                return Reflect.get(target, prop, receiver) as unknown;
            },
            has: (target, prop) => prop === PATCH_FLAG || prop in target,
        });

        this.patchedMermaid = patchedMermaid;
        win.mermaid = patchedMermaid;
    }
}
