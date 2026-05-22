import assert from "node:assert/strict";
import test from "node:test";
import { prepareElkSource, type PreparedElkSource } from "../renderer";
import { DEFAULT_SETTINGS, type MermaidElkRendererSettings } from "../settings-data";

const withSettings = (settings: Partial<MermaidElkRendererSettings>): MermaidElkRendererSettings => ({
    ...DEFAULT_SETTINGS,
    ...settings,
});

const assertPrepared = (value: PreparedElkSource | null): PreparedElkSource => {
    assert.ok(value);
    return value;
};

void test("prepareElkSource leaves unmarked diagrams alone by default", () => {
    assert.equal(prepareElkSource("graph TD\nA --> B"), null);
});

void test("prepareElkSource removes marker and injects elk frontmatter", () => {
    const prepared = assertPrepared(prepareElkSource("%% elk %%\ngraph TD\nA --> B"));
    assert.equal(prepared.appliedBy, "marker");
    assert.equal(prepared.markerLine, 1);
    assert.equal(prepared.changedLayout, true);
    assert.equal(prepared.hadExistingLayout, false);
    assert.equal(prepared.hasFrontmatter, false);
    assert.equal(prepared.source, "---\nconfig:\n  layout: \"elk\"\n---\ngraph TD\nA --> B");
});

void test("prepareElkSource finds marker after frontmatter and init directives", () => {
    const prepared = assertPrepared(prepareElkSource([
        "---",
        "theme: base",
        "---",
        "%%{init: { 'theme': 'dark' }}%%",
        "%% elk %%",
        "graph TD",
        "A[\"1. First\"] --> B[\"2. Second\"]",
    ].join("\n")));

    assert.equal(prepared.markerLine, 5);
    assert.equal(prepared.hasFrontmatter, true);
    assert.equal(prepared.sanitizedListLabels, true);
    assert.equal(prepared.source, [
        "---",
        "theme: base",
        "config:",
        "  layout: \"elk\"",
        "---",
        "%%{init: { 'theme': 'dark' }}%%",
        "graph TD",
        "A[\"1\\. First\"] --> B[\"2\\. Second\"]",
    ].join("\n"));
});

void test("prepareElkSource supports custom marker text with regex characters", () => {
    const prepared = prepareElkSource(
        "%% elk+beta %%\ngraph TD\nA --> B",
        withSettings({ markerText: "elk+beta" }),
    );

    const nonNullPrepared = assertPrepared(prepared);
    assert.equal(nonNullPrepared.appliedBy, "marker");
    assert.equal(nonNullPrepared.markerLine, 1);
    assert.match(nonNullPrepared.source, /layout: "elk"/);
});

void test("prepareElkSource can apply elk globally without a marker", () => {
    const prepared = prepareElkSource(
        "graph TD\nA --> B",
        withSettings({ applyElkToAllDiagrams: true }),
    );

    const nonNullPrepared = assertPrepared(prepared);
    assert.equal(nonNullPrepared.appliedBy, "global");
    assert.equal(nonNullPrepared.markerLine, null);
    assert.match(nonNullPrepared.source, /layout: "elk"/);
});

void test("prepareElkSource preserves existing layout when override is disabled", () => {
    const prepared = assertPrepared(prepareElkSource([
        "---",
        "config:",
        "  layout: dagre",
        "---",
        "%% elk %%",
        "graph TD",
        "A --> B",
    ].join("\n"), withSettings({ overrideExistingLayout: false })));

    assert.equal(prepared.changedLayout, false);
    assert.equal(prepared.hadExistingLayout, true);
    assert.equal(prepared.preservedExistingLayout, true);
    assert.match(prepared.source, /layout: dagre/);
    assert.doesNotMatch(prepared.source, /layout: "elk"/);
});

void test("prepareElkSource replaces existing layout when override is enabled", () => {
    const prepared = assertPrepared(prepareElkSource([
        "---",
        "config:",
        "  layout: dagre",
        "---",
        "%% elk %%",
        "graph TD",
        "A --> B",
    ].join("\n")));

    assert.equal(prepared.changedLayout, true);
    assert.equal(prepared.hadExistingLayout, true);
    assert.equal(prepared.preservedExistingLayout, false);
    assert.match(prepared.source, /layout: "elk"/);
    assert.doesNotMatch(prepared.source, /layout: dagre/);
});

void test("prepareElkSource can leave ordered-list-like labels unchanged", () => {
    const prepared = prepareElkSource(
        "%% elk %%\ngraph TD\nA[1. First] --> B[2. Second]",
        withSettings({ escapeOrderedListLabels: false }),
    );

    const nonNullPrepared = assertPrepared(prepared);
    assert.equal(nonNullPrepared.sanitizedListLabels, false);
    assert.match(nonNullPrepared.source, /A\[1\. First\] --> B\[2\. Second\]/);
});

void test("prepareElkSource escapes ordered-list markers in HTML multiline labels without entity artifacts", () => {
    const prepared = assertPrepared(prepareElkSource([
        "%% elk %%",
        "flowchart TD",
        "  M[\"1. Motivation<br/>Warum AM?\"]",
        "  AD[\"2. Anforderung<br/>Begriffsdefinition\"]",
        "  SK[\"3. Systemkontext<br/>und Scope\"]",
        "  M --> AD",
        "  AD --> SK",
    ].join("\n")));

    assert.equal(prepared.sanitizedListLabels, true);
    assert.match(prepared.source, /M\["1\u200B\. Motivation<br\/>Warum AM\?"\]/);
    assert.match(prepared.source, /AD\["2\u200B\. Anforderung<br\/>Begriffsdefinition"\]/);
    assert.doesNotMatch(prepared.source, /1&#46; Motivation<br\/>/);
});