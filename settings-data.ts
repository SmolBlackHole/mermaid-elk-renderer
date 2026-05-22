export interface MermaidElkRendererSettings {
    debugLogging: boolean;
    escapeOrderedListLabels: boolean;
    markerText: string;
    applyElkToAllDiagrams: boolean;
    overrideExistingLayout: boolean;
}

export const DEFAULT_SETTINGS: MermaidElkRendererSettings = {
    debugLogging: false,
    escapeOrderedListLabels: true,
    markerText: "elk",
    applyElkToAllDiagrams: false,
    overrideExistingLayout: true,
};

export function normalizeSettings(data: unknown): MermaidElkRendererSettings {
    if (!data || typeof data !== "object") return { ...DEFAULT_SETTINGS };

    const saved = data as Partial<Record<keyof MermaidElkRendererSettings, unknown>>;
    return {
        debugLogging: typeof saved.debugLogging === "boolean"
            ? saved.debugLogging
            : DEFAULT_SETTINGS.debugLogging,
        escapeOrderedListLabels: typeof saved.escapeOrderedListLabels === "boolean"
            ? saved.escapeOrderedListLabels
            : DEFAULT_SETTINGS.escapeOrderedListLabels,
        markerText: typeof saved.markerText === "string" && saved.markerText.trim()
            ? saved.markerText.trim()
            : DEFAULT_SETTINGS.markerText,
        applyElkToAllDiagrams: typeof saved.applyElkToAllDiagrams === "boolean"
            ? saved.applyElkToAllDiagrams
            : DEFAULT_SETTINGS.applyElkToAllDiagrams,
        overrideExistingLayout: typeof saved.overrideExistingLayout === "boolean"
            ? saved.overrideExistingLayout
            : DEFAULT_SETTINGS.overrideExistingLayout,
    };
}