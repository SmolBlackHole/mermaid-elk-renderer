import { DEFAULT_SETTINGS, type MermaidElkRendererSettings } from "./settings-data";

const INIT_DIRECTIVE_LINE_RE = /^%%\{[\s\S]*\}%%$/;
const FRONTMATTER_DELIMITER = "---";
const FRONTMATTER_RE = /^\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?/;
const ELK_LAYOUT_FRONTMATTER = "---\nconfig:\n  layout: \"elk\"\n---\n";
const ORDERED_LIST_MARKER_RE = /(^|<br\s*\/?>)(\s*)(\d+)\.(?=\s)/gi;
const HTML_LINE_BREAK_RE = /<br\s*\/?>/i;
const ZERO_WIDTH_SPACE = "\u200B";
const QUOTED_LABEL_RE = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
const BRACKET_LABEL_RE = /\[([^[]\]\n]*(?:<br\s*\/?>[^[]\]\n]*)*)\]/gi;
const REGEX_SPECIAL_CHARS_RE = /[.*+?^${}()|[\]\\]/g;
const CONFIG_LINE_RE = /^config:\s*$/;
const FRONTMATTER_LAYOUT_RE = /^\s+layout\s*:/;
const INDENT_RE = /^\s*/;

type MarkerRemovalResult = {
    hasMarker: boolean;
    markerLine: number | null;
    source: string;
};

type LayoutConfigResult = {
    changedLayout: boolean;
    hadLayout: boolean;
    preservedExistingLayout: boolean;
    source: string;
};

export type PreparedElkSource = {
    appliedBy: "marker" | "global";
    changedLayout: boolean;
    hadExistingLayout: boolean;
    hasFrontmatter: boolean;
    markerLine: number | null;
    preservedExistingLayout: boolean;
    sanitizedListLabels: boolean;
    source: string;
};

function getMarkerText(settings: MermaidElkRendererSettings): string {
    return settings.markerText.trim() || DEFAULT_SETTINGS.markerText;
}

function escapeRegExp(value: string): string {
    return value.replace(REGEX_SPECIAL_CHARS_RE, "\\$&");
}

function isElkMarkerLine(line: string, settings: MermaidElkRendererSettings): boolean {
    const marker = escapeRegExp(getMarkerText(settings));
    return new RegExp(`^%%\\s*${marker}\\s*%%$`, "i").test(line.trim());
}

function sanitizeMarkdownListLabels(source: string, settings: MermaidElkRendererSettings): string {
    if (!settings.escapeOrderedListLabels) return source;

    const escapeOrderedListMarkers = (label: string) => {
        const escapedDot = HTML_LINE_BREAK_RE.test(label) ? `${ZERO_WIDTH_SPACE}.` : "\\.";
        return label.replace(ORDERED_LIST_MARKER_RE, (_, prefix: string, spaces: string, number: string) =>
            `${prefix}${spaces}${number}${escapedDot}`,
        );
    };

    return source
        .replace(QUOTED_LABEL_RE, (match, label: string) => `"${escapeOrderedListMarkers(label)}"`)
        .replace(BRACKET_LABEL_RE, (match, label: string) => `[${escapeOrderedListMarkers(label)}]`);
}

function removeElkMarker(source: string, settings: MermaidElkRendererSettings): MarkerRemovalResult {
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

        if (isElkMarkerLine(trimmed, settings)) {
            lines.splice(index, 1);
            return { hasMarker: true, markerLine: index + 1, source: lines.join("\n") };
        }

        return { hasMarker: false, markerLine: null, source };
    }

    return { hasMarker: false, markerLine: null, source };
}

function upsertElkLayoutInFrontmatter(body: string, settings: MermaidElkRendererSettings): LayoutConfigResult {
    const lines = body.split(/\r?\n/);
    const configIndex = lines.findIndex((line) => CONFIG_LINE_RE.test(line));

    if (configIndex === -1) {
        return {
            changedLayout: true,
            hadLayout: false,
            preservedExistingLayout: false,
            source: [...lines, "config:", "  layout: \"elk\""].join("\n").replace(/^\n/, ""),
        };
    }

    let insertIndex = configIndex + 1;
    for (let index = configIndex + 1; index < lines.length; index++) {
        const line = lines[index];
        if (line.trim() && !/^\s/.test(line)) break;

        if (FRONTMATTER_LAYOUT_RE.test(line)) {
            if (!settings.overrideExistingLayout) {
                return {
                    changedLayout: false,
                    hadLayout: true,
                    preservedExistingLayout: true,
                    source: lines.join("\n"),
                };
            }

            const indent = line.match(INDENT_RE)?.[0] ?? "  ";
            lines[index] = `${indent}layout: "elk"`;
            return {
                changedLayout: true,
                hadLayout: true,
                preservedExistingLayout: false,
                source: lines.join("\n"),
            };
        }

        insertIndex = index + 1;
    }

    lines.splice(insertIndex, 0, "  layout: \"elk\"");
    return {
        changedLayout: true,
        hadLayout: false,
        preservedExistingLayout: false,
        source: lines.join("\n"),
    };
}

function injectElkLayoutConfig(source: string, settings: MermaidElkRendererSettings): LayoutConfigResult {
    const match = source.match(FRONTMATTER_RE);
    if (!match) {
        return {
            changedLayout: true,
            hadLayout: false,
            preservedExistingLayout: false,
            source: `${ELK_LAYOUT_FRONTMATTER}${source}`,
        };
    }

    const updated = upsertElkLayoutInFrontmatter(match[1], settings);
    const rest = source.slice(match[0].length);
    return {
        ...updated,
        source: `${FRONTMATTER_DELIMITER}\n${updated.source}\n${FRONTMATTER_DELIMITER}\n${rest}`,
    };
}

export function prepareElkSource(
    source: string,
    settings: MermaidElkRendererSettings = DEFAULT_SETTINGS,
): PreparedElkSource | null {
    const marker = removeElkMarker(source, settings);
    const shouldApplyElk = marker.hasMarker || settings.applyElkToAllDiagrams;
    if (!shouldApplyElk) return null;

    const hasFrontmatter = FRONTMATTER_RE.test(marker.source);
    const cleanSource = sanitizeMarkdownListLabels(marker.source, settings);
    const layout = injectElkLayoutConfig(cleanSource, settings);
    return {
        appliedBy: marker.hasMarker ? "marker" : "global",
        changedLayout: layout.changedLayout,
        hadExistingLayout: layout.hadLayout,
        hasFrontmatter,
        markerLine: marker.markerLine,
        preservedExistingLayout: layout.preservedExistingLayout,
        sanitizedListLabels: cleanSource !== marker.source,
        source: layout.source,
    };
}