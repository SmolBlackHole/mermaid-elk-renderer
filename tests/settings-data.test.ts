import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/settings-data";

describe("normalizeSettings", () => {
    it("returns defaults for missing or invalid data", () => {
        expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
        expect(normalizeSettings("invalid")).toEqual(DEFAULT_SETTINGS);
    });

    it("keeps valid saved values and trims marker text", () => {
        expect(normalizeSettings({
            debugLogging: true,
            escapeOrderedListLabels: false,
            markerText: "  elk+beta  ",
            applyElkToAllDiagrams: true,
            overrideExistingLayout: false,
            defaultMermaidLook: "  handDrawn  ",
            defaultMermaidTheme: "  neutral  ",
            quotedLabelPattern: "  \"(.+?)\"  ",
            bracketLabelPattern: "  \\[(.+?)\\]  ",
            orderedListMarkerPattern: "  (^|<br\\s*\\/?>)(\\s*)(\\d+)\\.(?=\\s)  ",
            orderedListReplacement: "$1$2$3\\u200B.",
            useBundledMermaid: true,
        })).toEqual({
            debugLogging: true,
            escapeOrderedListLabels: false,
            markerText: "elk+beta",
            applyElkToAllDiagrams: true,
            overrideExistingLayout: false,
            defaultMermaidLook: "handDrawn",
            defaultMermaidTheme: "neutral",
            quotedLabelPattern: "\"(.+?)\"",
            bracketLabelPattern: "\\[(.+?)\\]",
            orderedListMarkerPattern: "(^|<br\\s*\\/?>)(\\s*)(\\d+)\\.(?=\\s)",
            orderedListReplacement: "$1$2$3\\u200B.",
            useBundledMermaid: true,
        });
    });

    it("falls back per invalid field", () => {
        expect(normalizeSettings({
            debugLogging: "yes",
            escapeOrderedListLabels: true,
            markerText: "   ",
            applyElkToAllDiagrams: false,
            overrideExistingLayout: "no",
            defaultMermaidLook: 123,
            defaultMermaidTheme: null,
            quotedLabelPattern: "   ",
            bracketLabelPattern: 123,
            orderedListMarkerPattern: null,
            orderedListReplacement: 123,
            useBundledMermaid: "yes",
        })).toEqual({
            ...DEFAULT_SETTINGS,
            escapeOrderedListLabels: true,
            applyElkToAllDiagrams: false,
        });
    });

    it("returns valid settings for arbitrary JSON values", () => {
        fc.assert(fc.property(fc.jsonValue(), (data) => {
            const settings = normalizeSettings(data);

            expect(typeof settings.debugLogging).toBe("boolean");
            expect(typeof settings.escapeOrderedListLabels).toBe("boolean");
            expect(typeof settings.applyElkToAllDiagrams).toBe("boolean");
            expect(typeof settings.overrideExistingLayout).toBe("boolean");
            expect(typeof settings.useBundledMermaid).toBe("boolean");
            expect(settings.markerText).toBe(settings.markerText.trim());
            expect(settings.markerText).not.toBe("");
            expect(settings.quotedLabelPattern).not.toBe("");
            expect(settings.bracketLabelPattern).not.toBe("");
            expect(settings.orderedListMarkerPattern).not.toBe("");
            expect(settings.orderedListReplacement).not.toBe("");
        }));
    });
});
