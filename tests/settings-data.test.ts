import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, normalizeSettings } from "../settings-data";

void test("normalizeSettings returns defaults for missing or invalid data", () => {
    assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
    assert.deepEqual(normalizeSettings("invalid"), DEFAULT_SETTINGS);
});

void test("normalizeSettings keeps valid saved values and trims marker text", () => {
    assert.deepEqual(
        normalizeSettings({
            debugLogging: true,
            escapeOrderedListLabels: false,
            markerText: "  elk+beta  ",
            applyElkToAllDiagrams: true,
            overrideExistingLayout: false,
            useBundledMermaid: true,
        }),
        {
            debugLogging: true,
            escapeOrderedListLabels: false,
            markerText: "elk+beta",
            applyElkToAllDiagrams: true,
            overrideExistingLayout: false,
            useBundledMermaid: true,
        },
    );
});

void test("normalizeSettings falls back per invalid field", () => {
    assert.deepEqual(
        normalizeSettings({
            debugLogging: "yes",
            escapeOrderedListLabels: true,
            markerText: "   ",
            applyElkToAllDiagrams: false,
            overrideExistingLayout: "no",
            useBundledMermaid: "yes",
        }),
        {
            ...DEFAULT_SETTINGS,
            escapeOrderedListLabels: true,
            applyElkToAllDiagrams: false,
        },
    );
});