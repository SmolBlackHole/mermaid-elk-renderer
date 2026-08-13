import {
    DEFAULT_BRACKET_LABEL_PATTERN,
    DEFAULT_ORDERED_LIST_MARKER_PATTERN,
    DEFAULT_ORDERED_LIST_REPLACEMENT,
    DEFAULT_QUOTED_LABEL_PATTERN,
    DEFAULT_SETTINGS,
    type MermaidElkRendererSettings,
} from "./settings-data";

const INIT_DIRECTIVE_LINE_RE = /^%%\{[\s\S]*\}%%$/;
const FRONTMATTER_DELIMITER = "---";
const FRONTMATTER_RE = /^\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?/;
const REGEX_SPECIAL_CHARS_RE = /[.*+?^${}()|[\]\\]/g;
const CONFIG_LINE_RE = /^config:\s*$/;
const FRONTMATTER_LAYOUT_RE = /^\s+layout\s*:/;
const FRONTMATTER_LOOK_RE = /^\s+look\s*:/;
const FRONTMATTER_THEME_RE = /^\s+theme\s*:/;
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

type ConfigDefaults = {
    look: string;
    theme: string;
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

export type MermaidSourceDiagnostics = {
    characterCount: number;
    diagramType: string | null;
    gantt: {
        axisFormat: string | null;
        dateFormat: string | null;
        hasNegativeDate: boolean;
        todayMarker: "custom" | "default" | "off";
    } | null;
    hasFrontmatter: boolean;
    hasInitDirective: boolean;
    lineCount: number;
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

function createRegExp(pattern: string, fallbackPattern: string, flags: string): RegExp {
    try {
        return new RegExp(pattern, flags);
    } catch {
        return new RegExp(fallbackPattern, flags);
    }
}

function decodeReplacementEscapes(value: string): string {
    return value
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t");
}

function getConfigDefaults(settings: MermaidElkRendererSettings): ConfigDefaults {
    return {
        look: settings.defaultMermaidLook.trim(),
        theme: settings.defaultMermaidTheme.trim(),
    };
}

function buildConfigLines(settings: MermaidElkRendererSettings): string[] {
    const configDefaults = getConfigDefaults(settings);
    const lines = ["config:", "  layout: \"elk\""];
    if (configDefaults.look) lines.push(`  look: ${configDefaults.look}`);
    if (configDefaults.theme) lines.push(`  theme: ${configDefaults.theme}`);
    return lines;
}

function getDiagramType(source: string): string | null {
    const withoutFrontmatter = source.replace(FRONTMATTER_RE, "");
    for (const line of withoutFrontmatter.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || INIT_DIRECTIVE_LINE_RE.test(trimmed) || trimmed.startsWith("%%")) continue;

        return trimmed.match(/^([a-z][\w-]*)\b/i)?.[1].toLowerCase() ?? null;
    }

    return null;
}

function getGanttDirective(lines: string[], directive: string): string | null {
    const directiveRe = new RegExp(`^\\s*${directive}\\s+(.+?)\\s*$`, "i");
    for (const line of lines) {
        const match = line.match(directiveRe);
        if (match) return match[1];
    }

    return null;
}

export function getMermaidSourceDiagnostics(source: string): MermaidSourceDiagnostics {
    const lines = source.split(/\r?\n/);
    const diagramType = getDiagramType(source);
    const todayMarker = getGanttDirective(lines, "todayMarker");

    return {
        characterCount: source.length,
        diagramType,
        gantt: diagramType === "gantt"
            ? {
                axisFormat: getGanttDirective(lines, "axisFormat"),
                dateFormat: getGanttDirective(lines, "dateFormat"),
                hasNegativeDate: lines.some((line) => line.includes(":") && /(?:^|,)\s*-\d/.test(line)),
                todayMarker: todayMarker?.toLowerCase() === "off"
                    ? "off"
                    : todayMarker
                        ? "custom"
                        : "default",
            }
            : null,
        hasFrontmatter: FRONTMATTER_RE.test(source),
        hasInitDirective: source.includes("%%{"),
        lineCount: source ? lines.length : 0,
    };
}

function sanitizeMarkdownListLabels(source: string, settings: MermaidElkRendererSettings): string {
    if (!settings.escapeOrderedListLabels) return source;

    const orderedListMarkerRe = createRegExp(
        settings.orderedListMarkerPattern,
        DEFAULT_ORDERED_LIST_MARKER_PATTERN,
        "gi",
    );
    const quotedLabelRe = createRegExp(settings.quotedLabelPattern, DEFAULT_QUOTED_LABEL_PATTERN, "g");
    const bracketLabelRe = createRegExp(settings.bracketLabelPattern, DEFAULT_BRACKET_LABEL_PATTERN, "gi");
    const orderedListReplacement = decodeReplacementEscapes(
        settings.orderedListReplacement || DEFAULT_ORDERED_LIST_REPLACEMENT,
    );

    const escapeOrderedListMarkers = (label: string) => label.replace(orderedListMarkerRe, orderedListReplacement);

    return source
        .replace(quotedLabelRe, (match, label: string) => `"${escapeOrderedListMarkers(label)}"`)
        .replace(bracketLabelRe, (match, label: string) => `[${escapeOrderedListMarkers(label)}]`);
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
    const configDefaults = getConfigDefaults(settings);

    if (configIndex === -1) {
        return {
            changedLayout: true,
            hadLayout: false,
            preservedExistingLayout: false,
            source: [...lines, ...buildConfigLines(settings)].join("\n").replace(/^\n/, ""),
        };
    }

    const configIndent = getConfigChildIndent(lines, configIndex);
    let insertIndex = configIndex + 1;
    let hasLayout = false;
    let hasLook = false;
    let hasTheme = false;
    let replacedExistingLayout = false;
    for (let index = configIndex + 1; index < lines.length; index++) {
        const line = lines[index];
        if (line.trim() && !/^\s/.test(line)) break;

        if (FRONTMATTER_LAYOUT_RE.test(line)) {
            hasLayout = true;
            if (!settings.overrideExistingLayout) {
                if (FRONTMATTER_LOOK_RE.test(line)) hasLook = true;
                if (FRONTMATTER_THEME_RE.test(line)) hasTheme = true;
                return {
                    changedLayout: false,
                    hadLayout: true,
                    preservedExistingLayout: true,
                    source: insertMissingConfigDefaults(lines, insertIndex, configDefaults, hasLook, hasTheme, configIndent).join("\n"),
                };
            }

            const indent = line.match(INDENT_RE)?.[0] ?? "  ";
            lines[index] = `${indent}layout: "elk"`;
            replacedExistingLayout = true;
        }

        if (FRONTMATTER_LOOK_RE.test(line)) hasLook = true;
        if (FRONTMATTER_THEME_RE.test(line)) hasTheme = true;

        insertIndex = index + 1;
    }

    if (!hasLayout) {
        lines.splice(insertIndex, 0, `${configIndent}layout: "elk"`);
        insertIndex++;
    }

    const updatedLines = insertMissingConfigDefaults(lines, insertIndex, configDefaults, hasLook, hasTheme, configIndent);
    return {
        changedLayout: replacedExistingLayout || !hasLayout,
        hadLayout: hasLayout,
        preservedExistingLayout: false,
        source: updatedLines.join("\n"),
    };
}

function getConfigChildIndent(lines: string[], configIndex: number): string {
    for (let index = configIndex + 1; index < lines.length; index++) {
        const line = lines[index];
        if (line.trim() && !/^\s/.test(line)) break;
        if (line.trim()) return line.match(INDENT_RE)?.[0] ?? "  ";
    }

    return "  ";
}

function insertMissingConfigDefaults(
    lines: string[],
    insertIndex: number,
    configDefaults: ConfigDefaults,
    hasLook: boolean,
    hasTheme: boolean,
    configIndent: string,
): string[] {
    const additions: string[] = [];
    if (configDefaults.look && !hasLook) additions.push(`${configIndent}look: ${configDefaults.look}`);
    if (configDefaults.theme && !hasTheme) additions.push(`${configIndent}theme: ${configDefaults.theme}`);
    if (additions.length) lines.splice(insertIndex, 0, ...additions);
    return lines;
}

function injectElkLayoutConfig(source: string, settings: MermaidElkRendererSettings): LayoutConfigResult {
    const match = source.match(FRONTMATTER_RE);
    if (!match) {
        return {
            changedLayout: true,
            hadLayout: false,
            preservedExistingLayout: false,
            source: `${FRONTMATTER_DELIMITER}\n${buildConfigLines(settings).join("\n")}\n${FRONTMATTER_DELIMITER}\n${source}`,
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
