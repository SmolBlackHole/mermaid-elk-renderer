export interface MermaidElkRendererSettings {
    debugLogging: boolean;
    escapeOrderedListLabels: boolean;
    markerText: string;
    applyElkToAllDiagrams: boolean;
    overrideExistingLayout: boolean;
    defaultMermaidLook: string;
    defaultMermaidTheme: string;
    quotedLabelPattern: string;
    bracketLabelPattern: string;
    orderedListMarkerPattern: string;
    orderedListReplacement: string;
    useBundledMermaid: boolean;
}

export const BUNDLED_MERMAID_VERSION = "11.16.1";
export const DEFAULT_QUOTED_LABEL_PATTERN = String.raw`"([^"\\]*(?:\\.[^"\\]*)*)"`;
export const DEFAULT_BRACKET_LABEL_PATTERN = String.raw`\[([^[]\]\n]*(?:<br\s*\/?>[^[]\]\n]*)*)\]`;
export const DEFAULT_ORDERED_LIST_MARKER_PATTERN = String.raw`(^|<br\s*\/?>)(\s*)(\d+)\.(?=\s)`;
export const DEFAULT_ORDERED_LIST_REPLACEMENT = String.raw`$1$2$3\u200B.`;

export const DEFAULT_SETTINGS: MermaidElkRendererSettings = {
    debugLogging: false,
    escapeOrderedListLabels: true,
    markerText: "elk",
    applyElkToAllDiagrams: false,
    overrideExistingLayout: true,
    defaultMermaidLook: "",
    defaultMermaidTheme: "",
    quotedLabelPattern: DEFAULT_QUOTED_LABEL_PATTERN,
    bracketLabelPattern: DEFAULT_BRACKET_LABEL_PATTERN,
    orderedListMarkerPattern: DEFAULT_ORDERED_LIST_MARKER_PATTERN,
    orderedListReplacement: DEFAULT_ORDERED_LIST_REPLACEMENT,
    useBundledMermaid: false,
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
        defaultMermaidLook: typeof saved.defaultMermaidLook === "string"
            ? saved.defaultMermaidLook.trim()
            : DEFAULT_SETTINGS.defaultMermaidLook,
        defaultMermaidTheme: typeof saved.defaultMermaidTheme === "string"
            ? saved.defaultMermaidTheme.trim()
            : DEFAULT_SETTINGS.defaultMermaidTheme,
        quotedLabelPattern: typeof saved.quotedLabelPattern === "string" && saved.quotedLabelPattern.trim()
            ? saved.quotedLabelPattern.trim()
            : DEFAULT_SETTINGS.quotedLabelPattern,
        bracketLabelPattern: typeof saved.bracketLabelPattern === "string" && saved.bracketLabelPattern.trim()
            ? saved.bracketLabelPattern.trim()
            : DEFAULT_SETTINGS.bracketLabelPattern,
        orderedListMarkerPattern: typeof saved.orderedListMarkerPattern === "string" && saved.orderedListMarkerPattern.trim()
            ? saved.orderedListMarkerPattern.trim()
            : DEFAULT_SETTINGS.orderedListMarkerPattern,
        orderedListReplacement: typeof saved.orderedListReplacement === "string" && saved.orderedListReplacement
            ? saved.orderedListReplacement
            : DEFAULT_SETTINGS.orderedListReplacement,
        useBundledMermaid: typeof saved.useBundledMermaid === "boolean"
            ? saved.useBundledMermaid
            : DEFAULT_SETTINGS.useBundledMermaid,
    };
}
