export const PATCH_FLAG = "__mermaidElkMarkerPatched";

export type RenderFn = (id: string, source: string, ...rest: unknown[]) => Promise<unknown>;
export type PluginLog = (message: string, details?: Record<string, unknown>) => void;

export interface MermaidLike extends Record<string, unknown> {
    render: RenderFn;
    mermaidAPI?: MermaidLike;
    getConfig?: () => unknown;
    initialize?: (config: unknown) => void;
    registerLayoutLoaders?: (layouts: unknown) => void;
}

export interface MermaidSelection {
    mermaid: MermaidLike;
    elkLayouts: unknown;
    restoreMermaid?: MermaidLike;
    source: string;
}