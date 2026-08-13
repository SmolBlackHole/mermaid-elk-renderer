import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { getMermaidSourceDiagnostics, prepareElkSource, type PreparedElkSource } from "../src/renderer";
import { DEFAULT_SETTINGS, type MermaidElkRendererSettings } from "../src/settings-data";

const withSettings = (settings: Partial<MermaidElkRendererSettings>): MermaidElkRendererSettings => ({
    ...DEFAULT_SETTINGS,
    ...settings,
});

const assertPrepared = (value: PreparedElkSource | null): PreparedElkSource => {
    expect(value).not.toBeNull();
    return value!;
};

describe("prepareElkSource", () => {
    it("summarizes Gantt configuration without recording task text", () => {
        const source = [
            "gantt",
            "title Course Timeline",
            "axisFormat %Y",
            "todayMarker off",
            "section Lives",
            "Polybius :a1, -201, 60y",
            "Cicero :a2, -106, 60y",
        ].join("\n");

        const diagnostics = getMermaidSourceDiagnostics(source);
        expect(diagnostics).toEqual({
            characterCount: source.length,
            diagramType: "gantt",
            gantt: {
                axisFormat: "%Y",
                dateFormat: null,
                hasNegativeDate: true,
                todayMarker: "off",
            },
            hasFrontmatter: false,
            hasInitDirective: false,
            lineCount: 7,
        });
        expect(JSON.stringify(diagnostics)).not.toContain("Polybius");
        expect(JSON.stringify(diagnostics)).not.toContain("Cicero");
    });

    it("summarizes frontmatter and init directives for non-Gantt diagrams", () => {
        const source = [
            "---",
            "config:",
            "  theme: dark",
            "---",
            "%%{init: { 'theme': 'dark' }}%%",
            "flowchart TD",
            "A --> B",
        ].join("\n");

        expect(getMermaidSourceDiagnostics(source)).toMatchObject({
            diagramType: "flowchart",
            gantt: null,
            hasFrontmatter: true,
            hasInitDirective: true,
            lineCount: 7,
        });
    });

    it("leaves unmarked diagrams alone by default", () => {
        expect(prepareElkSource("graph TD\nA --> B")).toBeNull();
    });

    it("removes marker and injects elk frontmatter", () => {
        const prepared = assertPrepared(prepareElkSource("%% elk %%\ngraph TD\nA --> B"));
        expect(prepared.appliedBy).toBe("marker");
        expect(prepared.markerLine).toBe(1);
        expect(prepared.changedLayout).toBe(true);
        expect(prepared.hadExistingLayout).toBe(false);
        expect(prepared.hasFrontmatter).toBe(false);
        expect(prepared.source).toBe("---\nconfig:\n  layout: \"elk\"\n---\ngraph TD\nA --> B");
    });

    it("finds marker after frontmatter and init directives", () => {
        const prepared = assertPrepared(prepareElkSource([
            "---",
            "theme: base",
            "---",
            "%%{init: { 'theme': 'dark' }}%%",
            "%% elk %%",
            "graph TD",
            "A[\"1. First\"] --> B[\"2. Second\"]",
        ].join("\n")));

        expect(prepared.markerLine).toBe(5);
        expect(prepared.hasFrontmatter).toBe(true);
        expect(prepared.sanitizedListLabels).toBe(true);
        expect(prepared.source).toBe([
            "---",
            "theme: base",
            "config:",
            "  layout: \"elk\"",
            "---",
            "%%{init: { 'theme': 'dark' }}%%",
            "graph TD",
            "A[\"1\u200B. First\"] --> B[\"2\u200B. Second\"]",
        ].join("\n"));
    });

    it("supports custom marker text with regex characters", () => {
        const prepared = prepareElkSource(
            "%% elk+beta %%\ngraph TD\nA --> B",
            withSettings({ markerText: "elk+beta" }),
        );

        const nonNullPrepared = assertPrepared(prepared);
        expect(nonNullPrepared.appliedBy).toBe("marker");
        expect(nonNullPrepared.markerLine).toBe(1);
        expect(nonNullPrepared.source).toMatch(/layout: "elk"/);
    });

    it("can apply elk globally without a marker", () => {
        const prepared = prepareElkSource(
            "graph TD\nA --> B",
            withSettings({ applyElkToAllDiagrams: true }),
        );

        const nonNullPrepared = assertPrepared(prepared);
        expect(nonNullPrepared.appliedBy).toBe("global");
        expect(nonNullPrepared.markerLine).toBeNull();
        expect(nonNullPrepared.source).toMatch(/layout: "elk"/);
    });

    it("injects configured Mermaid look and theme", () => {
        const prepared = assertPrepared(prepareElkSource(
            "%% elk %%\nflowchart TD\nA --> B",
            withSettings({ defaultMermaidLook: "handDrawn", defaultMermaidTheme: "neutral" }),
        ));

        expect(prepared.source).toMatch(/layout: "elk"/);
        expect(prepared.source).toMatch(/look: handDrawn/);
        expect(prepared.source).toMatch(/theme: neutral/);
    });

    it("preserves existing Mermaid look and theme", () => {
        const prepared = assertPrepared(prepareElkSource([
            "---",
            "config:",
            "  look: classic",
            "  theme: forest",
            "---",
            "%% elk %%",
            "flowchart TD",
            "A --> B",
        ].join("\n"), withSettings({ defaultMermaidLook: "handDrawn", defaultMermaidTheme: "neutral" })));

        expect(prepared.source).toMatch(/look: classic/);
        expect(prepared.source).toMatch(/theme: forest/);
        expect(prepared.source).not.toMatch(/look: handDrawn/);
        expect(prepared.source).not.toMatch(/theme: neutral/);
    });

    it("matches the existing config indentation when adding elk", () => {
        const source = [
            "---",
            "config:",
            "  theme: forest",
            "---",
            "%% elk %%",
            "graph TD",
            "A --> B",
        ].join("\n");

        const prepared = assertPrepared(prepareElkSource(source));
        expect(prepared.source).toMatch(/\n {2}layout: "elk"\n/);
    });

    it("preserves four-space config indentation when adding elk", () => {
        const source = [
            "---",
            "config:",
            "    theme: forest",
            "---",
            "%% elk %%",
            "graph TD",
            "A --> B",
        ].join("\n");

        const prepared = assertPrepared(prepareElkSource(source));
        expect(prepared.source).toMatch(/\n {4}layout: "elk"\n/);
        expect(prepared.source).not.toMatch(/\n {2}layout: "elk"\n/);
    });

    it("uses the default indentation for an empty config block", () => {
        const source = [
            "---",
            "config:",
            "---",
            "%% elk %%",
            "graph TD",
            "A --> B",
        ].join("\n");

        const prepared = assertPrepared(prepareElkSource(source));
        expect(prepared.source).toMatch(/\n {2}layout: "elk"\n/);
    });

    it("applies configured defaults with the existing config indentation", () => {
        const source = [
            "---",
            "config:",
            "    theme: forest",
            "---",
            "%% elk %%",
            "graph TD",
            "A --> B",
        ].join("\n");

        const prepared = assertPrepared(prepareElkSource(source, withSettings({ defaultMermaidLook: "handDrawn" })));
        expect(prepared.source).toMatch(/\n {4}layout: "elk"\n/);
        expect(prepared.source).toMatch(/\n {4}look: handDrawn\n/);
    });

    it("keeps tab-indented diagram text separate from generated frontmatter", () => {
        const prepared = assertPrepared(prepareElkSource("%% elk %%\ngraph TD\n\tA --> B"));
        expect(prepared.source).toMatch(/\n {2}layout: "elk"\n/);
        expect(prepared.source).toMatch(/\n\tA --> B$/);
    });

    it("preserves existing layout when override is disabled", () => {
        const prepared = assertPrepared(prepareElkSource([
            "---",
            "config:",
            "  layout: dagre",
            "---",
            "%% elk %%",
            "graph TD",
            "A --> B",
        ].join("\n"), withSettings({ overrideExistingLayout: false })));

        expect(prepared.changedLayout).toBe(false);
        expect(prepared.hadExistingLayout).toBe(true);
        expect(prepared.preservedExistingLayout).toBe(true);
        expect(prepared.source).toMatch(/layout: dagre/);
        expect(prepared.source).not.toMatch(/layout: "elk"/);
    });

    it("replaces existing layout when override is enabled", () => {
        const prepared = assertPrepared(prepareElkSource([
            "---",
            "config:",
            "  layout: dagre",
            "---",
            "%% elk %%",
            "graph TD",
            "A --> B",
        ].join("\n")));

        expect(prepared.changedLayout).toBe(true);
        expect(prepared.hadExistingLayout).toBe(true);
        expect(prepared.preservedExistingLayout).toBe(false);
        expect(prepared.source).toMatch(/layout: "elk"/);
        expect(prepared.source).not.toMatch(/layout: dagre/);
    });

    it("can leave ordered-list-like labels unchanged", () => {
        const prepared = prepareElkSource(
            "%% elk %%\nflowchart TD\nA[1. First] --> B[2. Second]",
            withSettings({ escapeOrderedListLabels: false }),
        );

        const nonNullPrepared = assertPrepared(prepared);
        expect(nonNullPrepared.sanitizedListLabels).toBe(false);
        expect(nonNullPrepared.source).toMatch(/A\[1\. First\] --> B\[2\. Second\]/);
    });

    it("escapes ordered-list markers in HTML multiline labels without entity artifacts", () => {
        const prepared = assertPrepared(prepareElkSource([
            "%% elk %%",
            "flowchart TD",
            "  M[\"1. Motivation<br/>Warum AM?\"]",
            "  AD[\"2. Anforderung<br/>Begriffsdefinition\"]",
            "  SK[\"3. Systemkontext<br/>und Scope\"]",
            "  M --> AD",
            "  AD --> SK",
        ].join("\n")));

        expect(prepared.sanitizedListLabels).toBe(true);
        expect(prepared.source).toMatch(/M\["1\u200B\. Motivation<br\/>Warum AM\?"\]/);
        expect(prepared.source).toMatch(/AD\["2\u200B\. Anforderung<br\/>Begriffsdefinition"\]/);
        expect(prepared.source).not.toMatch(/1&#46; Motivation<br\/>/);
    });

    it("uses configured ordered-list regex replacement", () => {
        const prepared = assertPrepared(prepareElkSource(
            "%% elk %%\nflowchart TD\nA[\"4. Was vs. Wie\"] --> B[\"6. Kano-Modell\"]",
            withSettings({
                orderedListReplacement: "$1$2$3.)",
            }),
        ));

        expect(prepared.source).toMatch(/A\["4\.\) Was vs\. Wie"\]/);
        expect(prepared.source).toMatch(/B\["6\.\) Kano-Modell"\]/);
    });

    it("falls back to default regex patterns when custom regex is invalid", () => {
        const prepared = assertPrepared(prepareElkSource(
            "%% elk %%\nflowchart TD\nA[\"10. Rueckverfolgbarkeit\"]",
            withSettings({
                orderedListMarkerPattern: "(",
                quotedLabelPattern: "(",
                bracketLabelPattern: "(",
            }),
        ));

        expect(prepared.source).toMatch(/A\["10\u200B\. Rueckverfolgbarkeit"\]/);
    });

    it("matches every valid config indentation", () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 8 }),
            fc.constantFrom("\n", "\r\n"),
            (indentWidth, lineEnding) => {
                const indent = " ".repeat(indentWidth);
                const source = [
                    "---",
                    "config:",
                    `${indent}theme: forest`,
                    "---",
                    "%% elk %%",
                    "graph TD",
                    "A --> B",
                ].join(lineEnding);
                const prepared = assertPrepared(prepareElkSource(
                    source,
                    withSettings({ defaultMermaidLook: "handDrawn" }),
                ));

                expect(prepared.source).toContain(`\n${indent}layout: "elk"\n`);
                expect(prepared.source).toContain(`\n${indent}look: handDrawn\n`);
            },
        ));
    });
});
